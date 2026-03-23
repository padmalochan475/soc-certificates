import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, query, where, onSnapshot } from '../firebase';
import { Application, Template, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrors';
import { GlassCard } from '../components/GlassCard';
import { Loader } from '../components/Loader';
import { motion } from 'motion/react';
import { Users, FileText, CheckCircle, Clock, AlertCircle, TrendingUp, BarChart3, PieChart, Database } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalApplications: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalTemplates: 0,
    totalUsers: 0,
    totalCompanies: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [appsSnap, tplsSnap, usersSnap, compSnap] = await Promise.all([
          getDocs(collection(db, 'applications')),
          getDocs(collection(db, 'templates')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'companies'))
        ]);

        const apps = appsSnap.docs.map(doc => doc.data() as Application);
        
        setStats({
          totalApplications: apps.length,
          pending: apps.filter(a => a.status === 'PENDING').length,
          approved: apps.filter(a => a.status === 'APPROVED').length,
          rejected: apps.filter(a => a.status === 'REJECTED').length,
          totalTemplates: tplsSnap.size,
          totalUsers: usersSnap.size,
          totalCompanies: compSnap.size,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'admin_stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <Loader message="Loading dashboard data..." />;

  const statCards = [
    { label: 'Total Applications', value: stats.totalApplications, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Master Companies', value: stats.totalCompanies, icon: Database, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-zinc-400">System overview and real-time statistics.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-6 py-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-emerald-400">System Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-6 flex items-center gap-6 group hover:border-white/30 transition-all">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest block mb-1">{stat.label}</span>
                <span className="text-3xl font-bold text-white">{stat.value}</span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="text-emerald-500 w-6 h-6" />
              Application Trends
            </h2>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-zinc-400 focus:outline-none">
              <option className="bg-zinc-900">Last 7 Days</option>
              <option className="bg-zinc-900">Last 30 Days</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.1, duration: 1 }}
                className="flex-1 bg-emerald-500/20 border-t-2 border-emerald-500 rounded-t-lg hover:bg-emerald-500/40 transition-colors cursor-pointer relative group"
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {h} Apps
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </GlassCard>

        <GlassCard className="p-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-8">
            <PieChart className="text-emerald-500 w-6 h-6" />
            Approval Distribution
          </h2>
          <div className="flex items-center justify-around gap-8">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-zinc-800" strokeWidth="4" />
                <circle
                  cx="18" cy="18" r="16" fill="none"
                  className="stroke-emerald-500"
                  strokeWidth="4"
                  strokeDasharray={`${(stats.approved / stats.totalApplications) * 100 || 0}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{Math.round((stats.approved / stats.totalApplications) * 100) || 0}%</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Approved</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-sm text-zinc-400">Approved ({stats.approved})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span className="text-sm text-zinc-400">Pending ({stats.pending})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm text-zinc-400">Rejected ({stats.rejected})</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
