import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from '../firebase';
import { Company, Branch, AcademicSession, AcademicYear, Duration, StartDate } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrors';
import { GlassCard } from '../components/GlassCard';
import { Loader } from '../components/Loader';
import { Plus, Trash2, Edit2, Building2, GraduationCap, UserCheck, Save, X, Database, Calendar, Layers, Clock, CalendarDays, Mail, Phone, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'companies' | 'branches' | 'sessions' | 'years' | 'durations' | 'start_dates';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState<Tab>('companies');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [durations, setDurations] = useState<Duration[]>([]);
  const [startDates, setStartDates] = useState<StartDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [companyForm, setCompanyForm] = useState<Partial<Company>>({});
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({});
  const [sessionForm, setSessionForm] = useState<Partial<AcademicSession>>({});
  const [yearForm, setYearForm] = useState<Partial<AcademicYear>>({});
  const [durationForm, setDurationForm] = useState<Partial<Duration>>({});
  const [startDateForm, setStartDateForm] = useState<Partial<StartDate>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compSnap, branSnap, sessSnap, yearSnap, durSnap, startSnap] = await Promise.all([
        getDocs(collection(db, 'companies')),
        getDocs(collection(db, 'branches')),
        getDocs(collection(db, 'sessions')),
        getDocs(collection(db, 'academic_years')),
        getDocs(collection(db, 'durations')),
        getDocs(collection(db, 'start_dates'))
      ]);

      setCompanies(compSnap.docs.map(d => ({ id: d.id, ...d.data() } as Company)));
      setBranches(branSnap.docs.map(d => ({ id: d.id, ...d.data() } as Branch)));
      setSessions(sessSnap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicSession)));
      setYears(yearSnap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicYear)));
      setDurations(durSnap.docs.map(d => ({ id: d.id, ...d.data() } as Duration)));
      setStartDates(startSnap.docs.map(d => ({ id: d.id, ...d.data() } as StartDate)));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'master_data');
    } finally {
      setLoading(false);
    }
  };

  const seedMasterData = async () => {
    setSaving(true);
    try {
      // Seed Branches with HOD Info
      await Promise.all([
        addDoc(collection(db, 'branches'), { 
          name: 'Computer Science & Engineering', 
          code: 'CSE',
          hodName: 'Dr. Padmabati Chand',
          hodEmail: 'hod.cse@trident.ac.in',
          hodMobile: '9437000001'
        }),
        addDoc(collection(db, 'branches'), { 
          name: 'Information Technology', 
          code: 'IT',
          hodName: 'Prof. S.K. Sahoo',
          hodEmail: 'hod.it@trident.ac.in',
          hodMobile: '9437000002'
        }),
        addDoc(collection(db, 'branches'), { 
          name: 'Electronics & Communication', 
          code: 'ECE',
          hodName: 'Dr. M.R. Senapati',
          hodEmail: 'hod.ece@trident.ac.in',
          hodMobile: '9437000003'
        })
      ]);

      // Seed Companies
      await Promise.all([
        addDoc(collection(db, 'companies'), { name: 'TPCODL', designation: 'The Head HR', address: 'Corporate Office, Power House Square, Bhubaneswar-751001' }),
        addDoc(collection(db, 'companies'), { name: 'TCS', designation: 'The Talent Acquisition Manager', address: 'TCS Kalinga Park, IT/ITES SEZ, Chandaka Industrial Estate, Bhubaneswar-751024' }),
        addDoc(collection(db, 'companies'), { name: 'Infosys', designation: 'The HR Manager', address: 'Plot No. E/4, Info City, Bhubaneswar-751024' })
      ]);

      // Seed Sessions
      await Promise.all([
        addDoc(collection(db, 'sessions'), { name: '2021-25' }),
        addDoc(collection(db, 'sessions'), { name: '2022-26' }),
        addDoc(collection(db, 'sessions'), { name: '2023-27' }),
        addDoc(collection(db, 'sessions'), { name: '2024-28' })
      ]);

      // Seed Years
      await Promise.all([
        addDoc(collection(db, 'academic_years'), { name: '1st Year' }),
        addDoc(collection(db, 'academic_years'), { name: '2nd Year' }),
        addDoc(collection(db, 'academic_years'), { name: '3rd Year' }),
        addDoc(collection(db, 'academic_years'), { name: '4th Year' })
      ]);

      // Seed Durations
      await Promise.all([
        addDoc(collection(db, 'durations'), { name: '1 Month' }),
        addDoc(collection(db, 'durations'), { name: '2 Months' }),
        addDoc(collection(db, 'durations'), { name: '3 Months' }),
        addDoc(collection(db, 'durations'), { name: '6 Months' })
      ]);

      // Seed Start Dates
      await Promise.all([
        addDoc(collection(db, 'start_dates'), { name: 'June 2024' }),
        addDoc(collection(db, 'start_dates'), { name: 'July 2024' }),
        addDoc(collection(db, 'start_dates'), { name: 'August 2024' }),
        addDoc(collection(db, 'start_dates'), { name: 'December 2024' })
      ]);

      await fetchData();
      alert('Master data seeded successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'seed_data');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyForm.name || !companyForm.designation || !companyForm.address) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'companies', editingId), companyForm);
      } else {
        await addDoc(collection(db, 'companies'), companyForm);
      }
      setCompanyForm({});
      setEditingId(null);
      await fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'companies');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranch = async () => {
    if (!branchForm.name || !branchForm.code) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'branches', editingId), branchForm);
      } else {
        await addDoc(collection(db, 'branches'), branchForm);
      }
      setBranchForm({});
      setEditingId(null);
      await fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'branches');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSession = async () => {
    if (!sessionForm.name) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'sessions', editingId), sessionForm);
      } else {
        await addDoc(collection(db, 'sessions'), sessionForm);
      }
      setSessionForm({});
      setEditingId(null);
      await fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'sessions');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveYear = async () => {
    if (!yearForm.name) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'academic_years', editingId), yearForm);
      } else {
        await addDoc(collection(db, 'academic_years'), yearForm);
      }
      setYearForm({});
      setEditingId(null);
      await fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'academic_years');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDuration = async () => {
    if (!durationForm.name) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'durations', editingId), durationForm);
      } else {
        await addDoc(collection(db, 'durations'), durationForm);
      }
      setDurationForm({});
      setEditingId(null);
      await fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'durations');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStartDate = async () => {
    if (!startDateForm.name) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'start_dates', editingId), startDateForm);
      } else {
        await addDoc(collection(db, 'start_dates'), startDateForm);
      }
      setStartDateForm({});
      setEditingId(null);
      await fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'start_dates');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      await fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, collectionName);
    }
  };

  if (loading) return <Loader message="Loading master data..." />;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Master Data Management</h1>
          <p className="text-zinc-400">Manage companies, branches, and HOD information for dynamic forms.</p>
        </div>
        <button
          onClick={seedMasterData}
          disabled={saving}
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all flex items-center gap-2"
        >
          <Database className="w-4 h-4" /> Seed Default Data
        </button>
      </div>

      <div className="flex gap-4 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
        <button
          onClick={() => { setActiveTab('companies'); setEditingId(null); }}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'companies' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'}`}
        >
          <Building2 className="w-4 h-4" /> Companies
        </button>
        <button
          onClick={() => { setActiveTab('branches'); setEditingId(null); }}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'branches' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'}`}
        >
          <GraduationCap className="w-4 h-4" /> Departments
        </button>
        <button
          onClick={() => { setActiveTab('sessions'); setEditingId(null); }}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sessions' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'}`}
        >
          <Calendar className="w-4 h-4" /> Sessions
        </button>
        <button
          onClick={() => { setActiveTab('years'); setEditingId(null); }}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'years' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'}`}
        >
          <Layers className="w-4 h-4" /> Academic Years
        </button>
        <button
          onClick={() => { setActiveTab('durations'); setEditingId(null); }}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'durations' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'}`}
        >
          <Clock className="w-4 h-4" /> Durations
        </button>
        <button
          onClick={() => { setActiveTab('start_dates'); setEditingId(null); }}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'start_dates' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'}`}
        >
          <CalendarDays className="w-4 h-4" /> Start Dates
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <GlassCard className="p-8 space-y-6 sticky top-24">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {editingId ? <Edit2 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-emerald-500" />}
              {editingId ? 'Edit Record' : 'Add New Record'}
            </h2>

            {activeTab === 'companies' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Company Name</label>
                  <input
                    type="text"
                    value={companyForm.name || ''}
                    onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="e.g. TPCODL"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recipient Designation</label>
                  <input
                    type="text"
                    value={companyForm.designation || ''}
                    onChange={e => setCompanyForm({ ...companyForm, designation: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="e.g. The Head HR"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Office Address</label>
                  <textarea
                    value={companyForm.address || ''}
                    onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors h-32 resize-none"
                    placeholder="Full address..."
                  />
                </div>
                <button
                  onClick={handleSaveCompany}
                  disabled={saving}
                  className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> {saving ? 'Saving...' : editingId ? 'Update Company' : 'Add Company'}
                </button>
              </div>
            )}

            {activeTab === 'branches' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Branch Name</label>
                    <input
                      type="text"
                      value={branchForm.name || ''}
                      onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Branch Code</label>
                    <input
                      type="text"
                      value={branchForm.code || ''}
                      onChange={e => setBranchForm({ ...branchForm, code: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="e.g. CSE"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">HOD Information</h4>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">HOD Name</label>
                    <input
                      type="text"
                      value={branchForm.hodName || ''}
                      onChange={e => setBranchForm({ ...branchForm, hodName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="Dr. Name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">HOD Email</label>
                      <input
                        type="email"
                        value={branchForm.hodEmail || ''}
                        onChange={e => setBranchForm({ ...branchForm, hodEmail: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="hod@trident.ac.in"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">HOD Mobile</label>
                      <input
                        type="text"
                        value={branchForm.hodMobile || ''}
                        onChange={e => setBranchForm({ ...branchForm, hodMobile: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="9437..."
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSaveBranch}
                  disabled={saving}
                  className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> {saving ? 'Saving...' : editingId ? 'Update Department' : 'Add Department'}
                </button>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Session Name</label>
                  <input
                    type="text"
                    value={sessionForm.name || ''}
                    onChange={e => setSessionForm({ ...sessionForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="e.g. 2022-26"
                  />
                </div>
                <button
                  onClick={handleSaveSession}
                  disabled={saving}
                  className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> {saving ? 'Saving...' : editingId ? 'Update Session' : 'Add Session'}
                </button>
              </div>
            )}

            {activeTab === 'years' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Year Name</label>
                  <input
                    type="text"
                    value={yearForm.name || ''}
                    onChange={e => setYearForm({ ...yearForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="e.g. 3rd Year"
                  />
                </div>
                <button
                  onClick={handleSaveYear}
                  disabled={saving}
                  className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> {saving ? 'Saving...' : editingId ? 'Update Year' : 'Add Year'}
                </button>
              </div>
            )}

            {activeTab === 'durations' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Duration Name</label>
                  <input
                    type="text"
                    value={durationForm.name || ''}
                    onChange={e => setDurationForm({ ...durationForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="e.g. 3 Months"
                  />
                </div>
                <button
                  onClick={handleSaveDuration}
                  disabled={saving}
                  className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> {saving ? 'Saving...' : editingId ? 'Update Duration' : 'Add Duration'}
                </button>
              </div>
            )}

            {activeTab === 'start_dates' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Start Date Label</label>
                  <input
                    type="text"
                    value={startDateForm.name || ''}
                    onChange={e => setStartDateForm({ ...startDateForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="e.g. June 2024"
                  />
                </div>
                <button
                  onClick={handleSaveStartDate}
                  disabled={saving}
                  className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> {saving ? 'Saving...' : editingId ? 'Update Start Date' : 'Add Start Date'}
                </button>
              </div>
            )}

            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setCompanyForm({});
                  setBranchForm({});
                }}
                className="w-full py-3 bg-white/5 text-zinc-400 font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Cancel Edit
              </button>
            )}
          </GlassCard>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <GlassCard className="p-8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Details</th>
                    <th className="pb-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Meta</th>
                    <th className="pb-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeTab === 'companies' && companies.map(c => (
                    <tr key={c.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-6">
                        <p className="text-white font-bold">{c.name}</p>
                        <p className="text-xs text-zinc-500">{c.designation}</p>
                      </td>
                      <td className="py-6">
                        <p className="text-xs text-zinc-400 max-w-xs truncate">{c.address}</p>
                      </td>
                      <td className="py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setEditingId(c.id); setCompanyForm(c); }}
                            className="p-2 text-zinc-500 hover:text-amber-500 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('companies', c.id)}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'branches' && branches.map(b => (
                    <tr key={b.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <GraduationCap className="text-emerald-400 w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-white font-bold">{b.name}</p>
                            <p className="text-xs text-zinc-500">{b.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-zinc-300">
                            <User className="w-3 h-3 text-emerald-500" /> {b.hodName || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                            <Mail className="w-3 h-3" /> {b.hodEmail || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setEditingId(b.id); setBranchForm(b); }}
                            className="p-2 text-zinc-500 hover:text-amber-500 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('branches', b.id)}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}


                  {activeTab === 'sessions' && sessions.map(s => (
                    <tr key={s.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-6">
                        <p className="text-white font-bold">{s.name}</p>
                      </td>
                      <td className="py-6">
                        <span className="text-xs text-zinc-500">Academic Session</span>
                      </td>
                      <td className="py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setEditingId(s.id); setSessionForm(s); }}
                            className="p-2 text-zinc-500 hover:text-amber-500 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('sessions', s.id)}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'years' && years.map(y => (
                    <tr key={y.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-6">
                        <p className="text-white font-bold">{y.name}</p>
                      </td>
                      <td className="py-6">
                        <span className="text-xs text-zinc-500">Academic Year</span>
                      </td>
                      <td className="py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setEditingId(y.id); setYearForm(y); }}
                            className="p-2 text-zinc-500 hover:text-amber-500 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('academic_years', y.id)}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'durations' && durations.map(d => (
                    <tr key={d.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-6">
                        <p className="text-white font-bold">{d.name}</p>
                      </td>
                      <td className="py-6">
                        <span className="text-xs text-zinc-500">Internship Duration</span>
                      </td>
                      <td className="py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setEditingId(d.id); setDurationForm(d); }}
                            className="p-2 text-zinc-500 hover:text-amber-500 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('durations', d.id)}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'start_dates' && startDates.map(s => (
                    <tr key={s.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-6">
                        <p className="text-white font-bold">{s.name}</p>
                      </td>
                      <td className="py-6">
                        <span className="text-xs text-zinc-500">Start Date Option</span>
                      </td>
                      <td className="py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setEditingId(s.id); setStartDateForm(s); }}
                            className="p-2 text-zinc-500 hover:text-amber-500 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('start_dates', s.id)}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(activeTab === 'companies' ? companies : activeTab === 'branches' ? branches : activeTab === 'sessions' ? sessions : activeTab === 'years' ? years : activeTab === 'durations' ? durations : startDates).length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-zinc-500">No records found. Add your first {activeTab.slice(0, -1)}.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
