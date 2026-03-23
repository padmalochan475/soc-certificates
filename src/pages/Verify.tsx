import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, doc, getDoc } from '../firebase';
import { Application, Template } from '../types';
import { GlassCard } from '../components/GlassCard';
import { Loader } from '../components/Loader';
import { motion } from 'motion/react';
import { ShieldCheck, XCircle, Search, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { verifySecurityHash } from '../utils/hashEngine';

export default function Verify() {
  const { trackingId: paramId } = useParams();
  const [trackingId, setTrackingId] = useState(paramId || '');
  const [application, setApplication] = useState<Application | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  const handleVerify = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    setApplication(null);
    setIsVerified(null);

    try {
      const appDoc = await getDoc(doc(db, 'applications', id.trim()));
      if (appDoc.exists()) {
        const appData = appDoc.data() as Application;
        setApplication(appData);

        if (appData.status === 'APPROVED' && appData.securityHash) {
          // Verify hash
          const verified = await verifySecurityHash(appData.formData, appData.securityHash);
          setIsVerified(verified);
        } else {
          setIsVerified(false);
        }

        const tplDoc = await getDoc(doc(db, 'templates', appData.templateId));
        if (tplDoc.exists()) {
          setTemplate(tplDoc.data() as Template);
        }
      } else {
        setError("No certificate found with this Tracking ID.");
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError("An error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramId) {
      handleVerify(paramId);
    }
  }, [paramId]);

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Certificate Verification</h1>
          <p className="text-zinc-400 text-lg">Verify the authenticity of a TAT issued document instantly.</p>
        </div>

        {!paramId && (
          <GlassCard className="p-8 mb-12">
            <form onSubmit={(e) => { e.preventDefault(); handleVerify(trackingId); }} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Enter Tracking ID to Verify"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500 transition-colors text-lg font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify'}
              </button>
            </form>
            {error && <p className="mt-4 text-red-400 text-sm flex items-center gap-2"><XCircle className="w-4 h-4" /> {error}</p>}
          </GlassCard>
        )}

        {loading && <Loader message="Verifying authenticity..." />}

        {application && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {isVerified ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-12 text-center shadow-2xl shadow-emerald-500/10">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/40">
                  <ShieldCheck className="text-white w-14 h-14" />
                </div>
                <h2 className="text-4xl font-bold text-emerald-400 mb-4">VERIFIED AUTHENTIC</h2>
                <p className="text-zinc-300 text-lg mb-8">This document is genuine and was officially issued by Techno Academic Trust.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Issued To</span>
                    <span className="text-xl font-bold text-white">{application.formData.studentName || 'N/A'}</span>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Document Type</span>
                    <span className="text-xl font-bold text-white">{template?.name || 'N/A'}</span>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Department</span>
                    <span className="text-xl font-bold text-white">{application.department}</span>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Issue Date</span>
                    <span className="text-xl font-bold text-white">{new Date(application.timestamps.approvedAt?.seconds * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-12 text-center shadow-2xl shadow-red-500/10">
                <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-500/40">
                  <AlertCircle className="text-white w-14 h-14" />
                </div>
                <h2 className="text-4xl font-bold text-red-400 mb-4">VERIFICATION FAILED</h2>
                <p className="text-zinc-300 text-lg mb-8">This document could not be verified. It may have been tampered with or revoked.</p>
              </div>
            )}

            <div className="flex justify-center">
              <Link to="/verify" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Verify another document
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
