import React, { useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useCollection } from '../../lib/hooks';
import { where, addDoc, collection, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { addSandboxDoc, updateSandboxDoc, deleteSandboxDoc } from '../../lib/sandbox';
import { Client, Project, Invoice } from '../../types';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Mail, 
  Building2, 
  ExternalLink,
  Kanban,
  List,
  ChevronLeft,
  ChevronRight,
  Phone,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  TrendingUp,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ClientProfileModal from '../../components/clients/ClientProfileModal';
import { cn } from '../../lib/utils';

export default function ClientsView() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: clients, loading } = useCollection<Client>('clients', [where('adminId', '==', user?.uid || '')]);
  const { data: projects } = useCollection<Project>('projects', [where('adminId', '==', user?.uid || '')]);
  const { data: invoices } = useCollection<Invoice>('invoices', [], true);

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    notes: '',
    stage: 'lead' as Client['stage']
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const clientData = {
        name: newClient.name,
        email: newClient.email,
        company: newClient.company,
        phone: newClient.phone || '',
        notes: newClient.notes || '',
        stage: newClient.stage || 'lead',
        adminId: user?.uid || 'demo-admin-id'
      };

      if (localStorage.getItem('demo_user')) {
        addSandboxDoc('clients', clientData);
      } else {
        await addDoc(collection(db, 'clients'), {
          ...clientData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setNewClient({ name: '', email: '', company: '', phone: '', notes: '', stage: 'lead' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clients');
    }
  };

  const handleUpdateStage = async (clientId: string, newStage: Client['stage']) => {
    try {
      if (localStorage.getItem('demo_user')) {
        updateSandboxDoc('clients', clientId, { stage: newStage });
      } else {
        await updateDoc(doc(db, 'clients', clientId), { stage: newStage });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'clients');
    }
  };

  const handleDeleteClient = async (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this client relation? All historic stats will remain intact.')) return;
    try {
      if (localStorage.getItem('demo_user')) {
        deleteSandboxDoc('clients', clientId);
      } else {
        await deleteDoc(doc(db, 'clients', clientId));
      }
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'clients');
    }
  };

  // Safe stage resolver
  const getClientStage = (client: Client): Required<Client>['stage'] => {
    return client.stage || 'active';
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculation
  const totalLeads = clients.length;
  const activeDeals = clients.filter(c => getClientStage(c) !== 'lost' && getClientStage(c) !== 'active').length;
  const convertedDeals = clients.filter(c => getClientStage(c) === 'active').length;
  
  // Pipeline estimation value (outstanding invoice balance + estimated values)
  const pipelineValue = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const stages: { key: Required<Client>['stage']; label: string; color: string; bg: string; border: string; text: string }[] = [
    { key: 'lead', label: 'Prospect / Lead', color: 'bg-purple-500', bg: 'bg-purple-50/40', border: 'border-purple-200', text: 'text-purple-700' },
    { key: 'proposal', label: 'Proposal Sent', color: 'bg-blue-500', bg: 'bg-blue-50/40', border: 'border-blue-200', text: 'text-blue-700' },
    { key: 'negotiation', label: 'In Negotiation', color: 'bg-amber-500', bg: 'bg-amber-50/40', border: 'border-amber-250', text: 'text-amber-800' },
    { key: 'active', label: 'Active Client', color: 'bg-emerald-500', bg: 'bg-emerald-50/40', border: 'border-emerald-250', text: 'text-emerald-700' },
    { key: 'lost', label: 'Cold / Lost', color: 'bg-slate-500', bg: 'bg-slate-50/50', border: 'border-slate-300', text: 'text-slate-600' }
  ];

  return (
    <div className="space-y-8">
      {/* Upper Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Client CRM & Deals Pipeline
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Manage your full sales funnel, prospects pitches, follow-up dates, and active contract relationships.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="p-1 bg-slate-100 rounded-xl border border-slate-200/60 flex items-center">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
                viewMode === 'kanban' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban Pipeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Roster List
            </button>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl shadow-blue-500/10 hover:-translate-y-0.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Prospect / Client
          </button>
        </div>
      </div>

      {/* Dynamic Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 border border-blue-100 shadow-inner">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Deals/Roster</p>
            <h3 className="text-xl font-black text-slate-800 mt-1">{totalLeads}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0 border border-amber-100 shadow-inner">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Deals In Progress</p>
            <h3 className="text-xl font-black text-slate-800 mt-1">{activeDeals}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 border border-emerald-100 shadow-inner">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Converted Clients</p>
            <h3 className="text-xl font-black text-slate-800 mt-1">{convertedDeals}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0 border border-purple-100 shadow-inner">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contract Pipeline Value</p>
            <h3 className="text-xl font-black text-slate-800 mt-1">
              ${pipelineValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </h3>
          </div>
        </div>
      </div>

      {/* CRM Action Filter bar */}
      <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-150 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search leads, names, emails, companies or requirements..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/70 focus:border-blue-500 rounded-xl outline-none focus:bg-white text-xs font-semibold transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-56 bg-white border border-slate-150 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* LIST VIEW MODE */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => {
                const stageDetails = stages.find(s => s.key === getClientStage(client)) || stages[3];
                return (
                  <motion.div 
                    key={client.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-2xl border border-slate-150 hover:border-blue-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all group relative overflow-hidden"
                  >
                    <div className={cn("absolute top-0 left-0 w-full h-1", stageDetails.color)}></div>
                    <div className="flex items-start justify-between mb-4 mt-1">
                      <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shadow-inner">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border", stageDetails.border, stageDetails.bg, stageDetails.text)}>
                          {stageDetails.label}
                        </span>
                        <button 
                          onClick={(e) => handleDeleteClient(client.id, e)}
                          title="Delete contact"
                          className="p-1.5 text-slate-350 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-base font-black text-slate-900 tracking-tight">{client.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4 leading-none">{client.company || 'Private Client'}</p>

                    {client.notes && (
                      <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium mb-4 leading-relaxed">
                        {client.notes}
                      </p>
                    )}

                    <div className="space-y-1.5 pt-4 border-t border-slate-50 text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-2 flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedClient(client)}
                        className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-[#0A192F] text-slate-800 hover:text-white rounded-xl text-xs font-bold border border-slate-250/50 transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Open Profile CRM
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {filteredClients.length === 0 && (
                <div className="col-span-12 py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-7 h-7 text-slate-350" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">No matching roster accounts</h3>
                  <p className="text-slate-400 text-xs mt-1">Try updating your filters or search keywords.</p>
                </div>
              )}
            </div>
          )}

          {/* KANBAN PIPE MODE */}
          {viewMode === 'kanban' && (
            <div className="flex gap-4 overflow-x-auto pb-4 overflow-y-hidden select-none -mx-4 px-4 sm:mx-0 sm:px-0">
              {stages.map((stage) => {
                const stageClients = filteredClients.filter(c => getClientStage(c) === stage.key);
                return (
                  <div 
                    key={stage.key} 
                    className="w-72 shrink-0 bg-slate-100/60 rounded-2xl border border-slate-200/80 p-3.5 flex flex-col max-h-[70vh] shadow-inner"
                  >
                    {/* Header column title */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-3 text-left">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", stage.color)}></span>
                        <h4 className="text-xs font-black text-slate-800 truncate">{stage.label}</h4>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-200 px-2 py-0.5 rounded-md">
                        {stageClients.length}
                      </span>
                    </div>

                    {/* Stage scroll list */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[150px]">
                      {stageClients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => setSelectedClient(client)}
                          className="bg-white p-4 rounded-xl border border-slate-150 hover:border-blue-300 shadow-sm hover:shadow-md transition-all cursor-pointer text-left group space-y-3"
                        >
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-1">
                              {client.company || 'Independent Lead'}
                            </span>
                            <h5 className="text-sm font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                              {client.name}
                            </h5>
                          </div>

                          {client.notes && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-normal font-medium">
                              {client.notes}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] pt-2.5 border-t border-slate-100 text-slate-400">
                            <span className="truncate max-w-[120px] font-mono">{client.email}</span>
                            
                            {/* Pipeline Navigation Arrows */}
                            <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                              <button
                                disabled={stage.key === 'lead'}
                                onClick={() => {
                                  const idx = stages.findIndex(s => s.key === stage.key);
                                  handleUpdateStage(client.id, stages[idx - 1].key);
                                }}
                                className="p-1 hover:bg-slate-100 disabled:opacity-20 rounded border border-slate-200 disabled:hover:bg-transparent"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                              <button
                                disabled={stage.key === 'lost'}
                                onClick={() => {
                                  const idx = stages.findIndex(s => s.key === stage.key);
                                  handleUpdateStage(client.id, stages[idx + 1].key);
                                }}
                                className="p-1 hover:bg-slate-100 disabled:opacity-20 rounded border border-slate-200 disabled:hover:bg-transparent"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {stageClients.length === 0 && (
                        <div className="py-8 text-center text-slate-400/80 border border-dashed border-slate-200 rounded-xl bg-white/20 select-none">
                          <Bookmark className="w-5 h-5 mx-auto mb-1 opacity-20" />
                          <span className="text-[10px] font-bold">No deals here</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* CRM Client Contact details modal */}
      {selectedClient && (
        <ClientProfileModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}

      {/* Add Lead/Prospect modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#0A192F] text-white">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold">New Deal Account</h2>
                <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Add to clients or pipeline</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prospect / Client Name</label>
                <input 
                  required
                  type="text" 
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs transition-all font-semibold"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input 
                    required
                    type="email" 
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs transition-all font-semibold"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone (Optional)</label>
                  <input 
                    type="text" 
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs transition-all font-semibold"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
                  <input 
                    type="text" 
                    value={newClient.company}
                    onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs transition-all font-semibold"
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Initial Pipeline Stage</label>
                  <select 
                    required
                    value={newClient.stage}
                    onChange={(e) => setNewClient({...newClient, stage: e.target.value as Client['stage']})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs transition-all font-semibold"
                  >
                    <option value="lead">Prospect / Lead</option>
                    <option value="proposal">Proposal Drafted</option>
                    <option value="negotiation">In Negotiation</option>
                    <option value="active">Active Client (Roster)</option>
                    <option value="lost">Lost / Cold</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client Requirements / Notes (Optional)</label>
                <textarea 
                  value={newClient.notes}
                  onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs transition-all h-20 font-medium"
                  placeholder="e.g. Needs frontend rework and brand refresh in June. Estimated budget $5,000."
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl shadow-blue-500/20 mt-4 text-xs uppercase tracking-wider cursor-pointer"
              >
                Insert CRM Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
