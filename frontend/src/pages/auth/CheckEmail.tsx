import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';

const CheckEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get the email from location state or default to a generic message
    const state = location.state as { email?: string } | undefined;
    if (state?.email) {
      setEmail(state.email);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100">
            <FiMail className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a magic link to <span className="font-medium">{email || 'your email address'}</span>
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Click the link in the email to sign in to your account.
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center text-sm text-gray-600">
            <p>Didn't receive an email?</p>
            <div className="mt-4 space-y-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </button>
              <button
                onClick={() => {
                  if (email) {
                    // Resend magic link
                    // You can implement resend logic here
                    alert(`Magic link resent to ${email}`);
                  } else {
                    navigate('/login');
                  }
                }}
                className="w-full flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Resend magic link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckEmail;
