import { useEffect, useState } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { supabase, type Session } from '../../lib/supabase';

interface AuthProps {
  view?: 'sign_in' | 'sign_up' | 'forgotten_password' | 'update_password';
}

export default function Auth({ view = 'sign_in' }: AuthProps) {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigate('/dashboard'); // Redirect to dashboard after successful login
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!session) {
    return (
      <div className="auth-container">
        <SupabaseAuth
          supabaseClient={supabase}
          view={view}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#861F41',
                  brandAccent: '#621531',
                },
              },
            },
          }}
          providers={['google', 'github']}
          redirectTo={window.location.origin}
        />
      </div>
    );
  }

  return null; // Will redirect to dashboard if session exists
}
