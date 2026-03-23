import React, { useState, useRef } from 'react';
import { db, doc, getDoc } from '../firebase';
import { Application, Template, UserProfile } from '../types';
import { GlassCard } from '../components/GlassCard';
import { Loader } from '../components/Loader';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Download, Clock, CheckCircle, XCircle, FileText, ShieldCheck } from 'lucide-react';
import { generatePDF, renderTemplate } from '../utils/pdfGenerator';
import { QRCodeSVG } from 'qrcode.react';

export default function Track() {
  const [trackingId, setTrackingId] = useState('');
  const [application, setApplication] = useState<Application | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [hod, setHod] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setError(null);
    setApplication(null);

    try {
      const appDoc = await getDoc(doc(db, 'applications', trackingId.trim()));
      if (appDoc.exists()) {
        const appData = appDoc.data() as Application;
        setApplication(appData);

        // Fetch template
        const tplDoc = await getDoc(doc(db, 'templates', appData.templateId));
        if (tplDoc.exists()) {
          setTemplate(tplDoc.data() as Template);
        }

        // Fetch HOD signature if approved
        if (appData.status === 'APPROVED') {
          // In a real app, we'd find the HOD who approved it. 
          // For now, let's assume we fetch the HOD of that department.
          // This is a simplification for the demo.
        }
      } else {
        setError("No application found with this Tracking ID. Please check and try again.");
      }
    } catch (err) {
      console.error('Search error:', err);
      setError("An error occurred while fetching your application.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!certificateRef.current || !application) return;
    setDownloading(true);
    try {
      await generatePDF(certificateRef.current, `Certificate_${application.trackingId}.pdf`);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-12 h-12 text-emerald-500" />;
      case 'REJECTED': return <XCircle className="w-12 h-12 text-red-500" />;
      default: return <Clock className="w-12 h-12 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'REJECTED': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Track Application</h1>
          <p className="text-zinc-400 text-lg">Enter your tracking ID to check the status of your certificate request.</p>
        </div>

        <GlassCard className="p-8 mb-12">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <input
                type="text"
                required
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter Tracking ID (e.g. TAT-2026-9021)"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500 transition-colors text-lg font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Track'}
            </button>
          </form>
          {error && <p className="mt-4 text-red-400 text-sm flex items-center gap-2"><XCircle className="w-4 h-4" /> {error}</p>}
        </GlassCard>

        <AnimatePresence mode="wait">
          {application && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <GlassCard className="p-8 flex flex-col md:flex-row items-center gap-8">
                <div className={`p-4 rounded-3xl border ${getStatusColor(application.status)}`}>
                  {getStatusIcon(application.status)}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">Status: {application.status}</h2>
                    <span className="text-xs font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded border border-white/10">{application.trackingId}</span>
                  </div>
                  <p className="text-zinc-400">
                    {application.status === 'PENDING' && "Your application is currently under review by the HOD."}
                    {application.status === 'APPROVED' && "Congratulations! Your certificate is ready for download."}
                    {application.status === 'REJECTED' && "Your application was not approved. Please contact your department."}
                  </p>
                </div>
                {application.status === 'APPROVED' && (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-xl shadow-white/10"
                  >
                    {downloading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><Download className="w-5 h-5" /> Download PDF</>}
                  </button>
                )}
              </GlassCard>

              {/* Hidden Certificate for PDF Generation */}
              {application.status === 'APPROVED' && template && (
                <div className="hidden">
                  <div 
                    ref={certificateRef}
                    className="w-[210mm] min-h-[297mm] bg-white p-16 text-black relative font-serif border-[10px] border-double border-zinc-200"
                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                  >
                    {/* Header */}
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

                    {/* Content */}
                    <div className="text-lg leading-relaxed mb-16 whitespace-pre-wrap">
                      <div dangerouslySetInnerHTML={{ __html: renderTemplate(template.content, application.formData) }} />
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-end mt-24">
                      <div className="text-center">
                        <div className="w-48 h-1 bg-zinc-900 mb-2"></div>
                        <p className="font-bold">Authorized Signatory</p>
                        <p className="text-sm text-zinc-600">HOD, {application.department}</p>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <div className="p-2 border border-zinc-200 rounded-lg">
                          <QRCodeSVG 
                            value={`${window.location.origin}/verify/${application.trackingId}`} 
                            size={100}
                            level="H"
                          />
                        </div>
                        <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-tighter">Scan to Verify: {application.trackingId}</p>
                      </div>
                    </div>

                    {/* Security Hash */}
                    <div className="absolute bottom-8 left-16 right-16 flex items-center justify-between text-[10px] font-mono text-zinc-400 border-t border-zinc-100 pt-4">
                      <span>Verification Hash: {application.securityHash?.substring(0, 32)}...</span>
                      <span>Generated: {new Date(application.timestamps.approvedAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
