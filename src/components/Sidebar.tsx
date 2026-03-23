import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LayoutDashboard, FileText, Users, Settings, CheckCircle, Search, PlusCircle, Database } from 'lucide-react';
import { clsx } from 'clsx';

export function Sidebar() {
  const { profile } = useAuth();
  const location = useLocation();

  if (!profile) return null;

  const isActive = (path: string) => location.pathname === path;

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/templates', label: 'Templates', icon: FileText },
    { to: '/admin/master-data', label: 'Master Data', icon: Database },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
  ];

  const hodLinks = [
    { to: '/hod', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/hod/pending', label: 'Pending Requests', icon: CheckCircle },
  ];

  const links = profile.role === 'ADMIN' ? adminLinks : profile.role === 'HOD' ? hodLinks : [];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-zinc-950 border-r border-white/10 p-6 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-4">Menu</span>
        <div className="flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive(link.to)
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <link.icon className={clsx("w-5 h-5", isActive(link.to) ? "text-emerald-400" : "text-zinc-500 group-hover:text-white")} />
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-4">Public Tools</span>
        <div className="flex flex-col gap-1">
          <Link to="/apply" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-all group">
            <PlusCircle className="w-5 h-5 text-zinc-500 group-hover:text-white" />
            <span className="font-medium">Apply Now</span>
          </Link>
          <Link to="/track" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-all group">
            <Search className="w-5 h-5 text-zinc-500 group-hover:text-white" />
            <span className="font-medium">Track Status</span>
          </Link>
          <Link to="/verify" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-all group">
            <CheckCircle className="w-5 h-5 text-zinc-500 group-hover:text-white" />
            <span className="font-medium">Verify Certificate</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
