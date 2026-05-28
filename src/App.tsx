import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginView from './views/auth/LoginView';
import DashboardView from './views/dashboard/DashboardView';
import ProjectsView from './views/projects/ProjectsView';
import ClientsView from './views/clients/ClientsView';
import InvoicesView from './views/invoices/InvoicesView';
import ChatView from './views/chat/ChatView';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<DashboardView />} />
                    <Route path="/projects" element={<ProjectsView />} />
                    <Route path="/clients" element={<ClientsView />} />
                    <Route path="/invoices" element={<InvoicesView />} />
                    <Route path="/chat" element={<ChatView />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
