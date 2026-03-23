import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, setDoc, doc, deleteDoc } from '../firebase';
import { Template, TemplateField, Duration, StartDate } from '../types';
import { GlassCard } from '../components/GlassCard';
import { Loader } from '../components/Loader';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Save, Trash2, Edit3, Eye, Code, FileText, PlusCircle, X, Settings2, Clock, CalendarDays, Check } from 'lucide-react';
import { renderTemplate } from '../utils/pdfGenerator';

export default function TemplateBuilder() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [globalDurations, setGlobalDurations] = useState<Duration[]>([]);
  const [globalStartDates, setGlobalStartDates] = useState<StartDate[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tplSnap, durSnap, startSnap] = await Promise.all([
        getDocs(collection(db, 'templates')),
        getDocs(collection(db, 'durations')),
        getDocs(collection(db, 'start_dates'))
      ]);
      setTemplates(tplSnap.docs.map(doc => doc.data() as Template));
      setGlobalDurations(durSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Duration)));
      setGlobalStartDates(startSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StartDate)));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultTemplates = async () => {
    setSaving(true);
    try {
      const internshipTemplate: Template = {
        templateId: 'TPL_INTERN_APP',
        name: 'Internship Application Letter',
        version: 1,
        isActive: true,
        allowedDurations: ['3 Months', '5 Months', '6 Months'],
        allowedStartDates: ['June 2024', 'July 2024', 'January 2025'],
        content: `<div style="font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.5;">
  <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
    <div>Ref. No. {{refNo}}</div>
    <div>Date: {{date}}</div>
  </div>

  <div style="margin-bottom: 20px;">
    To,<br><br>
    <strong>{{recipientDesignation}}</strong>,<br>
    {{companyName}},<br>
    {{recipientAddress}}
  </div>

  <div style="margin-bottom: 20px; font-weight: bold;">
    Subject: Application for Internship Opportunity
  </div>

  <div style="margin-bottom: 20px;">
    Dear Sir/Madam,
  </div>

  <div style="margin-bottom: 20px; text-align: justify;">
    I am reaching out to formally request an internship opportunity on behalf of <strong>{{studentName}}</strong>, 
    a dedicated {{year}} B. Tech student majoring in {{branch}}. <strong>{{studentName}}</strong> 
    is currently enrolled in the academic session {{session}} at Trident Academy of Technology, 
    Bhubaneswar, and holds registration number <strong>{{regNo}}</strong>.
  </div>

  <div style="margin-bottom: 20px; text-align: justify;">
    Trident Academy of Technology is proud to be affiliated with Biju Patnaik University of Technology, 
    Rourkela, Odisha, and accredited by the All India Council of Technical Education (AICTE), New Delhi.
  </div>

  <div style="margin-bottom: 20px; text-align: justify;">
    We kindly ask for your consideration in allowing <strong>{{studentName}}</strong> to apply for an internship 
    within your esteemed organization. The proposed duration for this internship is {{duration}}, 
    starting from <strong>{{startDate}}</strong>.
  </div>

  <div style="margin-bottom: 20px; text-align: justify;">
    We firmly believe that an internship opportunity at your organization would offer <strong>{{studentName}}</strong> 
    invaluable hands-on experience, perfectly aligning with his academic pursuits and future career aspirations.
  </div>

  <div style="margin-bottom: 40px;">
    Thank you sincerely for reviewing our request.
  </div>

  <div>
    Yours faithfully,<br><br><br>
    <strong>{{hodName}}</strong>,<br>
    HOD ({{branch}}),<br>
    Trident Academy of Technology,<br>
    Mail: {{hodEmail}}<br>
    Mobile: {{hodMobile}}
  </div>
</div>`,
        schema: [
          { name: 'refNo', label: 'Reference Number', type: 'text', required: true },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'companyName', label: 'Company Name', type: 'text', required: true },
          { name: 'recipientDesignation', label: 'Recipient Designation', type: 'text', required: true },
          { name: 'recipientAddress', label: 'Recipient Address', type: 'text', required: true },
          { name: 'studentName', label: 'Student Name', type: 'text', required: true },
          { name: 'year', label: 'Year', type: 'select', required: true, options: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
          { name: 'branch', label: 'Branch/Department', type: 'text', required: true },
          { name: 'session', label: 'Academic Session', type: 'select', required: true, options: ['2021-25', '2022-26', '2023-27', '2024-28'] },
          { name: 'regNo', label: 'Registration Number', type: 'text', required: true },
          { name: 'duration', label: 'Duration', type: 'text', required: true },
          { name: 'startDate', label: 'Start Date', type: 'text', required: true },
          { name: 'hodName', label: 'HOD Name', type: 'text', required: true },
          { name: 'hodEmail', label: 'HOD Email', type: 'text', required: true },
          { name: 'hodMobile', label: 'HOD Mobile', type: 'text', required: true },
        ]
      };

      const apprenticeTemplate: Template = {
        templateId: 'TPL_APPRENTICE_APP',
        name: 'Apprenticeship Application Letter',
        version: 1,
        isActive: true,
        allowedDurations: ['1 Year', '2 Years'],
        allowedStartDates: ['October 2024', 'November 2024'],
        content: `<div style="font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.5;">
  <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
    <div>Ref. No. {{refNo}}</div>
    <div>Date: {{date}}</div>
  </div>

  <div style="margin-bottom: 20px;">
    To,<br><br>
    <strong>{{recipientDesignation}}</strong>,<br>
    {{companyName}},<br>
    {{recipientAddress}}
  </div>

  <div style="margin-bottom: 20px; font-weight: bold;">
    Subject: Application for apprenticeship Opportunity
  </div>

  <div style="margin-bottom: 20px;">
    Dear Sir/Madam,
  </div>

  <div style="margin-bottom: 20px; text-align: justify;">
    I am reaching out to formally request an apprenticeship opportunity on behalf of <strong>{{studentName}}</strong>, 
    a dedicated {{year}} B. Tech student majoring in {{branch}}. <strong>{{studentName}}</strong> 
    is currently enrolled in the academic session {{session}} at Trident Academy of Technology, 
    Bhubaneswar, and holds registration number <strong>{{regNo}}</strong>.
  </div>

  <div style="margin-bottom: 20px; text-align: justify;">
    Trident Academy of Technology is proud to be affiliated with Biju Patnaik University of Technology, 
    Rourkela, Odisha, and accredited by the All India Council of Technical Education (AICTE), New Delhi.
  </div>

  <div style="margin-bottom: 20px; text-align: justify;">
    We kindly ask for your consideration in allowing <strong>{{studentName}}</strong> to apply for an apprenticeship 
    within your esteemed organization. The proposed duration for this apprenticeship is {{duration}}, 
    starting from <strong>{{startDate}}</strong>.
  </div>

  <div style="margin-bottom: 20px; text-align: justify;">
    We firmly believe that an apprenticeship opportunity at your organization would offer <strong>{{studentName}}</strong> 
    invaluable hands-on experience, perfectly aligning with his academic pursuits and future career aspirations.
  </div>

  <div style="margin-bottom: 40px;">
    Thank you sincerely for reviewing our request.
  </div>

  <div>
    Yours faithfully,<br><br><br>
    <strong>{{hodName}}</strong>,<br>
    HoD ({{branch}}),<br>
    Trident Academy of Technology,<br>
    Mail: {{hodEmail}}<br>
    Mobile: {{hodMobile}}
  </div>
</div>`,
        schema: [
          { name: 'refNo', label: 'Reference Number', type: 'text', required: true },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'companyName', label: 'Company Name', type: 'text', required: true },
          { name: 'recipientDesignation', label: 'Recipient Designation', type: 'text', required: true },
          { name: 'recipientAddress', label: 'Recipient Address', type: 'text', required: true },
          { name: 'studentName', label: 'Student Name', type: 'text', required: true },
          { name: 'year', label: 'Year', type: 'select', required: true, options: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
          { name: 'branch', label: 'Branch/Department', type: 'text', required: true },
          { name: 'session', label: 'Academic Session', type: 'select', required: true, options: ['2021-25', '2022-26', '2023-27', '2024-28'] },
          { name: 'regNo', label: 'Registration Number', type: 'text', required: true },
          { name: 'duration', label: 'Duration', type: 'text', required: true },
          { name: 'startDate', label: 'Start Date', type: 'text', required: true },
          { name: 'hodName', label: 'HOD Name', type: 'text', required: true },
          { name: 'hodEmail', label: 'HOD Email', type: 'text', required: true },
          { name: 'hodMobile', label: 'HOD Mobile', type: 'text', required: true },
        ]
      };

      await setDoc(doc(db, 'templates', internshipTemplate.templateId), internshipTemplate);
      await setDoc(doc(db, 'templates', apprenticeTemplate.templateId), apprenticeTemplate);
      await fetchTemplates();
      alert('Default templates seeded successfully!');
    } catch (err) {
      console.error('Error seeding templates:', err);
      alert('Failed to seed templates.');
    } finally {
      setSaving(false);
    }
  };

  const fetchTemplates = async () => {
    const snapshot = await getDocs(collection(db, 'templates'));
    setTemplates(snapshot.docs.map(doc => doc.data() as Template));
  };

  const handleSave = async () => {
    if (!editingTemplate?.templateId || !editingTemplate?.name) return;
    setSaving(true);
    try {
      const template: Template = {
        templateId: editingTemplate.templateId,
        name: editingTemplate.name,
        version: editingTemplate.version || 1,
        content: editingTemplate.content || '',
        schema: editingTemplate.schema || [],
        isActive: editingTemplate.isActive ?? true,
        allowedDurations: editingTemplate.allowedDurations || [],
        allowedStartDates: editingTemplate.allowedStartDates || [],
      };
      await setDoc(doc(db, 'templates', template.templateId), template);
      await fetchTemplates();
      setEditingTemplate(null);
    } catch (err) {
      console.error('Error saving template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await deleteDoc(doc(db, 'templates', id));
      await fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  const addField = () => {
    const newField: TemplateField = { name: '', label: '', type: 'text', required: true };
    setEditingTemplate(prev => ({
      ...prev!,
      schema: [...(prev?.schema || []), newField]
    }));
  };

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    const newSchema = [...(editingTemplate?.schema || [])];
    newSchema[index] = { ...newSchema[index], ...updates };
    setEditingTemplate(prev => ({ ...prev!, schema: newSchema }));
  };

  const removeField = (index: number) => {
    const newSchema = [...(editingTemplate?.schema || [])];
    newSchema.splice(index, 1);
    setEditingTemplate(prev => ({ ...prev!, schema: newSchema }));
  };

  // Auto-detect placeholders in content
  useEffect(() => {
    if (editingTemplate?.content) {
      const placeholders = editingTemplate.content.match(/{{(.*?)}}/g);
      if (placeholders) {
        const detectedNames = placeholders.map(p => p.replace(/{{|}}/g, ''));
        const currentSchema = editingTemplate.schema || [];
        const currentNames = currentSchema.map(f => f.name);
        
        const newFields: TemplateField[] = [];
        detectedNames.forEach(name => {
          if (!currentNames.includes(name)) {
            newFields.push({ name, label: name.charAt(0).toUpperCase() + name.slice(1), type: 'text', required: true });
          }
        });

        if (newFields.length > 0) {
          setEditingTemplate(prev => ({
            ...prev!,
            schema: [...currentSchema, ...newFields]
          }));
        }
      }
    }
  }, [editingTemplate?.content]);

  if (loading) return <Loader message="Loading templates..." />;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Template Builder</h1>
          <p className="text-zinc-400">Design dynamic certificate templates and forms.</p>
        </div>
        {!editingTemplate && (
          <div className="flex gap-4">
            <button
              onClick={seedDefaultTemplates}
              disabled={saving}
              className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <FileText className="w-5 h-5" /> Seed Default
            </button>
            <button
              onClick={() => setEditingTemplate({ templateId: `TPL_${Date.now()}`, name: '', version: 1, content: '', schema: [], isActive: true })}
              className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-5 h-5" /> New Template
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {editingTemplate ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Editor Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <GlassCard className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings2 className="text-emerald-500 w-5 h-5" />
                    Properties
                  </h2>
                  <button onClick={() => setEditingTemplate(null)} className="text-zinc-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Template Name</label>
                    <input
                      type="text"
                      value={editingTemplate.name || ''}
                      onChange={(e) => setEditingTemplate(prev => ({ ...prev!, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="e.g. Internship Letter"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Template ID</label>
                    <input
                      type="text"
                      value={editingTemplate.templateId || ''}
                      onChange={(e) => setEditingTemplate(prev => ({ ...prev!, templateId: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Allowed Durations
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {globalDurations.map(dur => {
                        const isSelected = editingTemplate.allowedDurations?.includes(dur.name);
                        return (
                          <button
                            key={dur.id}
                            onClick={() => {
                              const current = editingTemplate.allowedDurations || [];
                              const next = isSelected 
                                ? current.filter(d => d !== dur.name)
                                : [...current, dur.name];
                              setEditingTemplate(prev => ({ ...prev!, allowedDurations: next }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isSelected 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-white/5 text-zinc-500 border border-white/10 hover:border-white/20'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            {dur.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-blue-500" />
                      Allowed Start Dates
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {globalStartDates.map(sd => {
                        const isSelected = editingTemplate.allowedStartDates?.includes(sd.name);
                        return (
                          <button
                            key={sd.id}
                            onClick={() => {
                              const current = editingTemplate.allowedStartDates || [];
                              const next = isSelected 
                                ? current.filter(d => d !== sd.name)
                                : [...current, sd.name];
                              setEditingTemplate(prev => ({ ...prev!, allowedStartDates: next }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isSelected 
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                : 'bg-white/5 text-zinc-500 border border-white/10 hover:border-white/20'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            {sd.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Form Fields</h3>
                    <button onClick={addField} className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      <PlusCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {editingTemplate.schema?.map((field, idx) => (
                      <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 relative group">
                        <button
                          onClick={() => removeField(idx)}
                          className="absolute top-2 right-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(idx, { label: e.target.value })}
                          className="w-full bg-transparent border-b border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
                          placeholder="Field Label"
                        />
                        <div className="flex gap-2">
                          <select
                            value={field.type}
                            onChange={(e) => updateField(idx, { type: e.target.value as any, options: e.target.value === 'select' ? [] : undefined })}
                            className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-400"
                          >
                            <option value="text">Text</option>
                            <option value="date">Date</option>
                            <option value="number">Number</option>
                            <option value="select">Select</option>
                          </select>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(idx, { name: e.target.value })}
                            className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-400 font-mono"
                            placeholder="ID ({{id}})"
                          />
                        </div>
                        {field.type === 'select' && (
                          <div className="space-y-2 pt-2">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase">Options (comma separated)</label>
                            <input
                              type="text"
                              value={field.options?.join(', ') || ''}
                              onChange={(e) => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                              placeholder="Option 1, Option 2..."
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> Save Template</>}
                </button>
              </GlassCard>
            </div>

            {/* Main Content Editor */}
            <div className="lg:col-span-2 space-y-6">
              <GlassCard className="p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex bg-white/5 p-1 rounded-xl">
                    <button
                      onClick={() => setPreviewMode(false)}
                      className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${!previewMode ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <Code className="w-4 h-4" /> Design View
                    </button>
                    <button
                      onClick={() => setPreviewMode(true)}
                      className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${previewMode ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <Eye className="w-4 h-4" /> Live Preview
                    </button>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono">
                    Use <span className="text-emerald-400">{"{{placeholder}}"}</span> to insert dynamic fields.
                  </div>
                </div>

                <div className="flex-1 min-h-[500px]">
                  {!previewMode ? (
                    <textarea
                      value={editingTemplate.content || ''}
                      onChange={(e) => setEditingTemplate(prev => ({ ...prev!, content: e.target.value }))}
                      className="w-full h-full bg-white/5 border border-white/10 rounded-2xl p-8 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50 resize-none custom-scrollbar"
                      placeholder="Dear {{studentName}}, we are pleased to inform you..."
                    />
                  ) : (
                    <div className="w-full h-full bg-white rounded-2xl p-12 text-black overflow-y-auto custom-scrollbar shadow-inner">
                      <div className="max-w-[800px] mx-auto font-serif leading-relaxed text-lg">
                        <div dangerouslySetInnerHTML={{ __html: renderTemplate(editingTemplate.content || '', previewData) }} />
                      </div>
                    </div>
                  )}
                </div>

                {previewMode && (
                  <div className="mt-6 p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Test Preview Data</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {editingTemplate.schema?.map(field => (
                        <div key={field.name} className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">{field.label}</label>
                          <input
                            type="text"
                            value={previewData[field.name] || ''}
                            onChange={(e) => setPreviewData(prev => ({ ...prev, [field.name]: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-white"
                            placeholder={`Test ${field.label}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl, i) => (
              <motion.div
                key={tpl.templateId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-6 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                      <FileText className="text-zinc-500 group-hover:text-emerald-400 w-6 h-6" />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingTemplate(tpl)}
                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tpl.templateId)}
                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{tpl.name}</h3>
                  <p className="text-sm text-zinc-500 mb-4">Version {tpl.version} • {tpl.schema.length} Fields</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${tpl.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {tpl.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600">{tpl.templateId}</span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
