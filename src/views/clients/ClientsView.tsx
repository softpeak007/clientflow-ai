import React, { useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useCollection } from '../../lib/hooks';
import { where, addDoc, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { addSandboxDoc } from '../../lib/sandbox';
import { Client } from '../../types';
import { Plus, Search, UserPlus, Mail, Building2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ClientProfileModal from '../../components/clients/ClientProfileModal';

export default function ClientsView() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { data: clients, loading } = useCollection<Client>('clients', [where('adminId', '==', user?.uid || '')]);

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    company: '',
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (localStorage.getItem('demo_user')) {
        addSandboxDoc('clients', {
          ...newClient,
          adminId: user?.uid || 'demo-admin-id',
        });
      } else {
        await addDoc(collection(db, 'clients'), {
          ...newClient,
          adminId: user?.uid,
        });
      }
      setIsModalOpen(false);
      setNewClient({ name: '', email: '', company: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clients');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500">Manage your business relationships and contacts.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
        >
          <UserPlus className="w-5 h-5" />
          Add Client
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white border border-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <motion.div 
              key={client.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shadow-inner">
                  <Building2 className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => setSelectedClient(client)}
                  className="text-slate-200 hover:text-blue-500 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">{client.name}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">{client.company || 'Private Client'}</p>

              <div className="space-y-2 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{client.email}</span>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedClient(client)}
                className="w-full mt-6 py-2.5 px-4 bg-slate-50 text-slate-900 rounded-xl text-xs font-bold hover:bg-[#0A192F] hover:text-white transition-all"
              >
                View Profile
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {selectedClient && (
        <ClientProfileModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#0A192F] text-white">
              <h2 className="text-lg font-bold">Add New Client</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Name</label>
                <input 
                  required
                  type="text" 
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
                <input 
                  type="text" 
                  value={newClient.company}
                  onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Acme Corp"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 mt-4"
              >
                Add Client
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
