import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  MessageSquare, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { cn } from '../../lib/utils';
import { useCollection } from '../../lib/hooks';
import { Notification } from '../../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: notifications } = useCollection<Notification>('notifications');
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: Briefcase },
    ...(user?.role === 'admin' ? [
      { name: 'Clients', href: '/clients', icon: Users },
      { name: 'Invoices', href: '/invoices', icon: FileText },
    ] : [
      { name: 'My Invoices', href: '/invoices', icon: FileText },
    ]),
    { name: 'Chat', href: '/chat', icon: MessageSquare },
  ];

  const SidebarContent = () => (
    <aside className="w-64 bg-[#0A192F] flex flex-col h-full overflow-hidden">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
        </div>
        <span className="text-white font-bold text-xl tracking-tight">ClientFlow</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
              isActive 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5 transition-opacity", isActive ? "opacity-100" : "opacity-70")} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 mt-auto">
        {user?.role === 'admin' && (
          <div className="bg-blue-600 rounded-xl p-4 text-white text-xs mb-4">
            <p className="font-bold mb-1 underline">Admin Mode</p>
            <p className="opacity-80">Manage all client flows from one dashboard.</p>
          </div>
        )}
        
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm text-white border border-white/10">
            {user?.displayName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.displayName}</p>
            <p className="text-[10px] text-slate-400 truncate capitalize">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0 print:hidden">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10 print:hidden">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-slate-600"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">Workspace</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowNotifications(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-150 shadow-2xl z-20 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-rose-50/50 bg-slate-50/50 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Activity Logs
                        </span>
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full">
                          {notifications.filter(n => !n.read).length} Unread
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                        {notifications.map((n) => (
                          <div 
                            key={n.id}
                            className={cn(
                              "p-3.5 text-left text-xs transition-colors hover:bg-slate-50/50",
                              !n.read ? "bg-blue-50/10 font-medium" : "text-slate-600"
                            )}
                          >
                            <p className="font-bold text-slate-800">{n.title}</p>
                            <p className="text-slate-500 font-medium text-[11px] mt-0.5">{n.message}</p>
                            <span className="text-[9px] text-slate-400 mt-1.5 block font-mono">
                              {n.createdAt ? format(new Date(n.createdAt), 'MMM dd, hh:mm a') : 'Just now'}
                            </span>
                          </div>
                        ))}

                        {notifications.length === 0 && (
                          <div className="py-8 text-center text-slate-400">
                            <Bell className="w-8 h-8 mx-auto opacity-20 mb-2 text-slate-400 animate-bounce" />
                            <p className="text-xs font-bold text-slate-500">Up to date</p>
                            <p className="text-[10px] text-slate-450">Collaborator task updates will show here.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900">{user?.displayName}</p>
                <p className="text-[10px] text-slate-500 capitalize">{user?.role} Freelancer</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-600 font-bold text-sm">
                {user?.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 print:bg-white print:overflow-visible">
          <div className="max-w-7xl mx-auto p-8 print:p-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 z-50 md:hidden shadow-2xl"
            >
              <SidebarContent />
              <button 
                className="absolute top-4 right-4 text-white p-1 hover:bg-slate-800 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
