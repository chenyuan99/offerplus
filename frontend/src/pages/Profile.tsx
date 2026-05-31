import { useState, useEffect } from 'react';
import { uploadResume } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Resume } from '../components/Resume';
import { supabase, type User } from '../lib/supabase';
import type { ImportedProfile } from '../types/profile';

// Define the user metadata type
interface UserMetadata {
  first_name?: string;
  last_name?: string;
  username?: string;
  [key: string]: string | undefined; // Allow for additional properties
}

// Extend the User type to include additional fields
type ExtendedUser = User & {
  user_metadata: UserMetadata;
}

interface Address {
  street1: string;
  street2?: string;
  country: string;
  state: string;
  zip: string;
}

interface ImportedFields {
  firstName: string;
  lastName: string;
  phone: string;
}


interface ResumeInfo {
  publicUrl: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  
  // Get username from email if user_metadata.username is not available
  const getUsername = (userEmail: string | undefined) => {
    return userEmail ? userEmail.split('@')[0] : 'user';
  };
  
  // Safely get user metadata with defaults
  const getUserMetadata = () => {
    if (!user) return { first_name: '', last_name: '', username: 'user' };
    return {
      first_name: user.user_metadata?.first_name || '',
      last_name: user.user_metadata?.last_name || '',
      username: user.user_metadata?.username || getUsername(user.email)
    };
  };
  
  const { first_name, last_name, username: userUsername } = getUserMetadata();
  const [address, setAddress] = useState<Address>({
    street1: '',
    street2: '',
    country: 'United States',
    state: '',
    zip: '',
  });
  const [importedFields, setImportedFields] = useState<ImportedFields>({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [saveInfo, setSaveInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#861F41]"></div>
        </div>
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadResume(file);
      setResumeInfo(result);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload resume');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      // Clear the input value to allow uploading the same file again
      event.target.value = '';
    }
  };

  const handleProfileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(false);

    try {
      const text = await file.text();
      const data: ImportedProfile = JSON.parse(text);

      setImportedFields({
        firstName: data.nameData?.firstName || '',
        lastName: data.nameData?.lastName || '',
        phone: data.contactData?.phoneNumber || '',
      });

      setAddress({
        street1: data.addressData?.line1 || '',
        street2: '',
        country: data.addressData?.country || 'United States',
        state: data.addressData?.state || '',
        zip: data.addressData?.postalCode || '',
      });

      if (data.resumeData?.resumeBase64 && data.resumeData?.fileName) {
        const byteString = atob(data.resumeData.resumeBase64);
        const byteArray = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
          byteArray[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const resumeFile = new File([blob], data.resumeData.fileName, { type: 'application/pdf' });

        setIsUploading(true);
        try {
          const result = await uploadResume(resumeFile);
          setResumeInfo(result);
        } catch (uploadErr) {
          setImportError(`Profile imported but resume upload failed: ${uploadErr instanceof Error ? uploadErr.message : 'Unknown error'}`);
        } finally {
          setIsUploading(false);
        }
      }

      setImportSuccess(true);
    } catch (err) {
      setImportError(err instanceof Error ? `Failed to parse profile JSON: ${err.message}` : 'Failed to parse profile JSON');
    } finally {
      event.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // TODO: Implement profile update logic
      console.log('Profile updated:', { address, saveInfo });
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Profile Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Personal details and resume
            </p>
          </div>

          <div className="border-t border-gray-200">
            {/* User Information */}
            <dl>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Username</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {userUsername}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user?.email}
                </dd>
              </div>
            </dl>

            {/* Resume Section */}
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <Resume />
            </div>

            {/* Profile Information */}
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Profile Information
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Personal details
              </p>
            </div>

            <div className="border-t border-gray-200">
              {/* Profile JSON Import */}
              <div className="px-4 py-5 sm:px-6 bg-blue-50 border-b border-blue-100">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Import from Profile JSON</h4>
                <p className="text-xs text-blue-700 mb-3">
                  Upload a profile JSON file exported from a job board to auto-fill your details.
                </p>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleProfileImport}
                  className="block text-sm text-blue-800
                    file:mr-3 file:py-1.5 file:px-3
                    file:rounded file:border-0
                    file:text-xs file:font-semibold
                    file:bg-blue-100 file:text-blue-700
                    hover:file:bg-blue-200"
                />
                {importError && <p className="mt-2 text-xs text-red-600">{importError}</p>}
                {importSuccess && <p className="mt-2 text-xs text-green-600">Profile imported successfully.</p>}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={importedFields.firstName || first_name || ''}
                      placeholder="First Name"
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={importedFields.lastName || last_name || ''}
                      placeholder="Last Name"
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      id="username"
                      value={userUsername}
                      disabled
                      className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={importedFields.phone}
                    onChange={(e) => setImportedFields({ ...importedFields, phone: e.target.value })}
                    placeholder="5551234567"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={address.street1}
                    onChange={(e) => setAddress({ ...address, street1: e.target.value })}
                    placeholder="1234 Main St"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="address2" className="block text-sm font-medium text-gray-700">
                    Address 2 <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="address2"
                    value={address.street2}
                    onChange={(e) => setAddress({ ...address, street2: e.target.value })}
                    placeholder="Apartment or suite"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <select
                      id="country"
                      value={address.country}
                      onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="">Choose...</option>
                      <option value="United States">United States</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <select
                      id="state"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="">Choose...</option>
                      <option value="CA">California</option>
                      {/* Add more states as needed */}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                      Zip
                    </label>
                    <input
                      type="text"
                      id="zip"
                      value={address.zip}
                      onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-xl font-semibold mb-6">Your PDF Resume</h4>
                  <div className="w-full h-[500px] border border-gray-300 rounded-lg">
                    <object
                      data="https://icc.fyi/icc%E6%B1%87%E6%80%BB.pdf"
                      type="application/pdf"
                      width="100%"
                      height="100%"
                      className="rounded-lg"
                    >
                      <p className="p-4 text-gray-700">
                        Unable to display PDF file.{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-700">
                          Download
                        </a>{' '}
                        instead.
                      </p>
                    </object>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="save-info"
                    type="checkbox"
                    checked={saveInfo}
                    onChange={(e) => setSaveInfo(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="save-info" className="ml-2 block text-sm text-gray-900">
                    Save this information for next time
                  </label>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => window.open('https://www.linkedin.com/oauth/v2/authorization', '_blank')}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Connect to LinkedIn
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mt-8">
              <h4 className="text-xl font-semibold mb-6">Resume Upload</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Resume (PDF or Word document, max 5MB)
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      disabled={isUploading}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {isUploading && (
                      <div className="ml-3 text-sm text-gray-500 animate-pulse">
                        Uploading...
                      </div>
                    )}
                  </div>
                  {uploadError && (
                    <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                  )}
                </div>

                {resumeInfo && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Current Resume</h5>
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm text-gray-500">@{user?.email?.split('@')[0] || 'user'}</p>
                      <p className="text-sm text-gray-500">@{userUsername}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(resumeInfo.fileSize)}
                      </p>
                      <div className="flex items-center space-x-4">
                        <a
                          href={resumeInfo.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Resume
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
