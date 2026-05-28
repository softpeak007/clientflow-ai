import React from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useCollection } from '../../lib/hooks';
import { where } from 'firebase/firestore';
import { 
  Users, 
  Briefcase, 
  Clock, 
  DollarSign, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Client, Project, Invoice, FileMetadata } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { Folder } from 'lucide-react';

export default function DashboardView() {
  const { user } = useAuth();
  
  // Queries with loading states
  const { data: clients, loading: clientsLoading, error: clientsError } = useCollection<Client>('clients', [
    where('adminId', '==', user?.uid || '')
  ]);

  const { data: adminProjects, loading: adminProjLoading, error: adminProjError } = useCollection<Project>('projects', [
    where('adminId', '==', user?.uid || '')
  ]);

  const { data: clientProjects, loading: clientProjLoading, error: clientProjError } = useCollection<Project>('projects', [
    where('clientId', '==', user?.uid || '')
  ]);

  const { data: invoices, loading: invoicesLoading, error: invoicesError } = useCollection<Invoice>('invoices', [], true);
  const { data: files, loading: filesLoading, error: filesError } = useCollection<FileMetadata>('files', [], true);

  const projects = user?.role === 'admin' ? adminProjects : clientProjects;
  const isLoading = clientsLoading || adminProjLoading || clientProjLoading || invoicesLoading || filesLoading;
  const connectionError = clientsError || adminProjError || clientProjError || invoicesError || filesError;

  // Real Stats calculation
  const stats = [
    {
      name: user?.role === 'admin' ? 'Total Active Clients' : 'Assigned Projects',
      value: user?.role === 'admin' ? clients.length : projects.length,
      icon: user?.role === 'admin' ? Users : Briefcase,
      color: 'bg-blue-500',
      description: user?.role === 'admin' ? 'Registered service connections' : 'Assigned workspace projects'
    },
    {
      name: 'Active Agreements',
      value: projects.filter(p => p.status === 'active').length,
      icon: Clock,
      color: 'bg-amber-500',
      description: 'Milestones actively in delivery'
    },
    {
      name: user?.role === 'admin' ? 'Received Revenue' : 'Pending Invoices',
      value: formatCurrency(
        user?.role === 'admin' 
          ? invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
          : invoices.filter(i => i.status !== 'paid' && i.clientId === user?.uid).reduce((sum, i) => sum + i.amount, 0)
      ),
      icon: DollarSign,
      color: 'bg-emerald-500',
      description: user?.role === 'admin' ? 'Cleared client payments' : 'Total balance outstanding'
    },
    {
      name: 'Shared Assets',
      value: `${files.length} Files`,
      icon: Folder,
      color: 'bg-purple-500',
      description: 'Total versioned deliverables'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-200 rounded"></div>
            <div className="h-8 w-48 bg-slate-200 rounded"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="h-3 w-24 bg-slate-200 rounded"></div>
              <div className="flex items-center justify-between">
                <div className="h-8 w-16 bg-slate-200 rounded"></div>
                <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
              </div>
              <div className="h-3 w-32 bg-slate-200 rounded pt-1"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 h-64 bg-slate-100 rounded-2xl border border-slate-200"></div>
          <div className="col-span-12 lg:col-span-4 h-64 bg-slate-100 rounded-2xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-800 space-y-2 max-w-lg mx-auto my-12">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
        <h3 className="font-bold text-base">Dashboard Query Exception</h3>
        <p className="text-xs text-red-650 leading-relaxed">
          Could not sync documents from your backend repository. Please verify your firestore.rules security parameters or internet options!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-1">
            {user?.role === 'admin' ? 'Admin workspace' : 'Client portal'}
          </p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {user?.role === 'admin' ? 'Freelancer OS Dashboard' : 'Client Collaboration Portal'}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Clock className="w-4 h-4" />
          {format(new Date(), 'MMMM dd, yyyy')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">{stat.name}</p>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
              <div className={cn("p-2 rounded-lg text-white", stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] mt-2 font-bold text-slate-400">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Project Progress */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h4 className="font-bold text-sm text-slate-800">Project Progress</h4>
            <button className="text-blue-600 text-xs font-bold hover:underline">View All</button>
          </div>
          <div className="p-6 space-y-6">
            {projects.slice(0, 3).map((project) => (
              <div key={project.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded flex items-center justify-center font-bold text-xs shrink-0",
                    project.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                  )}>
                    {project.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-slate-900 truncate">{project.name}</p>
                    <p className="text-[11px] text-slate-400 capitalize">Status: {project.status}</p>
                  </div>
                </div>
                <div className="w-48 hidden sm:block">
                  <div className="flex justify-between text-[10px] mb-1 font-bold text-slate-600">
                    <span>{project.status === 'completed' ? 'Finalized' : 'Design Phase'}</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000",
                        project.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                      )}
                      style={{ width: `${project.progress}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-10" />
                <p className="text-sm">No project progress to show.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices Tracker */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
            <h4 className="font-bold text-sm text-slate-800">Recent Invoices</h4>
          </div>
          <div className="flex-1 p-4 space-y-3">
            {invoices.slice(0, 4).map((invoice) => (
              <div key={invoice.id} className="flex items-center gap-3 p-3 border border-slate-50 rounded-xl hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                <div className={cn(
                  "w-10 h-10 rounded flex items-center justify-center text-xs font-bold shrink-0",
                  invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                )}>
                  {invoice.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-900 truncate">#{invoice.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs font-bold text-slate-900">{formatCurrency(invoice.amount)}</p>
                  </div>
                  <p className="text-[10px] text-slate-400">Due {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-10" />
                <p className="text-sm">No recent invoices.</p>
              </div>
            )}
          </div>
          <button className="m-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 transition-all">
            + Generate Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
