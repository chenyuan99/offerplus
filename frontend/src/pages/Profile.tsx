import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ProfileFormData, ResumeInfo, ExtendedUser, UserMetadata } from '../types/profile';

// Utility function to upload files to Supabase Storage
const uploadFile = async (file: File, bucket: string, path: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;
  
  const { data, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    filePath: data.path,
    publicUrl,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  };
};

// Upload resume to storage
const uploadResume = (file: File) => {
  return uploadFile(file, 'resumes', 'user-uploads');
};

// Upload profile picture to storage
const uploadProfilePicture = (file: File) => {
  return uploadFile(file, 'avatars', 'profile-pictures');
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
  
  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    title: string;
    bio: string;
    website: string;
    github: string;
    linkedin: string;
    twitter: string;
    skills: string;
  }>({
    first_name: '',
    last_name: '',
    title: '',
    bio: '',
    website: '',
    github: '',
    linkedin: '',
    twitter: '',
    skills: ''
  });
  
  // Get username from email
  const getUsername = useCallback((userEmail: string | undefined) => {
    return userEmail ? userEmail.split('@')[0] : 'user';
  }, []);
  
  // Get user metadata with defaults
  const getUserMetadata = useCallback((): UserMetadata & { first_name: string; last_name: string } => {
    if (!user) { 
      return { 
        first_name: '', 
        last_name: '',
        username: 'user',
        title: '',
        bio: '',
        website: '',
        github: '',
        linkedin: '',
        twitter: '',
        skills: [],
        avatar_url: ''
      }; 
    }
    
    const skills = user.user_metadata?.skills;
    const formattedSkills = Array.isArray(skills) 
      ? skills.join(', ') 
      : typeof skills === 'string' 
        ? skills 
        : '';

    return {
      first_name: user.user_metadata?.first_name || '',
      last_name: user.user_metadata?.last_name || '',
      username: user.user_metadata?.username || getUsername(user.email),
      title: user.user_metadata?.title || '',
      bio: user.user_metadata?.bio || '',
      website: user.user_metadata?.website || '',
      github: user.user_metadata?.github || '',
      linkedin: user.user_metadata?.linkedin || '',
      twitter: user.user_metadata?.twitter || '',
      skills: formattedSkills,
      avatar_url: user.user_metadata?.avatar_url || ''
    };
  }, [user]);
  
  useEffect(() => {
    if (user) {
      const meta = getUserMetadata();
      setFormData({
        first_name: meta.first_name || '',
        last_name: meta.last_name || '',
        title: meta.title || '',
        bio: meta.bio || '',
        website: meta.website || '',
        github: meta.github || '',
        linkedin: meta.linkedin || '',
        twitter: meta.twitter || '',
        skills: meta.skills || ''
      });
    }
  }, [user, getUserMetadata]);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  // Get user metadata and derived values
  const userMetadata = useMemo(() => getUserMetadata(), [getUserMetadata]);
  
  // Get user's full name
  const fullName = useMemo(() => {
    if (!user) return 'User';
    return `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || 'User';
  }, [user]);
  
  // Get skills as array for display
  const displaySkills = useMemo(() => {
    if (!user?.user_metadata?.skills) return [];
    
    if (typeof user.user_metadata.skills === 'string') {
      return user.user_metadata.skills
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean) as string[];
    }
    
    if (Array.isArray(user.user_metadata.skills)) {
      return user.user_metadata.skills as string[];
    }
    
    return [];
  }, [user]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError('File size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadResume(file);
      const resumeData: Omit<ResumeInfo, 'id'> = {
        file_name: result.fileName,
        file_url: result.publicUrl,
        file_size: result.fileSize,
        file_type: result.fileType,
        uploaded_at: new Date().toISOString(),
        user_id: user?.id || ''
      };
      
      // Save to database
      if (user) {
        const { data, error } = await supabase
          .from('resumes')
          .upsert(
            { ...resumeData, user_id: user.id },
            { onConflict: 'user_id' }
          )
          .select()
          .single();
          
        if (error) throw error;
        
        setResumeInfo(data as ResumeInfo);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload resume');
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = ''; // Reset file input
      }
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const { publicUrl } = await uploadProfilePicture(file);
      
      // Update user metadata with new avatar URL
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (error) throw error;

      // Update local state
      setUser(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload profile picture');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Prepare skills as an array
      const skillsArray = formData.skills
        ? formData.skills.split(',').map(skill => skill.trim()).filter(Boolean)
        : [];
      
      // Update user metadata
      const { data: { user: updatedUser }, error } = await supabase.auth.updateUser({
        data: {
          first_name: formData.first_name || '',
          last_name: formData.last_name || '',
          title: formData.title || '',
          bio: formData.bio || '',
          website: formData.website || '',
          github: formData.github || '',
          linkedin: formData.linkedin || '',
          twitter: formData.twitter || '',
          skills: skillsArray
        }
      });
      
      if (error) throw error;
      
      // Update local state
      if (updatedUser) {
        setUser(updatedUser);
      }
      
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset form data to current user data
    const meta = getUserMetadata();
    setFormData({
      first_name: meta.first_name,
      last_name: meta.last_name,
      title: meta.title,
      bio: meta.bio,
      website: meta.website,
      github: meta.github,
      linkedin: meta.linkedin,
      twitter: meta.twitter,
      skills: meta.skills
    });
    setIsEditing(false);
    alert('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  // Toggle edit mode
  const handleEditClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Cancel editing and reset form data
  const handleCancelEdit = useCallback(() => {
    if (user) {
      const meta = getUserMetadata();
      setFormData({
        first_name: meta.first_name || '',
        last_name: meta.last_name || '',
        title: meta.title || '',
        bio: meta.bio || '',
        website: meta.website || '',
        github: meta.github || '',
        linkedin: meta.linkedin || '',
        twitter: meta.twitter || '',
        skills: Array.isArray(meta.skills) ? meta.skills.join(', ') : meta.skills || ''
      });
    }
    setIsEditing(false);
  }, [getUserMetadata, user]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const result = await uploadProfilePicture(file);
      
      // Update user's avatar URL in metadata
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: result.publicUrl }
      });
      
      if (error) throw error;
      
      // Update local state
      setUser(prev => prev ? {
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          avatar_url: result.publicUrl
        }
      } : null);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = ''; // Reset file input
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Header */}
          <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-600 to-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
                <p className="mt-1 text-sm text-blue-100">
                  Manage your personal information and account settings
                </p>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Profile
                </button>
              )}
            <div>
              <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
              <p className="mt-1 text-sm text-blue-100">
                Manage your personal information and account settings
              </p>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={handleEditClick}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Profile
              </button>
            )}
          </div>
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={first_name || 'First Name'}
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
                      value={last_name || 'Last Name'}
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
