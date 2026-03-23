import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { auth, signOut } from '../firebase';
import { LogOut, User as UserIcon, Shield, LayoutDashboard, FileText, Search, CheckCircle } from 'lucide-react';

export function Navbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Shield className="text-white w-6 h-6" />
        </div>
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          TAT Dynamic System
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <Link to="/apply" className="hover:text-white transition-colors">Apply</Link>
          <Link to="/track" className="hover:text-white transition-colors">Track Status</Link>
          <Link to="/verify" className="hover:text-white transition-colors">Verify</Link>
        </div>

        {user ? (
          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-white">{profile?.name || 'User'}</span>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">{profile?.role || 'Role'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-5 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Staff Login
          </Link>
        )}
      </div>
    </nav>
  );
}
