import React, { useState, useEffect } from 'react';
import { db, collection, query, where, setDoc, doc, Timestamp, onSnapshot, runTransaction, increment } from '../firebase';
import { Template, Application, Company, Branch, AcademicSession, AcademicYear, Duration, StartDate } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrors';
import { GlassCard } from '../components/GlassCard';
import { Loader } from '../components/Loader';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, FileText, Send, AlertCircle, ArrowRight, Building2, GraduationCap, Eye, Calendar, Layers, Clock, CalendarDays } from 'lucide-react';
import { renderTemplate } from '../utils/pdfGenerator';

export default function Apply() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Master Data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [durations, setDurations] = useState<Duration[]>([]);
  const [startDates, setStartDates] = useState<StartDate[]>([]);

  useEffect(() => {
    const templatesQuery = query(collection(db, 'templates'), where('isActive', '==', true));
    
    const unsubTemplates = onSnapshot(templatesQuery, (snapshot) => {
      setTemplates(snapshot.docs.map(doc => doc.data() as Template));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'templates');
    });

    const unsubCompanies = onSnapshot(collection(db, 'companies'), (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'companies');
    });

    const unsubBranches = onSnapshot(collection(db, 'branches'), (snapshot) => {
      setBranches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'branches');
    });

    const unsubSessions = onSnapshot(collection(db, 'sessions'), (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicSession)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'sessions');
    });

    const unsubYears = onSnapshot(collection(db, 'academic_years'), (snapshot) => {
      setYears(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicYear)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'academic_years');
    });

    const unsubDurations = onSnapshot(collection(db, 'durations'), (snapshot) => {
      setDurations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Duration)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'durations');
    });

    const unsubStartDates = onSnapshot(collection(db, 'start_dates'), (snapshot) => {
      setStartDates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StartDate)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'start_dates');
    });

    return () => {
      unsubTemplates();
      unsubCompanies();
      unsubBranches();
      unsubSessions();
      unsubYears();
      unsubDurations();
      unsubStartDates();
    };
  }, []);

  const [isManualCompany, setIsManualCompany] = useState(false);
  const [isManualDuration, setIsManualDuration] = useState(false);
  const [isManualStartDate, setIsManualStartDate] = useState(false);

  const handleInputChange = (name: string, value: any) => {
    if (name === 'companyName' && value === 'OTHER') {
      setIsManualCompany(true);
      setFormData(prev => ({ ...prev, [name]: '' }));
      return;
    }

    if (name === 'duration' && value === 'OTHER') {
      setIsManualDuration(true);
      setFormData(prev => ({ ...prev, [name]: '' }));
      return;
    }

    if (name === 'startDate' && value === 'OTHER') {
      setIsManualStartDate(true);
      setFormData(prev => ({ ...prev, [name]: '' }));
      return;
    }

    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Auto-fill logic for Company
      if (name === 'companyName' && !isManualCompany) {
        const company = companies.find(c => c.name === value);
        if (company) {
          newData.recipientDesignation = company.designation;
          newData.recipientAddress = company.address;
        }
      }
// ... (rest of the function)

      // Sync Department with Branch/HOD
      if (name === 'department') {
        const branch = branches.find(b => b.code === value);
        if (branch) {
          // If there's a 'branch' field in the schema, sync it
          if (selectedTemplate?.schema.some(f => f.name === 'branch')) {
            newData.branch = branch.name;
          }
          newData.hodName = branch.hodName || '';
          newData.hodEmail = branch.hodEmail || '';
          newData.hodMobile = branch.hodMobile || '';
        }
      }

      // Sync Branch with Department
      if (name === 'branch') {
        const branch = branches.find(b => b.name === value || b.code === value);
        if (branch) {
          newData.department = branch.code;
          newData.hodName = branch.hodName || '';
          newData.hodEmail = branch.hodEmail || '';
          newData.hodMobile = branch.hodMobile || '';
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      
      // Deterministic ID to prevent duplicates (email + template + session + year)
      const deterministicId = `${formData.studentEmail}_${selectedTemplate.templateId}_${formData.session || 'NA'}_${formData.year || 'NA'}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');

      // User-friendly tracking ID
      const trackingId = `TAT-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await runTransaction(db, async (transaction) => {
        const appRef = doc(db, 'applications', deterministicId);
        const appDoc = await transaction.get(appRef);
        
        if (appDoc.exists()) {
          throw new Error('You have already submitted an application for this template in the current session/year.');
        }

        const application: Application = {
          trackingId: trackingId,
          studentEmail: formData.studentEmail,
          templateId: selectedTemplate.templateId,
          department: formData.department,
          status: 'PENDING',
          formData: formData,
          timestamps: {
            submittedAt: Timestamp.now(),
          }
        };

        transaction.set(appRef, application);
      });

      setTrackingId(trackingId);
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit application. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-950"><Loader message="Loading forms..." /></div>;

  if (trackingId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <GlassCard className="p-12 text-center max-w-lg">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/40">
              <CheckCircle className="text-white w-12 h-12" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Application Submitted!</h1>
            <p className="text-zinc-400 mb-8 text-lg">Your application has been received. Please save your tracking ID for future reference.</p>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Your Tracking ID</span>
              <span className="text-3xl font-mono font-bold text-emerald-400 tracking-wider">{trackingId}</span>
            </div>

            <button
              onClick={() => window.location.href = '/track'}
              className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              Track Status <ArrowRight className="w-5 h-5" />
            </button>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Apply for Certificate</h1>
          <p className="text-zinc-400 text-lg">Select a form type and fill in your details to apply for an official document.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form Selection & Details */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="text-emerald-500 w-6 h-6" />
                1. Select Form Type
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {templates.map(tpl => (
                  <button
                    key={tpl.templateId}
                    onClick={() => {
                      setSelectedTemplate(tpl);
                      setFormData({ studentEmail: '', department: '' });
                    }}
                    className={`p-6 rounded-2xl border transition-all text-left group ${
                      selectedTemplate?.templateId === tpl.templateId
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <h3 className={`font-bold text-lg mb-1 ${selectedTemplate?.templateId === tpl.templateId ? 'text-emerald-400' : 'text-white'}`}>
                      {tpl.name}
                    </h3>
                    <p className="text-sm text-zinc-500">Version {tpl.version}</p>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {selectedTemplate && (
                <motion.div
                  key={selectedTemplate.templateId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Send className="text-emerald-500 w-6 h-6" />
                    2. Fill Details
                  </h2>
                  <GlassCard className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
                        <input
                          type="email"
                          required
                          value={formData.studentEmail || ''}
                          onChange={(e) => handleInputChange('studentEmail', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                          placeholder="your@email.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Department</label>
                        <select
                          required
                          value={formData.department || ''}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                        >
                          <option value="" disabled className="bg-zinc-900">Select Department</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.code} className="bg-zinc-900">{b.name} ({b.code})</option>
                          ))}
                        </select>
                      </div>

                      {selectedTemplate.schema.map(field => (
                        <div key={field.name} className="space-y-2">
                          <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{field.label}</label>
                          
                          {field.name === 'companyName' && companies.length > 0 ? (
                            <div className="relative space-y-2">
                              {!isManualCompany ? (
                                <div className="relative">
                                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                                  <select
                                    required={field.required}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                                  >
                                    <option value="" disabled className="bg-zinc-900">Select Company</option>
                                    {companies.map(c => (
                                      <option key={c.id} value={c.name} className="bg-zinc-900">{c.name}</option>
                                    ))}
                                    <option value="OTHER" className="bg-zinc-900">Other (Manual Entry)</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                                    <input
                                      type="text"
                                      required
                                      value={formData[field.name] || ''}
                                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                      placeholder="Enter Company Name"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsManualCompany(false);
                                      handleInputChange('companyName', '');
                                    }}
                                    className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                                  >
                                    Back to List
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : field.name === 'duration' ? (
                            <div className="relative space-y-2">
                              {!isManualDuration ? (
                                <div className="relative">
                                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                                  <select
                                    required={field.required}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                                  >
                                    <option value="" disabled className="bg-zinc-900">Select Duration</option>
                                    {(selectedTemplate.allowedDurations && selectedTemplate.allowedDurations.length > 0 
                                      ? selectedTemplate.allowedDurations 
                                      : durations.map(d => d.name)
                                    ).map(durName => (
                                      <option key={durName} value={durName} className="bg-zinc-900">{durName}</option>
                                    ))}
                                    <option value="OTHER" className="bg-zinc-900">Other (Manual Entry)</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                                    <input
                                      type="text"
                                      required
                                      value={formData[field.name] || ''}
                                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                      placeholder="Enter Duration (e.g. 3 Months)"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsManualDuration(false);
                                      handleInputChange('duration', '');
                                    }}
                                    className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                                  >
                                    Back to List
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : field.name === 'startDate' ? (
                            <div className="relative space-y-2">
                              {!isManualStartDate ? (
                                <div className="relative">
                                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                                  <select
                                    required={field.required}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                                  >
                                    <option value="" disabled className="bg-zinc-900">Select Start Date</option>
                                    {(selectedTemplate.allowedStartDates && selectedTemplate.allowedStartDates.length > 0 
                                      ? selectedTemplate.allowedStartDates 
                                      : startDates.map(s => s.name)
                                    ).map(sdName => (
                                      <option key={sdName} value={sdName} className="bg-zinc-900">{sdName}</option>
                                    ))}
                                    <option value="OTHER" className="bg-zinc-900">Other (Manual Entry)</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="relative">
                                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                                    <input
                                      type="text"
                                      required
                                      value={formData[field.name] || ''}
                                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                      placeholder="Enter Start Date (e.g. June 2024)"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsManualStartDate(false);
                                      handleInputChange('startDate', '');
                                    }}
                                    className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                                  >
                                    Back to List
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : field.name === 'branch' && branches.length > 0 ? (
                            <div className="relative">
                              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                              <select
                                required={field.required}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                              >
                                <option value="" disabled className="bg-zinc-900">Select Branch</option>
                                {branches.map(b => (
                                  <option key={b.id} value={b.name} className="bg-zinc-900">{b.name} ({b.code})</option>
                                ))}
                              </select>
                            </div>
                          ) : field.type === 'select' ? (
                            <select
                              required={field.required}
                              value={formData[field.name] || ''}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                            >
                              <option value="" disabled className="bg-zinc-900">Select {field.label}</option>
                              {(field.name === 'year' ? years.map(y => y.name) : 
                                field.name === 'session' ? sessions.map(s => s.name) : 
                                field.options || []).map(opt => (
                                <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              required={field.required}
                              value={formData[field.name] || ''}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                              placeholder={`Enter ${field.label}`}
                            />
                          )}
                        </div>
                      ))}

                      {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <p>{error}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Submit Application'}
                      </button>
                    </form>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:col-span-7">
            <div className="sticky top-24 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Eye className="text-emerald-500 w-6 h-6" />
                  Live Preview
                </h2>
                {selectedTemplate && (
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {selectedTemplate.name}
                  </span>
                )}
              </div>

              {selectedTemplate ? (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white rounded-[2rem] p-12 shadow-2xl min-h-[842px] w-full overflow-hidden">
                    {/* Certificate Header with Logo */}
                    <div className="flex items-center justify-between mb-12 border-b-2 border-zinc-100 pb-8">
                      <img 
                        src="https://trident.ac.in/wp-content/uploads/2021/08/Trident-Logo.png" 
                        alt="Trident Academy Logo" 
                        className="h-20 object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-right">
                        <h1 className="text-2xl font-serif font-bold text-zinc-900 leading-tight">Trident Academy<br/>of Technology</h1>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Bhubaneswar, Odisha</p>
                      </div>
                    </div>

                    {/* Certificate Content */}
                    <div className="font-serif text-zinc-900 leading-relaxed text-lg">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: renderTemplate(selectedTemplate.content, formData) 
                        }} 
                      />
                    </div>

                    {/* Certificate Footer */}
                    <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t border-zinc-100 pt-8">
                      <div className="text-xs text-zinc-400 font-mono">
                        Verification ID: {trackingId || 'PENDING_SUBMISSION'}
                      </div>
                      <div className="text-center">
                        <div className="w-32 h-1 bg-zinc-200 mb-2 mx-auto"></div>
                        <p className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Authorized Signatory</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-24 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/2">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                    <Eye className="text-zinc-700 w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-400 mb-2">No Template Selected</h3>
                  <p className="text-zinc-600 max-w-xs">Select a form type from the left to see a live preview of your certificate.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
