import { useState, useEffect, useCallback } from 'react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { supabaseAuthService, AuthUser } from '../services/supabaseAuth';

export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  const checkUser = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await supabaseAuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check error:', error);
      setError(error instanceof Error ? error.message : 'Authentication error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up auth state listener
  useEffect(() => {
    // Initial check
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [checkUser]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { user, error } = await supabaseAuthService.signIn(email, password);
      
      if (error) throw error;
      setUser(user);
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const { user, error } = await supabaseAuthService.signUp(email, password);
      
      if (error) throw error;
      setUser(user);
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign up');
      throw error;
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github') => {
    try {
      setError(null);
      const { error } = await supabaseAuthService.signInWithProvider(provider);
      
      if (error) throw error;
    } catch (error) {
      console.error('Provider sign in error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in with provider');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabaseAuthService.signOut();
      
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign out');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabaseAuthService.resetPassword(email);
      
      if (error) throw error;
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error instanceof Error ? error.message : 'Failed to reset password');
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setError(null);
      const { error } = await supabaseAuthService.updatePassword(newPassword);
      
      if (error) throw error;
    } catch (error) {
      console.error('Password update error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update password');
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
  };
}
