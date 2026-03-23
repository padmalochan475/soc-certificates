import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc, updateDoc, Timestamp } from '../firebase';
import { Application, Template, UserProfile } from '../types';
import { useAuth } from '../components/AuthProvider';
import { GlassCard } from '../components/GlassCard';
import { Loader } from '../components/Loader';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, FileText, ArrowLeft, ShieldCheck, Eye, Lock, AlertCircle, Clock } from 'lucide-react';
import { generateSecurityHash } from '../utils/hashEngine';
import { renderTemplate } from '../utils/pdfGenerator';
import { QRCodeSVG } from 'qrcode.react';

export default function ReviewApplication() {
  const { trackingId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!trackingId) return;
      try {
        const appDoc = await getDoc(doc(db, 'applications', trackingId));
        if (appDoc.exists()) {
          const appData = appDoc.data() as Application;
          setApplication(appData);

          const tplDoc = await getDoc(doc(db, 'templates', appData.templateId));
          if (tplDoc.exists()) {
            setTemplate(tplDoc.data() as Template);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [trackingId]);

  const handleApprove = async () => {
    if (pin !== '1234') { // Mock PIN for demo
      setError('Invalid Security PIN. Please try again.');
      return;
    }

    if (!application || !template) return;
    setActionLoading(true);
    setError(null);

    try {
      // Generate security hash
      const hash = await generateSecurityHash(application.formData);
      
      await updateDoc(doc(db, 'applications', application.trackingId), {
        status: 'APPROVED',
        securityHash: hash,
        'timestamps.approvedAt': Timestamp.now()
      });

      setShowPinModal(false);
      navigate('/hod');
    } catch (err) {
      console.error('Approval error:', err);
      setError('Failed to approve application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    if (!confirm('Are you sure you want to reject this application?')) return;
    
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'applications', application.trackingId), {
        status: 'REJECTED',
        'timestamps.approvedAt': Timestamp.now()
      });
      navigate('/hod');
    } catch (err) {
      console.error('Rejection error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader message="Fetching application details..." />;
  if (!application || !template) return <div className="p-8 text-center text-zinc-500">Application not found.</div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/hod')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </button>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setPreviewMode(false)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${!previewMode ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            <FileText className="w-4 h-4" /> Data View
          </button>
          <button
            onClick={() => setPreviewMode(true)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${previewMode ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            <Eye className="w-4 h-4" /> Certificate Preview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {!previewMode ? (
              <motion.div key="data" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <GlassCard className="p-8 space-y-8">
                  <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{application.formData.studentName || 'Student Details'}</h2>
                      <p className="text-zinc-500">{application.studentEmail} • {application.department}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${
                      application.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      application.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {application.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {Object.entries(application.formData).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</label>
                        <p className="text-lg text-white font-medium">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <GlassCard className="p-12 bg-white text-black min-h-[800px] shadow-2xl relative overflow-hidden">
                  <div className="max-w-[800px] mx-auto font-serif leading-relaxed text-lg">
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
                    <div dangerouslySetInnerHTML={{ __html: renderTemplate(template.content, application.formData) }} />
                    
                    <div className="flex justify-between items-end mt-24">
                      <div className="text-center">
                        <div className="w-48 h-1 bg-zinc-900 mb-2"></div>
                        <p className="font-bold">Authorized Signatory</p>
                        <p className="text-sm text-zinc-600">HOD, {application.department}</p>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-2 border border-zinc-200 rounded-lg">
                          <QRCodeSVG value={`${window.location.origin}/verify/${application.trackingId}`} size={80} />
                        </div>
                        <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-tighter">Scan to Verify</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-8 space-y-6 sticky top-24">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-emerald-500 w-5 h-5" />
              Decision Panel
            </h3>
            <p className="text-sm text-zinc-400">Review the student's data and the certificate preview before making a final decision.</p>
            
            <div className="space-y-4 pt-4">
              <button
                onClick={() => setShowPinModal(true)}
                disabled={application.status !== 'PENDING' || actionLoading}
                className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle className="w-5 h-5" /> Approve Application
              </button>
              <button
                onClick={handleReject}
                disabled={application.status !== 'PENDING' || actionLoading}
                className="w-full py-4 bg-white/5 border border-white/10 text-red-400 font-bold rounded-xl hover:bg-red-500/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" /> Reject Application
              </button>
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 text-zinc-500 text-xs">
                <Clock className="w-4 h-4" />
                <span>Submitted: {new Date(application.timestamps.submittedAt?.seconds * 1000).toLocaleString()}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <GlassCard className="p-8 w-full max-w-sm text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lock className="text-emerald-500 w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Digital Signature</h2>
                <p className="text-zinc-400 mb-6">Enter your 4-digit security PIN to authorize this certificate.</p>
                
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-3xl font-bold tracking-[1em] text-white focus:outline-none focus:border-emerald-500 transition-colors mb-4"
                  placeholder="••••"
                  autoFocus
                />

                {error && <p className="text-red-400 text-sm mb-4 flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPinModal(false)}
                    className="flex-1 py-3 bg-white/5 text-zinc-400 font-bold rounded-xl hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={pin.length !== 4 || actionLoading}
                    className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
                <p className="mt-4 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Demo PIN: 1234</p>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
