import React, { useState } from 'react';
import { Client, Project, Invoice } from '../../types';
import { useCollection } from '../../lib/hooks';
import { where, updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { updateSandboxDoc } from '../../lib/sandbox';
import { 
  X, 
  Building, 
  Mail, 
  DollarSign, 
  Briefcase, 
  FileText, 
  Calendar,
  Phone,
  Bookmark,
  Sparkles,
  Award,
  Bell,
  Clock,
  CheckCircle,
  Copy,
  Edit2,
  Save,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ClientProfileModalProps {
  client: Client;
  onClose: () => void;
}

export default function ClientProfileModal({ client, onClose }: ClientProfileModalProps) {
  // Query all projects & invoices for this client
  const { data: projects } = useCollection<Project>('projects', [where('clientId', '==', client.id)]);
  const { data: invoices } = useCollection<Invoice>('invoices', [where('clientId', '==', client.id)]);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(client.notes || '');
  const [phone, setPhone] = useState(client.phone || '');
  const [stage, setStage] = useState<Client['stage']>(client.stage || 'lead');
  const [nextFollowUp, setNextFollowUp] = useState(client.nextFollowUp || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Proposal Generator State
  const [showProposalGen, setShowProposalGen] = useState(false);
  const [proposalTemplate, setProposalTemplate] = useState<'website' | 'branding' | 'rework' | 'marketing'>('website');
  const [estimatedBudget, setEstimatedBudget] = useState('5000');
  const [timelineWeeks, setTimelineWeeks] = useState('4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Aggregate financial stats
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidBilled = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const unpaidBilled = invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0);

  // Handle Client Profile Updates
  const handleSaveChanges = async () => {
    try {
      const updatedFields = {
        notes,
        phone,
        stage,
        nextFollowUp
      };

      if (localStorage.getItem('demo_user')) {
        updateSandboxDoc('clients', client.id, updatedFields);
      } else {
        await updateDoc(doc(db, 'clients', client.id), updatedFields);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'clients');
    }
  };

  // Generate high-fidelity custom pitch draft based on requirements
  const handleGenerateProposal = () => {
    setIsGenerating(true);
    setGeneratedDraft('');
    
    setTimeout(() => {
      const clientName = client.name;
      const company = client.company || 'your brand';
      const budget = parseFloat(estimatedBudget) || 5000;
      const clientNotes = notes || 'a complete premium upgrade';

      let text = '';
      if (proposalTemplate === 'website') {
        text = `⭐ CLIENT ACQUISITION PROPOSAL: PREMIUM WEB DEVELOPMENT ⭐
Prepared for: ${clientName} (${company})
Scope: High-converting, lightning-fast interactive web experience
Budget: $${budget.toLocaleString()} USD | Timeline: ${timelineWeeks} Weeks

Dear ${clientName},

Thank you for discussing your business objectives with us. Based on your brand requirements, we are proposing a scalable, high-performance web platform tailored specifically for ${company}.

🎯 CORE DELIVERABLES:
1. High-Converting Landing Infrastructure: Tailored typography and modern responsive grid layouts.
2. Speed-optimized Server Ecosystem: Leveraging Cloud Run deployment protocols and native edge caching.
3. Live CRM integrations: Fully synchronizing lead capture mechanisms inline.
4. Interactive Client Dashboards: A specialized space matching the exact flow you need.

💰 INVESTMENT TIMELINE:
- Initial Mobilization Fee (On Acceptance): $${(budget * 0.45).toLocaleString()} USD
- Beta Prototype Clearance: $${(budget * 0.35).toLocaleString()} USD
- Deployment & Live Handoff: $${(budget * 0.20).toLocaleString()} USD

Let us transform ${company}'s digital footprint into an enterprise-ready powerhouse. We can kick off as early as next Monday.

Best regards,
SaaS Ops & ClientFlow Assistant`;
      } else if (proposalTemplate === 'branding') {
        text = `🎨 BRAND IDENTITY & DESIGN SYSTEM BLUEPRINT 🎨
Prepared for: ${clientName} (${company})
Scope: Comprehensive brand overhaul, UI guidelines, and digital vector media
Budget: $${budget.toLocaleString()} USD | Timeline: ${timelineWeeks} Weeks

Dear ${clientName},

In today's dense product market, standing out is a strategic choice. We have designed a design acceleration framework to update ${company} into a premium, world-class aesthetic that commands attention.

🎯 CORE DELIVERABLES:
1. Primary Symbol Signature & Variants: Master logo suite suitable for dark/light grids and print layouts.
2. Systemic Design Manual: Color, font pairing guidelines, scales, tracking recommendations.
3. Marketing Deliverables: Full vector media assets and promotional newsletter designs.
4. Product UI Kit: 45 styled atomic components in Figma prepared for immediate frontend assembly.

💰 INVESTMENT TIMELINE:
- Research & Brand Strategy: $${(budget * 0.40).toLocaleString()} USD
- Logo Drafts & component styling: $${(budget * 0.40).toLocaleString()} USD
- Hand-off Files of vector properties: $${(budget * 0.20).toLocaleString()} USD

Looking forward to engineering this creative shift with you.

Warmly,
SaaS Ops & ClientFlow Assistant`;
      } else if (proposalTemplate === 'rework') {
        text = `🛠️ FRONTEND ACCELERATION & EXPERIENCE UPGRADE PROPOSAL 🛠️
Prepared for: ${clientName} (${company})
Scope: Complete application rewrite, animation optimization, and performance lift
Budget: $${budget.toLocaleString()} USD | Timeline: ${timelineWeeks} Weeks

Dear ${clientName},

Your application requirements ("${clientNotes.substring(0, 100)}") indicate a crucial need for optimal performance, user interface polish, and modern reactivity. Here is our architectural plan for the ${company} web platform:

🎯 TECHNICAL RESOLUTIONS:
1. React Performance Lift: Staggered entry transitions via 'motion/react' and reduced re-renders.
2. Core Web Vital Hardening: 100% Core Web Vital scores, leveraging Tailwind CSS optimization.
3. Mobile Responsiveness: Desktop-first precision with mobile-first code blocks.
4. Live Synchronization Integrations: Clean sandbox-to-production persistence parameters.

💰 INVESTMENT TIMELINE:
- Architecture Design & Review: $${(budget * 0.30).toLocaleString()} USD
- Coding & Tailwind Re-assembly: $${(budget * 0.50).toLocaleString()} USD
- Testing & Cloud Migration: $${(budget * 0.20).toLocaleString()} USD

We are eager to upgrade your user retention stats together.

Aesthetic regards,
ClientFlow Assistant`;
      } else {
        text = `🚀 DIGITAL ACQUISITION & INTEGRITY MARKETING FUNNEL 🚀
Prepared for: ${clientName} (${company})
Scope: Lead funnel monetization, newsletter copy, and conversion boost
Budget: $${budget.toLocaleString()} USD | Timeline: ${timelineWeeks} Weeks

Dear ${clientName},

Let's accelerate ${company}'s sales pipeline directly to growth parity. Based on our audit, we are proposing a high-impact conversion pipeline to nurture leads efficiently and increase user activation.

🎯 CAMPAIGN KEYSTONES:
1. Direct Capture High-converting Sales Funnel: Modern design paired with strict value hooks.
2. Segmented Newsletter Workflows: Automated 5-stage follow-up emails in markdown copy.
3. Analytical Integration Boards: Instant transparent insight logs of client tracking.
4. Weekly Growth Interventions: Strategic alignment calls focusing on user retention and margins.

💰 INVESTMENT TIMELINE:
- Funnel Launch Strategy: $${(budget * 0.35).toLocaleString()} USD
- Integration & Content Assembly: $${(budget * 0.45).toLocaleString()} USD
- Tuning, Scaling, and Hand-off: $${(budget * 0.20).toLocaleString()} USD

Let's unlock your business's true transactional throughput.

To your growth,
ClientFlow Growth Strategist`;
      }

      setGeneratedDraft(text);
      setIsGenerating(false);
    }, 1200);
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(generatedDraft);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-[#0A192F] text-white p-6 md:p-8 flex items-center justify-between shrink-0">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight">{client.name}</h2>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                stage === 'active' ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300' :
                stage === 'proposal' ? 'bg-blue-500/25 border-blue-500/50 text-blue-300' :
                stage === 'negotiation' ? 'bg-amber-500/25 border-amber-500/50 text-amber-300' :
                stage === 'lost' ? 'bg-slate-500/25 border-slate-500/50 text-slate-350' :
                'bg-purple-500/25 border-purple-500/50 text-purple-300'
              )}>
                {stage} stage
              </span>
            </div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-slate-450" />
              {client.company || 'Independent Private Client'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProposalGen(!showProposalGen)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Proposal Pitch
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
          {/* Main Workspace Split Layout: CRM Stats & Proposal Wizard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Area: Financial stats & Notes Updates */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Financial Dashboard Ledger */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-55/40 rounded-xl border border-emerald-100/60 flex flex-col justify-between text-left">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block mb-1">Total Paid</span>
                  <p className="text-lg font-extrabold text-emerald-900 font-mono">
                    ${paidBilled.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                
                <div className="p-4 bg-amber-55/40 rounded-xl border border-amber-100/65 flex flex-col justify-between text-left">
                  <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block mb-1">Outstanding</span>
                  <p className="text-lg font-extrabold text-amber-900 font-mono">
                    ${unpaidBilled.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between text-left">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Total Contracts</span>
                  <p className="text-lg font-extrabold text-slate-900 font-mono">
                    ${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {/* CRM Live logs, Profile and Edit Section */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-150">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-left">
                    <Bookmark className="w-4 h-4 text-slate-500" />
                    Deal Profile & Logs
                  </h3>
                  
                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleSaveChanges();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Lead Info
                      </>
                    )}
                  </button>
                </div>

                {saveSuccess && (
                  <div className="mb-4 p-2.5 bg-emerald-50 text-emerald-800 text-[11px] rounded-lg text-left font-bold flex items-center gap-1.5 animate-pulse">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    CRM Record Updated Successfully!
                  </div>
                )}

                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Stage Stage</span>
                      {isEditing ? (
                        <select
                          value={stage}
                          onChange={(e) => setStage(e.target.value as Client['stage'])}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                        >
                          <option value="lead">Prospect / Lead</option>
                          <option value="proposal">Proposal Drafted</option>
                          <option value="negotiation">In Negotiation</option>
                          <option value="active">Active Client</option>
                          <option value="lost">Lost / Cold</option>
                        </select>
                      ) : (
                        <span className="text-xs text-slate-700 font-bold capitalize">{stage || 'lead'}</span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact Phone</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                          placeholder="+1 (555) 000-0000"
                        />
                      ) : (
                        <span className="text-xs text-slate-700 font-semibold">{phone || 'Not Logged'}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Primary Email</span>
                      <span className="text-xs text-blue-600 font-semibold block truncate leading-tight select-all">{client.email}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Bell className="w-3 h-3 text-slate-400" />
                        Next CRM Follow-up Alarm
                      </span>
                      {isEditing ? (
                        <input
                          type="date"
                          value={nextFollowUp}
                          onChange={(e) => setNextFollowUp(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {nextFollowUp ? (
                            <>
                              <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-black font-mono">
                                {format(new Date(nextFollowUp), 'MMM dd, yyyy')}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold">No Follow-up Scheduled</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Client Pitch Notes & Requirements Logs</span>
                    {isEditing ? (
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 h-24 font-medium"
                        placeholder="Log budget estimates, scope adjustments, or client feedback notes here."
                      />
                    ) : (
                      <p className="text-xs text-slate-650 leading-relaxed bg-white border border-slate-150 p-3 rounded-xl font-medium whitespace-pre-wrap">
                        {notes || 'No custom budget estimates or requirements notes logged for this contact yet.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Linked Projects Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 text-left">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Linked Projects ({projects.length})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map(p => (
                    <div key={p.id} className="p-4 bg-slate-50/40 rounded-xl border border-slate-150 text-left flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 line-clamp-1">{p.name}</h4>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-bold">
                          Due {format(new Date(p.deadline), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-lg border border-blue-50">
                        {p.progress}%
                      </span>
                    </div>
                  ))}

                  {projects.length === 0 && (
                    <p className="text-xs text-slate-400 font-medium py-3 col-span-2 select-none">No active shared contracts launched yet.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Right Area: Proposal Pitch Generator Canvas */}
            <div className="lg:col-span-5 border-l border-slate-100 lg:pl-6 space-y-6 text-left">
              <AnimatePresence mode="wait">
                {showProposalGen ? (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-5 bg-blue-50/30 rounded-2xl border border-blue-150 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-blue-150">
                      <span className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        AI Proposal Architect
                      </span>
                      <button 
                        onClick={() => setShowProposalGen(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600"
                      >
                        Hide Panel
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
                      Generate a beautiful client acquisition or scope increase proposal customized matching requirements.
                    </p>

                    <div className="space-y-3 pt-2 text-xs font-semibold">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Project Niche Template</label>
                        <select
                          value={proposalTemplate}
                          onChange={(e) => setProposalTemplate(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="website">Premium Web App Suite</option>
                          <option value="branding">Corporate Identity & Logo Set</option>
                          <option value="rework">Tailwind UI/UX Performance Rework</option>
                          <option value="marketing">Sales Funnel Acceleration</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Target Budget (USD)</label>
                          <input
                            type="number"
                            value={estimatedBudget}
                            onChange={(e) => setEstimatedBudget(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                            placeholder="5000"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Timeline (Weeks)</label>
                          <input
                            type="number"
                            value={timelineWeeks}
                            onChange={(e) => setTimelineWeeks(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                            placeholder="4"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleGenerateProposal}
                        disabled={isGenerating}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer pt-3"
                      >
                        {isGenerating ? (
                          <>
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            Formatting custom pitch...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Draft Proposal Copilot
                          </>
                        )}
                      </button>
                    </div>

                    {/* Result canvas container */}
                    {generatedDraft && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2.5 pt-3 border-t border-blue-150 text-xs"
                      >
                        <div className="flex justify-between items-center bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Generated Proposal Document
                          </span>
                          
                          <button
                            onClick={handleCopyDraft}
                            className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 flex-row cursor-pointer"
                          >
                            {copiedSuccess ? (
                              <span className="text-emerald-600 text-[10px] font-black uppercase">Copied!</span>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy Draft
                              </>
                            )}
                          </button>
                        </div>
                        
                        <textarea
                          readOnly
                          value={generatedDraft}
                          className="w-full h-80 px-3.5 py-3 bg-slate-905 bg-slate-900 border-none text-white font-mono text-[10.5px] rounded-xl outline-none shadow-md resize-none select-all leading-relaxed"
                        />
                      </motion.div>
                    )}

                  </motion.div>
                ) : (
                  <div className="p-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20 text-center space-y-4 py-16">
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500 shadow-inner">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">Launch Proposal Wizard</h4>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
                        Generate professional scope proposals, client acquisition templates, and billing contract quotes customized in real-time.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowProposalGen(true)}
                      className="px-4 py-2 bg-[#0A192F] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                    >
                      Open Assistant Workspace
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Modal Info Footline */}
        <div className="bg-slate-105 border-t border-slate-150 bg-slate-50/70 p-4 leading-none flex justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 gap-1.5 items-center">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>Billing Communication Interface: {client.email}</span>
        </div>
      </motion.div>
    </div>
  );
}
