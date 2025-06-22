import { supabase as supabaseClient } from '../lib/supabase';
import { Session, AuthError, EmailOtpType, User } from '@supabase/supabase-js';

// Re-export the supabase client
export const supabase = supabaseClient;

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

class SupabaseAuthService {
  async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      return {
        user: data.user,
        session: data.session,
        error,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return {
        user: data.user,
        session: data.session,
        error,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  async signInWithProvider(provider: 'google' | 'github') {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
      };
    }
  }

  // Get the Supabase client instance
  get supabase() {
    return supabaseClient;
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return {
        error: error as AuthError,
      };
    }
  }

  async signInWithMagicLink(email: string): Promise<{ data: { message: string } | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      return { 
        data: data ? { message: 'Check your email for the login link!' } : null, 
        error 
      };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
      };
    }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }

  // Handle the OTP verification from the magic link
  async verifyOtp(email: string, token: string, type: EmailOtpType) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      });
      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
      };
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();
