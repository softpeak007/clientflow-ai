import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Enable performance-optimized route code splitting via dynamic lazy imports
const LoginView = lazy(() => import('./views/auth/LoginView'));
const DashboardView = lazy(() => import('./views/dashboard/DashboardView'));
const ProjectsView = lazy(() => import('./views/projects/ProjectsView'));
const ClientsView = lazy(() => import('./views/clients/ClientsView'));
const InvoicesView = lazy(() => import('./views/invoices/InvoicesView'));
const ChatView = lazy(() => import('./views/chat/ChatView'));

// High-fidelity Dashboard skeletal loading screen to prevent layout shifts and white frames
function LoadingPageSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse select-none" id="workspace-skel-wrapper">
      {/* Header title skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 text-left">
          <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-72 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Bento grid panel metrics skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(idx => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-150/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0"></div>
            <div className="space-y-1.5 flex-1 text-left">
              <div className="h-3 w-16 bg-slate-100 rounded"></div>
              <div className="h-6 w-12 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main card wrapper */}
      <div className="bg-white rounded-3xl border border-slate-150 p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="h-4 w-12 bg-slate-100 rounded"></div>
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-5 w-full bg-slate-50 rounded-lg"></div>
          <div className="h-5 w-full bg-slate-50 rounded-lg"></div>
          <div className="h-5 w-4/5 bg-slate-50 rounded-lg"></div>
          <div className="h-5 w-2/3 bg-slate-50 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={
          <div className="min-h-screen bg-[#0A192F] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center animate-bounce">
              <div className="w-5 h-5 border-4 border-white rounded"></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-white font-bold text-lg tracking-tight">ClientFlow OS</p>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                <p className="text-blue-300 font-mono text-[10px] uppercase tracking-widest font-black">Decrypting Workspace...</p>
              </div>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/login" element={<LoginView />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Suspense fallback={<LoadingPageSkeleton />}>
                      <Routes>
                        <Route path="/" element={<DashboardView />} />
                        <Route path="/projects" element={<ProjectsView />} />
                        <Route path="/clients" element={<ClientsView />} />
                        <Route path="/invoices" element={<InvoicesView />} />
                        <Route path="/chat" element={<ChatView />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
