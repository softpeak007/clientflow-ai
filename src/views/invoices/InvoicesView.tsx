import React, { useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useCollection } from '../../lib/hooks';
import { where, addDoc, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { addSandboxDoc } from '../../lib/sandbox';
import { Invoice, Client, Project } from '../../types';
import { FileText, Plus, Search, Filter, Download, MoreHorizontal, Printer } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';
import InvoicePrintPreview from '../../components/invoices/InvoicePrintPreview';

export default function InvoicesView() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrintInvoice, setSelectedPrintInvoice] = useState<Invoice | null>(null);
  const [autoDownload, setAutoDownload] = useState(false);
  
  const { data: invoices, loading } = useCollection<Invoice>('invoices', [], true);
  const { data: clients } = useCollection<Client>('clients', [where('adminId', '==', user?.uid || '')]);
  const { data: projects } = useCollection<Project>('projects', [where('adminId', '==', user?.uid || '')]);

  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    projectId: '',
    amount: '',
    dueDate: '',
  });

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newInvoice.projectId) return;
      
      if (localStorage.getItem('demo_user')) {
        addSandboxDoc('invoices', {
          clientId: newInvoice.clientId,
          projectId: newInvoice.projectId,
          amount: parseFloat(newInvoice.amount),
          currency: 'USD',
          status: 'draft',
          dueDate: new Date(newInvoice.dueDate).toISOString(),
          createdAt: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, `projects/${newInvoice.projectId}/invoices`), {
          clientId: newInvoice.clientId,
          projectId: newInvoice.projectId,
          amount: parseFloat(newInvoice.amount),
          currency: 'USD',
          status: 'draft',
          dueDate: new Date(newInvoice.dueDate).toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      setNewInvoice({ clientId: '', projectId: '', amount: '', dueDate: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'invoices');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-500">Track your billing and payments.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            Create Invoice
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search invoices..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <button className="px-4 py-2 flex items-center gap-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            Status
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-slate-900">#{invoice.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {projects.find(p => p.id === invoice.projectId)?.name || 'Project'}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold uppercase",
                      invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                      invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    )}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setAutoDownload(false);
                          setSelectedPrintInvoice(invoice);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Print / Share PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setAutoDownload(true);
                          setSelectedPrintInvoice(invoice);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">New Invoice</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project</label>
                <select 
                  required
                  value={newInvoice.projectId}
                  onChange={(e) => {
                    const project = projects.find(p => p.id === e.target.value);
                    setNewInvoice({...newInvoice, projectId: e.target.value, clientId: project?.clientId || ''})
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (USD)</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
                <input 
                  required
                  type="date" 
                  value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 mt-4"
              >
                Create Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedPrintInvoice && (
        <InvoicePrintPreview
          invoice={selectedPrintInvoice}
          project={projects.find(p => p.id === selectedPrintInvoice.projectId)}
          client={clients.find(c => c.id === selectedPrintInvoice.clientId)}
          user={user}
          onClose={() => {
            setSelectedPrintInvoice(null);
            setAutoDownload(false);
          }}
          autoDownload={autoDownload}
        />
      )}
    </div>
  );
}
