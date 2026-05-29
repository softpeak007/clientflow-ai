export type UserRole = 'admin' | 'client';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  adminId: string;
  avatarUrl?: string;
  stage?: 'lead' | 'proposal' | 'negotiation' | 'active' | 'lost';
  phone?: string;
  notes?: string;
  nextFollowUp?: string;
}

export interface Project {
  id: string;
  clientId: string;
  adminId: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  deadline: string;
  progress: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  projectId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface FileMetadata {
  id: string;
  projectId: string;
  clientId: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedById: string;
  createdAt: string;
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
