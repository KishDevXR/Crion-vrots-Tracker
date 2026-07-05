import { supabase } from './supabaseClient';

const DOMAIN = 'crionvrots.com'; // internal email domain for auth

export const authService = {
  // Login with username (maps to username@crionvrots.internal)
  async login(username, password) {
    const email = `${username.toLowerCase().trim()}@${DOMAIN}`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Fetch profile for role + name
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    if (profErr) throw profErr;

    return { user: data.user, session: data.session, profile };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current session on app load
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return { session, profile };
  },

  // Listen for auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Admin: create a new user (uses service role via RPC or anon signUp)
  async createUser({ username, password, name, role, hourlyRate = 50 }) {
    const email = `${username.toLowerCase().trim()}@${DOMAIN}`;
    // Use signUp — Supabase trigger will auto-create profile
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } }
    });
    if (error) throw error;

    // Update profile fields not set by trigger
    await supabase
      .from('profiles')
      .update({ name, role, hourly_rate: hourlyRate })
      .eq('id', data.user.id);

    return data.user;
  },

  async updateProfile(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  async deleteProfile(id) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
