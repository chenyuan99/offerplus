/**
 * Unified Authentication and Profile Service
 * Consolidates all auth operations and profile management into a single service
 * Provides consistent error handling and comprehensive documentation
 */

import { supabase } from '../lib/supabase';
import type { User, Session, AuthError, EmailOtpType } from '@supabase/supabase-js';
import type { UserProfile } from '../types/supabase';

export interface AuthResponse<T = any> {
  data: T | null;
  error: AuthError | null;
}

export type AuthUser = User;

/**
 * Unified Authentication Service
 * Handles all authentication operations and profile management
 *
 * @example
 * ```typescript
 * // Sign up with email/password
 * const { data, error } = await authService.signUp({
 *   email: 'user@example.com',
 *   password: 'securepassword123',
 * });
 *
 * // Sign in with magic link
 * const { data, error } = await authService.signInWithMagicLink('user@example.com');
 *
 * // Get current user
 * const user = await authService.getCurrentUser();
 *
 * // Get user profile
 * const profile = await authService.getProfile();
 * ```
 */
class AuthService {
  /**
   * Sign up with email and password
   * @param credentials User credentials
   * @returns Auth response with user and session
   */
  async signUp(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      return { data: { user: data.user, session: data.session }, error };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  }

  /**
   * Sign in with email and password
   * @param credentials User credentials
   * @returns Auth response with user and session
   */
  async signIn(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      return { data: { user: data.user, session: data.session }, error };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  }

  /**
   * Sign in with magic link via email
   * @param email User email address
   * @returns Auth response confirming link sent
   *
   * @example
   * ```typescript
   * const { data, error } = await authService.signInWithMagicLink('user@example.com');
   * if (!error) console.log('Check your email for login link');
   * ```
   */
  async signInWithMagicLink(email: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      return { data, error };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  }

  /**
   * Sign in with OAuth provider (Google, GitHub, etc.)
   * @param provider OAuth provider name
   * @returns Auth response with provider redirect URL
   *
   * @example
   * ```typescript
   * const { data, error } = await authService.signInWithProvider('google');
   * if (data?.url) window.location.href = data.url;
   * ```
   */
  async signInWithProvider(
    provider: 'google' | 'github' | 'discord'
  ): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      return { data, error };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  }

  /**
   * Verify OTP from magic link or MFA
   * @param email User email address
   * @param token OTP token
   * @param type OTP type (email, sms, etc.)
   * @returns Auth response with session
   */
  async verifyOtp(
    email: string,
    token: string,
    type: EmailOtpType = 'email'
  ): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      });

      return { data, error };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  }

  /**
   * Sign out the current user
   * @returns Auth response
   */
  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      return { data: { message: 'Signed out successfully' }, error };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  }

  /**
   * Get the current authenticated user
   * @returns Current user or null if not authenticated
   *
   * @example
   * ```typescript
   * const user = await authService.getCurrentUser();
   * if (user) {
   *   console.log('Logged in as:', user.email);
   * } else {
   *   console.log('Not authenticated');
   * }
   * ```
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get the current session
   * @returns Current session or null
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Request a password reset email
   * @param email User email address
   * @returns Auth response
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      return { data, error };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  }

  /**
   * Update the current user's password
   * @param newPassword New password
   * @returns Auth response
   */
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { data, error };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  }

  /**
   * Listen for authentication state changes
   * @param callback Callback function
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = authService.onAuthStateChange((event, session) => {
   *   if (event === 'SIGNED_IN') console.log('User signed in');
   *   if (event === 'SIGNED_OUT') console.log('User signed out');
   * });
   *
   * // Stop listening
   * unsubscribe();
   * ```
   */
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(event, session);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }

  /**
   * Check if user is currently authenticated
   * @returns True if authenticated, false otherwise
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  /**
   * Get the access token from local storage
   * @returns Access token or null
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // ============================================================================
  // Profile Management
  // ============================================================================

  /**
   * Get the current user's profile
   * @returns User profile or null if not found
   *
   * @example
   * ```typescript
   * const profile = await authService.getProfile();
   * if (profile) {
   *   console.log('Username:', profile.username);
   *   console.log('Resume:', profile.resume_url);
   * }
   * ```
   */
  async getProfile(): Promise<UserProfile | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Profile doesn't exist yet - return defaults
        if (error.code === 'PGRST116') {
          return {
            id: user.id,
            email: user.email || '',
            username: user.user_metadata?.username || user.email?.split('@')[0],
            resume: null,
            resume_name: null,
            resume_url: null,
            resume_updated_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        throw error;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  /**
   * Update the current user's profile
   * @param updates Profile updates
   * @returns Updated profile
   */
  async updateProfile(
    updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<AuthResponse<UserProfile>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      return { data: data as UserProfile, error };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  }

  /**
   * Get access to the Supabase client instance
   * @returns Supabase client
   */
  getSupabaseClient() {
    return supabase;
  }
}

export const authService = new AuthService();
