import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useCollection } from '../../lib/hooks';
import { where, addDoc, collection, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { addSandboxDoc } from '../../lib/sandbox';
import { Message, Project } from '../../types';
import { Send, Hash, MessageSquare, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export default function ChatView() {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const constraints = user?.role === 'admin' 
    ? [where('adminId', '==', user.uid)] 
    : [where('clientId', '==', user.uid)];

  const { data: projects } = useCollection<Project>('projects', constraints);
  
  const { data: messages } = useCollection<Message>(
    selectedProjectId ? `projects/${selectedProjectId}/messages` : 'messages', 
    [orderBy('createdAt', 'asc')],
    !selectedProjectId
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedProjectId) return;

    try {
      if (localStorage.getItem('demo_user')) {
        addSandboxDoc('messages', {
          projectId: selectedProjectId,
          senderId: user?.uid || 'demo-admin-id',
          senderName: user?.displayName || 'Demo User',
          content: newMessage,
          createdAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, `projects/${selectedProjectId}/messages`), {
          projectId: selectedProjectId,
          senderId: user?.uid,
          senderName: user?.displayName,
          content: newMessage,
          createdAt: new Date().toISOString()
        });
      }
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };


  return (
    <div className="h-[calc(100vh-12rem)] flex bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Channels Sidebar */}
      <div className="w-64 border-r border-slate-100 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Messages
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all",
                selectedProjectId === project.id 
                  ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-500/20" 
                  : "text-slate-600 hover:bg-slate-200"
              )}
            >
              <Hash className={cn("w-4 h-4", selectedProjectId === project.id ? "text-blue-200" : "text-slate-400")} />
              <span className="truncate">{project.name}</span>
            </button>
          ))}
          {projects.length === 0 && <p className="p-4 text-center text-xs text-slate-400">No active projects</p>}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedProjectId ? (
          <>
            {/* Header */}
            <div className="h-14 border-b border-slate-100 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-slate-400" />
                <span className="font-bold text-slate-900">
                  {projects.find(p => p.id === selectedProjectId)?.name}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-600">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-400">{format(new Date(msg.createdAt), 'HH:mm')}</span>
                    </div>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                      isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-sm">Start the conversation</p>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100">
              <div className="relative">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..." 
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Project</h3>
            <p className="max-w-xs text-sm">Pick a project from the sidebar to start collaborating with your team.</p>
          </div>
        )}
      </div>
    </div>
  );
}
