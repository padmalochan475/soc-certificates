import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, googleProvider, signInWithPopup, doc, getDoc, db, setDoc, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from '../firebase';
import { GlassCard } from '../components/GlassCard';
import { Shield, LogIn, AlertCircle, UserPlus, Mail, Lock, User, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    employeeId: ''
  });

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const checkApproval = async (uid: string) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const profile = userDoc.data() as UserProfile;
      if (profile.isApproved || profile.email === "padmalochan.mmaharana@gmail.com") {
        return true;
      }
      setError("Your account is pending approval by the administrator.");
      return false;
    }
    setError("Account not found. Please sign up first.");
    return false;
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const approved = await checkApproval(user.uid);
        if (approved) navigate(from, { replace: true });
        else await auth.signOut();
      } else if (user.email === "padmalochan.mmaharana@gmail.com") {
        // Auto-approve default admin
        const profile: UserProfile = {
          uid: user.uid,
          name: user.displayName || 'Admin',
          email: user.email!,
          role: 'ADMIN',
          isApproved: true
        };
        await setDoc(doc(db, 'users', user.uid), profile);
        navigate(from, { replace: true });
      } else {
        // Create pending profile for new Google user
        const profile: UserProfile = {
          uid: user.uid,
          name: user.displayName || 'New Staff',
          email: user.email!,
          isApproved: false
        };
        await setDoc(doc(db, 'users', user.uid), profile);
        setError("Account created! Please wait for administrator approval.");
        await auth.signOut();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignup) {
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(result.user, { displayName: formData.name });
        
        const profile: UserProfile = {
          uid: result.user.uid,
          name: formData.name,
          email: formData.email,
          employeeId: formData.employeeId,
          isApproved: false
        };
        
        await setDoc(doc(db, 'users', result.user.uid), profile);
        setError("Account request submitted! Please wait for administrator approval.");
        await auth.signOut();
      } else {
        const result = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const approved = await checkApproval(result.user.uid);
        if (approved) navigate(from, { replace: true });
        else await auth.signOut();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-6">
            <Shield className="text-white w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">Staff Portal</h1>
          <p className="text-zinc-400 mb-8 text-center">
            {isSignup ? 'Request access to the staff portal.' : 'Authorized access for HODs and Administrators.'}
          </p>

          {error && (
            <div className={`w-full p-4 border rounded-xl flex items-center gap-3 text-sm mb-6 ${
              error.includes('approval') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="w-full space-y-4 mb-6">
            <AnimatePresence mode="wait">
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full Name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      placeholder="Employee ID"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email Address"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignup ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isSignup ? 'Request Access' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          <div className="flex items-center w-full gap-4 mb-6">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">OR</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all disabled:opacity-50 group"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>

          <button
            onClick={() => setIsSignup(!isSignup)}
            className="mt-6 text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
          >
            {isSignup ? 'Already have an account? Sign In' : 'Need staff access? Request Account'}
          </button>

          <div className="mt-8 pt-8 border-t border-white/10 w-full">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">
              Techno Academic Trust
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
