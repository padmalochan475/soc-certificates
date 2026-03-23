import React, { useState, useEffect } from 'react';
import { db, collection, setDoc, doc, deleteDoc, onSnapshot, query, updateDoc } from '../firebase';
import { UserProfile, UserRole, Branch } from '../types';
import { GlassCard } from '../components/GlassCard';
import { Loader } from '../components/Loader';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, Trash2, Edit3, Shield, Mail, Building2, X, Save, Search, CheckCircle2, XCircle, Hash } from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile)));
      setLoading(false);
    });

    const unsubscribeBranches = onSnapshot(collection(db, 'branches'), (snapshot) => {
      setBranches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch)));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeBranches();
    };
  }, []);

  const handleSave = async () => {
    if (!editingUser?.uid || !editingUser?.name || !editingUser?.email) return;
    setSaving(true);
    try {
      const user: UserProfile = {
        uid: editingUser.uid,
        name: editingUser.name,
        email: editingUser.email,
        employeeId: editingUser.employeeId || '',
        role: editingUser.role as UserRole,
        department: editingUser.department || '',
        isApproved: editingUser.isApproved ?? false,
        signatureBase64: editingUser.signatureBase64 || '',
      };
      await setDoc(doc(db, 'users', user.uid), user);
      setEditingUser(null);
    } catch (err) {
      console.error('Error saving user:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const toggleApproval = async (user: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isApproved: !user.isApproved
      });
    } catch (err) {
      console.error('Error toggling approval:', err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader message="Loading user management..." />;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">User Management</h1>
          <p className="text-zinc-400">Approve staff and manage roles.</p>
        </div>
        <button
          onClick={() => setEditingUser({ uid: '', name: '', email: '', role: 'HOD', department: '', isApproved: false })}
          className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" /> Add New User
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or ID..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user, i) => (
          <motion.div
            key={user.uid}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard className={`p-6 group relative border-l-4 ${user.isApproved ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors ${!user.isApproved && 'bg-red-500/5'}`}>
                  <Shield className={`w-7 h-7 ${user.isApproved ? 'text-emerald-400' : 'text-red-400'}`} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleApproval(user)}
                    title={user.isApproved ? "Revoke Approval" : "Approve User"}
                    className={`p-2 rounded-lg transition-colors ${user.isApproved ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                  >
                    {user.isApproved ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setEditingUser(user)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.uid)}
                    className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                {user.name}
                {user.isApproved && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </h3>

              <div className="space-y-1 mb-4">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Mail className="w-3 h-3" /> {user.email}
                </div>
                {user.employeeId && (
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Hash className="w-3 h-3" /> {user.employeeId}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                  user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' : 
                  user.role === 'HOD' ? 'bg-blue-500/10 text-blue-400' : 
                  'bg-zinc-500/10 text-zinc-400'
                }`}>
                  {user.role || 'NO ROLE'}
                </span>
                {user.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {user.department}
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-zinc-600 truncate">{user.uid}</div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg"
            >
              <GlassCard className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">User Details</h2>
                  <button onClick={() => setEditingUser(null)} className="text-zinc-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
                      <input
                        type="text"
                        value={editingUser.name || ''}
                        onChange={(e) => setEditingUser(prev => ({ ...prev!, name: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="e.g. Dr. Padmabati Chand"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Employee ID</label>
                      <input
                        type="text"
                        value={editingUser.employeeId || ''}
                        onChange={(e) => setEditingUser(prev => ({ ...prev!, employeeId: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="e.g. EMP001"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser(prev => ({ ...prev!, email: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Firebase UID</label>
                    <input
                      type="text"
                      value={editingUser.uid || ''}
                      onChange={(e) => setEditingUser(prev => ({ ...prev!, uid: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
                      placeholder="Paste UID from Firebase Auth"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Role</label>
                      <select
                        value={editingUser.role || 'HOD'}
                        onChange={(e) => setEditingUser(prev => ({ ...prev!, role: e.target.value as UserRole }))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="HOD">HOD</option>
                        <option value="VERIFIER">VERIFIER</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Department</label>
                      <select
                        value={editingUser.department || ''}
                        onChange={(e) => setEditingUser(prev => ({ ...prev!, department: e.target.value }))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="">None</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.code}>{b.name} ({b.code})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      id="isApproved"
                      checked={editingUser.isApproved || false}
                      onChange={(e) => setEditingUser(prev => ({ ...prev!, isApproved: e.target.checked }))}
                      className="w-5 h-5 rounded border-white/10 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                    />
                    <label htmlFor="isApproved" className="text-sm font-bold text-zinc-300 uppercase tracking-widest">
                      Approved for Access
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Signature (Base64)</label>
                    <textarea
                      value={editingUser.signatureBase64 || ''}
                      onChange={(e) => setEditingUser(prev => ({ ...prev!, signatureBase64: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors h-24 text-xs font-mono resize-none"
                      placeholder="Paste Base64 signature string..."
                    />
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> Save User</>}
                </button>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
