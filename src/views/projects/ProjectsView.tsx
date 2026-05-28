import React, { useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useCollection } from '../../lib/hooks';
import { where, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { addSandboxDoc } from '../../lib/sandbox';
import { Project, Client } from '../../types';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import ProjectDetailsModal from '../../components/projects/ProjectDetailsModal';

export default function ProjectsView() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const constraints = user?.role === 'admin' 
    ? [where('adminId', '==', user.uid)] 
    : [where('clientId', '==', user.uid)];

  const { data: projects, loading } = useCollection<Project>('projects', constraints);
  const { data: clients } = useCollection<Client>('clients', [where('adminId', '==', user?.uid || '')]);

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    clientId: '',
    deadline: '',
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (localStorage.getItem('demo_user')) {
        addSandboxDoc('projects', {
          ...newProject,
          adminId: user?.uid || 'demo-admin-id',
          status: 'active',
          progress: 0,
          deadline: new Date(newProject.deadline).toISOString(),
        });
      } else {
        await addDoc(collection(db, 'projects'), {
          ...newProject,
          adminId: user?.uid,
          status: 'active',
          progress: 0,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setNewProject({ name: '', description: '', clientId: '', deadline: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  };


  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500">Manage your active workloads and deadlines.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            Create Project
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent border-none focus:ring-0 text-sm"
          />
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white h-48 rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              onClick={() => setSelectedProject(project)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group border-b-4 border-b-blue-600 cursor-pointer"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-2 rounded-xl",
                    project.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                  )}>
                    {project.status === 'active' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <button className="text-slate-300 hover:text-slate-600 p-1">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-1 tracking-tight">{project.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-medium">{project.description}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-slate-900">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${project.progress}%` }} 
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(project.deadline), 'MMM dd')}
                  </div>
                  <div className="flex -space-x-2">
                     <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                       AD
                     </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredProjects.length === 0 && (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No projects found</h2>
          <p className="text-slate-500 mt-2">Try adjusting your search or create a new project.</p>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#0A192F] text-white">
              <h2 className="text-lg font-bold">New Project</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
               >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Name</label>
                <input 
                  required
                  type="text" 
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. Website Overhaul"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea 
                  required
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24"
                  placeholder="What is this project about?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client</label>
                  <select 
                    required
                    value={newProject.clientId}
                    onChange={(e) => setNewProject({...newProject, clientId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    {!clients.length && <option disabled>No clients yet</option>}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deadline</label>
                  <input 
                    required
                    type="date" 
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 mt-4"
              >
                Launch Project
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          client={clients.find(c => c.id === selectedProject.clientId)}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
