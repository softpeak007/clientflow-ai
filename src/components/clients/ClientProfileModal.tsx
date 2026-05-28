import React from 'react';
import { Client, Project, Invoice } from '../../types';
import { useCollection } from '../../lib/hooks';
import { where } from 'firebase/firestore';
import { X, Building, Mail, DollarSign, Briefcase, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface ClientProfileModalProps {
  client: Client;
  onClose: () => void;
}

export default function ClientProfileModal({ client, onClose }: ClientProfileModalProps) {
  // Query all projects for this client
  const { data: projects } = useCollection<Project>('projects', [
    where('clientId', '==', client.id)
  ]);

  // Query all invoices for this client
  const { data: invoices } = useCollection<Invoice>('invoices', [
    where('clientId', '==', client.id)
  ]);

  // Aggregate stats
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidBilled = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const unpaidBilled = invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-slate-100 max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="bg-[#0A192F] text-white p-6 md:p-8 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">{client.name}</h2>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <Building className="w-3.5 h-3.5" />
              {client.company || 'Independent Private Client'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
          {/* CRM Financial Ledger Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-emerald-50/55 rounded-2xl border border-emerald-100 flex flex-col justify-between">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-widest block mb-2">Total Paid</span>
              <p className="text-2xl font-extrabold text-emerald-900 font-mono">
                ${paidBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="p-5 bg-amber-50/55 rounded-2xl border border-amber-100 flex flex-col justify-between">
              <span className="text-[10px] text-amber-800 font-bold uppercase tracking-widest block mb-2">Outstanding Invoices</span>
              <p className="text-2xl font-extrabold text-amber-900 font-mono">
                ${unpaidBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] text-slate-550 font-bold uppercase tracking-widest block mb-2">Contracts Value</span>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                ${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* CRM Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Associated Projects Panel */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-400" />
                Linked Projects ({projects.length})
              </h3>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {projects.map(p => (
                  <div key={p.id} className="p-4 bg-slate-50/40 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        Target: {format(new Date(p.deadline), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-blue-600 block bg-blue-50/50 px-2.5 py-0.5 rounded-lg border border-blue-50">
                        {p.progress}%
                      </span>
                    </div>
                  </div>
                ))}

                {projects.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No projects launched for this client yet.</p>
                )}
              </div>
            </div>

            {/* Invoices History */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Invoices Ledger ({invoices.length})
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {invoices.map(inv => (
                  <div key={inv.id} className="p-4 bg-slate-50/40 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        ${inv.amount.toLocaleString()}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Due {format(new Date(inv.dueDate), 'MMM d')}
                      </p>
                    </div>
                    <div>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      )}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}

                {invoices.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No invoices created for this client yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Info Footline */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center gap-2 justify-center text-[10px] font-bold text-slate-400">
          <Mail className="w-3.5 h-3.5" />
          <span>Billing Communication Interface: {client.email}</span>
        </div>
      </motion.div>
    </div>
  );
}
