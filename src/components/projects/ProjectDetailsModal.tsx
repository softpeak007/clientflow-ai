import React, { useState, useEffect } from 'react';
import { Project, Client, FileMetadata, Invoice, Message } from '../../types';
import { useCollection } from '../../lib/hooks';
import { useAuth } from '../AuthProvider';
import { where, addDoc, updateDoc, doc, collection, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { addSandboxDoc, updateSandboxDoc } from '../../lib/sandbox';
import { 
  X, 
  Upload, 
  File, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FolderOpen, 
  DollarSign, 
  MessageSquare,
  Send,
  Sliders,
  History,
  FileCheck,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectDetailsModalProps {
  project: Project;
  client?: Client;
  onClose: () => void;
}

export default function ProjectDetailsModal({ project, client, onClose }: ProjectDetailsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'files' | 'chat' | 'admin'>('files');
  const [dragOver, setDragOver] = useState(false);
  
  // States for Admin Controls
  const [progress, setProgress] = useState(project.progress);
  const [status, setStatus] = useState(project.status);
  
  // Chat state
  const [messageText, setMessageText] = useState('');

  // Collections
  // Invoices for project
  const { data: invoices } = useCollection<Invoice>('invoices', [
    where('projectId', '==', project.id)
  ]);

  // Files for project
  const { data: projectFiles } = useCollection<FileMetadata>(
    `projects/${project.id}/files`,
    [where('projectId', '==', project.id)]
  );

  // Messages for project
  const { data: messages } = useCollection<Message>(
    `projects/${project.id}/messages`,
    [orderBy('createdAt', 'asc')]
  );

  // Sync state if project changes
  useEffect(() => {
    setProgress(project.progress);
    setStatus(project.status);
  }, [project]);

  // Handle Updates (Admin Only)
  const handleUpdateProjectSettings = async () => {
    try {
      if (localStorage.getItem('demo_user')) {
        updateSandboxDoc('projects', project.id, {
          progress,
          status
        });
      } else {
        const projectRef = doc(db, 'projects', project.id);
        await updateDoc(projectRef, {
          progress,
          status
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'projects');
    }
  };

  // Chat message send logic
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      if (localStorage.getItem('demo_user')) {
        addSandboxDoc('messages', {
          projectId: project.id,
          senderId: user?.uid || 'demo-admin-id',
          senderName: user?.displayName || 'User',
          content: messageText,
          createdAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, `projects/${project.id}/messages`), {
          projectId: project.id,
          senderId: user?.uid,
          senderName: user?.displayName,
          content: messageText,
          createdAt: new Date().toISOString()
        });
      }
      setMessageText('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
  };

  // Mock File Upload + Simulated Version History
  const handleFileUpload = async (fileName: string, fileSize: number, fileType: string) => {
    try {
      if (localStorage.getItem('demo_user')) {
        addSandboxDoc('files', {
          projectId: project.id,
          clientId: project.clientId,
          name: fileName,
          url: '#',
          size: fileSize,
          type: fileType,
          uploadedById: user?.uid || 'demo-admin-id',
          createdAt: new Date().toISOString()
        });
        
        // Add a system notification about file upload activity
        addSandboxDoc('notifications', {
          userId: user?.role === 'admin' ? project.clientId : project.adminId,
          title: 'New Project File Uploaded',
          message: `${user?.displayName} uploaded "${fileName}" to project ${project.name}`,
          read: false,
          createdAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, `projects/${project.id}/files`), {
          projectId: project.id,
          clientId: project.clientId,
          name: fileName,
          url: 'https://firebasestorage.googleapis.com/...',
          size: fileSize,
          type: fileType,
          uploadedById: user?.uid,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'files');
    }
  };

  // Drag 'n' Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file.name, file.size, file.type);
    }
  };

  const triggerUploadInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileUpload(file.name, file.size, file.type);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col md:flex-row border border-slate-100"
      >
        {/* Left Side: Overview Panel */}
        <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 p-6 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                status === 'active' ? 'bg-blue-100 text-blue-700' :
                status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
              )}>
                {status}
              </span>
              <button 
                onClick={onClose}
                className="md:hidden p-1.5 bg-slate-200 hover:bg-slate-300 rounded-full transition"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">{project.name}</h2>
              <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">{project.description}</p>
            </div>

            <hr className="border-slate-200" />

            {/* Progress Display */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span>Phase Progress</span>
                <span className="text-slate-900 font-mono">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={cn(
                    "h-full transition-all duration-300",
                    status === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'
                  )}
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>

            {/* Client Info Card */}
            {client && (
              <div className="bg-white p-3.5 rounded-2xl border border-slate-250/60 shadow-sm space-y-2.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Co-Collaborators</span>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-xs text-blue-600 border border-blue-100">
                    {client.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 leading-none">{client.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{client.company}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Project Deadlines */}
            <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-slate-250/60 shadow-sm">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Milestone Target</span>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{format(new Date(project.deadline), 'MMMM dd, yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Tab Button Toggles */}
          <div className="space-y-2 pt-6 border-t border-slate-200">
            <button
              onClick={() => setActiveTab('files')}
              className={cn(
                "w-full px-4 py-2.5 rounded-xl text-left font-bold text-xs flex items-center gap-2.5 transition-all",
                activeTab === 'files' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15" : "text-slate-600 hover:bg-slate-200/50"
              )}
            >
              <FolderOpen className="w-4 h-4" />
              Files & Version History
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={cn(
                "w-full px-4 py-2.5 rounded-xl text-left font-bold text-xs flex items-center gap-2.5 transition-all",
                activeTab === 'chat' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15" : "text-slate-600 hover:bg-slate-200/50"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              Project Portal Chat
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={cn(
                  "w-full px-4 py-2.5 rounded-xl text-left font-bold text-xs flex items-center gap-2.5 transition-all",
                  activeTab === 'admin' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15" : "text-slate-600 hover:bg-slate-200/50"
                )}
              >
                <Sliders className="w-4 h-4" />
                Workflow Manager
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Tab Contents */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Header */}
          <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/10 shrink-0">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {activeTab === 'files' ? 'Files & Assets Store' :
                 activeTab === 'chat' ? 'Portal Chat Interface' : 'Admin Control Management'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Project Sync Engine v1.1
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 min-h-0">
            {/* TAB 1: FILES & VERSIONING */}
            {activeTab === 'files' && (
              <div className="h-full flex flex-col justify-between space-y-6">
                {/* Upload drag drop zone */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative",
                    dragOver ? "border-blue-500 bg-blue-50/30" : "border-slate-200 hover:border-slate-350 bg-slate-50/20"
                  )}
                >
                  <input
                    type="file"
                    id="project-file-uploader"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={triggerUploadInput}
                  />
                  <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-md mb-3 border border-slate-100 text-blue-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Drag and drop file here, or click to select</h4>
                  <p className="text-slate-400 text-xs mt-1">Accepts PDFs, Brand Assets, Style Guides up to 50MB</p>
                </div>

                {/* File versions lists */}
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-400" />
                      Version History & Deliverables
                    </h4>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-md">
                      {projectFiles.length} files saved
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-[200px]">
                    {projectFiles.map((f, idx) => (
                      <div 
                        key={f.id}
                        className="p-4 border border-slate-100 hover:border-blue-100 hover:bg-blue-50/20 rounded-2xl flex items-center justify-between transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-rose-500">
                            <File className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              {f.name}
                              {idx === 0 && (
                                <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                                  Current Version
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                              Uploaded on {format(new Date(f.createdAt), 'MMM dd, yyyy • hh:mm a')} • {(f.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">
                            v{projectFiles.length - idx}
                          </span>
                          <a 
                            href={f.url}
                            download
                            className="p-1 px-3 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-extrabold text-slate-700 transition"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}

                    {projectFiles.length === 0 && (
                      <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
                        <FileCheck className="w-10 h-10 mb-2 opacity-20 text-slate-400" />
                        <p className="text-xs font-bold">No assets uploaded to this workspace yet.</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Upload a design brief, copy document or layout guidelines above.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PROJECT-BASED CHAT */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col justify-between max-h-[50vh]">
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[300px] flex flex-col justify-end">
                  {messages.map((m) => {
                    const isSelf = m.senderId === user?.uid;
                    return (
                      <div key={m.id} className={cn("flex flex-col max-w-[75%]", isSelf ? "self-end items-end" : "self-start items-start")}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-slate-500">{m.senderName}</span>
                          <span className="text-[9px] text-slate-400">{format(new Date(m.createdAt), 'hh:mm a')}</span>
                        </div>
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-xs leading-relaxed",
                          isSelf ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/10" : "bg-slate-150 text-slate-800 rounded-tl-none border border-slate-100"
                        )}>
                          {m.content}
                        </div>
                      </div>
                    );
                  })}

                  {messages.length === 0 && (
                    <div className="my-auto text-center py-12">
                      <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-400">Collaboration Space</p>
                      <p className="text-[10px] text-slate-400 mt-1">Start a direct project conversation with your partner.</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a project update or query..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-xs"
                  />
                  <button 
                    type="submit"
                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-lg shadow-blue-500/10 flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: WORKFLOW MANAGER (ADMIN ONLY) */}
            {activeTab === 'admin' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Project Status Controls</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {(['active', 'completed', 'on-hold'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setStatus(st);
                        }}
                        className={cn(
                          "py-3 rounded-2xl border text-center font-bold text-xs uppercase transition",
                          status === st 
                            ? "border-blue-600 bg-blue-50/20 text-blue-700 shadow-sm" 
                            : "border-slate-100 hover:border-slate-200 text-slate-500"
                        )}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Adjust Milestone Progress</h4>
                    <span className="text-xs font-black font-mono text-blue-600">{progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Drag the slider above to set the active development percentage shown on both the Freelancer and Client portals.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={handleUpdateProjectSettings}
                    className="px-6 py-3 bg-[#0A192F] hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition"
                  >
                    <Sliders className="w-4 h-4" />
                    Save Adjustments
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
