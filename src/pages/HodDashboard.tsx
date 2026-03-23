import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot } from '../firebase';
import { Application, Template } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrors';
import { useAuth } from '../components/AuthProvider';
import { GlassCard } from '../components/GlassCard';
import { Loader } from '../components/Loader';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Clock, XCircle, FileText, ArrowRight, Filter, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HodDashboard() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profile?.department) return;

    const q = query(
      collection(db, 'applications'),
      where('department', '==', profile.department)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => doc.data() as Application);
      setApplications(apps);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'applications');
    });

    return () => unsubscribe();
  }, [profile?.department]);

  const filteredApps = applications.filter(app => {
    const matchesFilter = filter === 'ALL' || app.status === filter;
    const matchesSearch = 
      app.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.formData.studentName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <Loader message="Fetching applications..." />;

  const stats = {
    pending: applications.filter(a => a.status === 'PENDING').length,
    approved: applications.filter(a => a.status === 'APPROVED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">HOD Dashboard</h1>
          <p className="text-zinc-400">Manage applications for the <span className="text-emerald-400 font-bold">{profile?.department}</span> department.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span className="text-sm font-bold text-white">{stats.pending} Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-sm font-bold text-white">{stats.approved} Approved</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, email, or name..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredApps.length > 0 ? (
            filteredApps.map((app, i) => (
              <motion.div
                key={app.trackingId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="p-6 flex items-center justify-between group hover:border-white/30 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                      app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-white">{app.formData.studentName || 'Unnamed Student'}</h3>
                        <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/10">{app.trackingId}</span>
                      </div>
                      <p className="text-sm text-zinc-500">{app.studentEmail} • {new Date(app.timestamps.submittedAt?.seconds * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                        app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <Link
                      to={`/hod/review/${app.trackingId}`}
                      className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all group/btn"
                    >
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-zinc-500 font-medium">No applications found matching your criteria.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
