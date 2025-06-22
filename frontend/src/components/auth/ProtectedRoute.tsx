import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check if we have an active session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!session) {
          // If no session, redirect to login with a return URL
          const redirectTo = encodeURIComponent(location.pathname + location.search);
          navigate(`/login?redirectTo=${redirectTo}`, { replace: true });
        } else {
          // If we have a session, verify the user is still valid
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            await supabase.auth.signOut();
            navigate('/login', { replace: true });
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        navigate('/login', { replace: true });
      } finally {
        if (loading) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login', { replace: true });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate, location, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
