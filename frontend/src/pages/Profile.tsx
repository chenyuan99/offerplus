import { useState, useEffect } from 'react';
import { uploadResume } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { supabase, type User } from '../lib/supabase';
import { Download, Upload } from 'lucide-react';

interface UserMetadata {
  first_name?: string;
  last_name?: string;
  username?: string;
  [key: string]: string | undefined;
}

type ExtendedUser = User & {
  user_metadata: UserMetadata;
};

interface Address {
  street1: string;
  street2?: string;
  country: string;
  state: string;
  zip: string;
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
  const [address, setAddress] = useState<Address>({
    street1: '',
    street2: '',
    country: 'United States',
    state: '',
    zip: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const getUsername = (userEmail: string | undefined) => {
    return userEmail ? userEmail.split('@')[0] : 'user';
  };

  const getUserMetadata = () => {
    if (!user) return { first_name: '', last_name: '', username: 'user' };
    return {
      first_name: user.user_metadata?.first_name || '',
      last_name: user.user_metadata?.last_name || '',
      username: user.user_metadata?.username || getUsername(user.email)
    };
  };

  const { first_name, last_name, username: userUsername } = getUserMetadata();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user as ExtendedUser);
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user as ExtendedUser);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex flex-col justify-center">
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
      event.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log('Profile updated:', { address });
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">Manage your account settings and resume</p>
        </div>

        {/* Account Information Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-gray-900 font-medium">@{userUsername}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Details</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={first_name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={last_name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                id="address"
                value={address.street1}
                onChange={(e) => setAddress({ ...address, street1: e.target.value })}
                placeholder="1234 Main St"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41]"
              />
            </div>

            <div>
              <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2 <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                id="address2"
                value={address.street2}
                onChange={(e) => setAddress({ ...address, street2: e.target.value })}
                placeholder="Apartment or suite"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  id="country"
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41]"
                >
                  <option value="United States">United States</option>
                </select>
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  id="state"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41]"
                >
                  <option value="">Select State</option>
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                </select>
              </div>
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="zip"
                  value={address.zip}
                  onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  placeholder="12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#861F41] text-white px-6 py-2 rounded-md font-medium hover:bg-[#621531] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#861F41] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Resume Upload Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Resume</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload Resume <span className="text-gray-500">(PDF or Word, max 5MB)</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 cursor-pointer
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-[#861F41] file:text-white
                  hover:file:bg-[#621531]
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isUploading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#861F41]"></div>
                </div>
              )}
            </div>
            {uploadError && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <span className="mr-1">⚠️</span> {uploadError}
              </p>
            )}
          </div>

          {resumeInfo && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Current Resume
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">File Name</p>
                  <p className="text-gray-900 font-medium">{resumeInfo.fileName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">File Size</p>
                  <p className="text-gray-900">{formatFileSize(resumeInfo.fileSize)}</p>
                </div>
                <a
                  href={resumeInfo.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#861F41] bg-[#861F41]/10 rounded-md hover:bg-[#861F41]/20 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Resume
                </a>
              </div>
            </div>
          )}

          {!resumeInfo && (
            <div className="bg-gray-50 rounded-lg p-8 border border-dashed border-gray-300 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No resume uploaded yet</p>
              <p className="text-sm text-gray-500 mt-1">Upload a file using the button above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
