import { Client, Project, Invoice, Message, User, FileMetadata, Notification } from '../types';

export interface SandboxDB {
  users: User[];
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  messages: Message[];
  files: FileMetadata[];
  notifications: Notification[];
}

const DEFAULT_SANDBOX_DB: SandboxDB = {
  users: [
    {
      uid: 'demo-admin-id',
      email: 'sarah.freelancer@example.com',
      displayName: 'Sarah Connor (Freelancer)',
      role: 'admin',
      createdAt: '2026-05-01T00:00:00.000Z'
    },
    {
      uid: 'demo-client-id',
      email: 'john.client@example.com',
      displayName: 'John Doe (Acme Corp)',
      role: 'client',
      createdAt: '2026-05-01T00:00:00.000Z'
    }
  ],
  clients: [
    {
      id: 'demo-client-id',
      name: 'John Doe',
      email: 'john.client@example.com',
      company: 'Acme Corp',
      adminId: 'demo-admin-id'
    },
    {
      id: 'demo-client-id-2',
      name: 'Jane Miller',
      email: 'jane@vertex.design',
      company: 'Vertex Design',
      adminId: 'demo-admin-id'
    }
  ],
  projects: [
    {
      id: 'demo-project-id-1',
      clientId: 'demo-client-id',
      adminId: 'demo-admin-id',
      name: 'Acme Branding Campaign',
      description: 'Comprehensive brand identity update, style guide, and digital marketing materials.',
      status: 'active',
      deadline: '2026-06-30T00:00:00.000Z',
      progress: 65
    },
    {
      id: 'demo-project-id-2',
      clientId: 'demo-client-id-2',
      adminId: 'demo-admin-id',
      name: 'Vertex Web Platform',
      description: 'Frontend development for interactive 3D product customizer using WebGL and shaders.',
      status: 'active',
      deadline: '2026-07-15T00:00:00.000Z',
      progress: 40
    }
  ],
  invoices: [
    {
      id: 'demo-invoice-id-1',
      clientId: 'demo-client-id',
      projectId: 'demo-project-id-1',
      amount: 4200.00,
      currency: 'USD',
      status: 'paid',
      dueDate: '2026-05-15T00:00:00.000Z',
      createdAt: '2026-05-01T00:00:00.000Z'
    },
    {
      id: 'demo-invoice-id-2',
      clientId: 'demo-client-id',
      projectId: 'demo-project-id-1',
      amount: 3000.00,
      currency: 'USD',
      status: 'sent',
      dueDate: '2026-06-10T00:00:00.000Z',
      createdAt: '2026-05-20T00:00:00.000Z'
    }
  ],
  messages: [
    {
      id: 'demo-message-1',
      projectId: 'demo-project-id-1',
      senderId: 'demo-client-id',
      senderName: 'John Doe',
      content: 'Hey Sarah! Did you get a chance to review the feedback on wireframes?',
      createdAt: '2026-05-27T10:00:00.000Z'
    },
    {
      id: 'demo-message-2',
      projectId: 'demo-project-id-1',
      senderId: 'demo-admin-id',
      senderName: 'Sarah Connor (Freelancer)',
      content: 'Yes John! I implemented the typography and spacing updates. They look extremely clean now.',
      createdAt: '2026-05-27T11:30:00.000Z'
    }
  ],
  files: [
    {
      id: 'demo-file-1',
      projectId: 'demo-project-id-1',
      clientId: 'demo-client-id',
      name: 'Brand_Identity_Guidelines_v1.pdf',
      url: '#',
      size: 4200100, // 4MB
      type: 'application/pdf',
      uploadedById: 'demo-admin-id',
      createdAt: '2026-05-24T14:20:00.000Z'
    },
    {
      id: 'demo-file-2',
      projectId: 'demo-project-id-1',
      clientId: 'demo-client-id',
      name: 'Brand_Identity_Guidelines_v2_final.pdf',
      url: '#',
      size: 4420300, // 4.2MB
      type: 'application/pdf',
      uploadedById: 'demo-admin-id',
      createdAt: '2026-05-26T09:15:00.000Z'
    }
  ],
  notifications: [
    {
      id: 'demo-notif-1',
      userId: 'demo-admin-id',
      title: 'Invoice paid successfully',
      message: 'John Doe paid USD 4,200.00 for Acme Branding Campaign.',
      read: false,
      createdAt: '25th May 2026'
    }
  ]
};

export function getSandboxDB(): SandboxDB {
  const data = localStorage.getItem('clientflow_sandbox_db');
  if (!data) {
    localStorage.setItem('clientflow_sandbox_db', JSON.stringify(DEFAULT_SANDBOX_DB));
    return DEFAULT_SANDBOX_DB;
  }
  try {
    return JSON.parse(data) as SandboxDB;
  } catch (e) {
    console.error('Error parsing sandbox DB, resetting to default', e);
    localStorage.setItem('clientflow_sandbox_db', JSON.stringify(DEFAULT_SANDBOX_DB));
    return DEFAULT_SANDBOX_DB;
  }
}

export function saveSandboxDB(db: SandboxDB) {
  localStorage.setItem('clientflow_sandbox_db', JSON.stringify(db));
  window.dispatchEvent(new Event('sandbox_update'));
}

export function addSandboxDoc<K extends keyof SandboxDB>(
  collectionName: K, 
  docData: Omit<SandboxDB[K][number], 'id'>
): SandboxDB[K][number] {
  const db = getSandboxDB();
  const id = 'sandbox-id-' + Math.random().toString(36).substr(2, 9);
  const newDoc = { id, ...docData } as any;
  
  if (Array.isArray(db[collectionName])) {
    (db[collectionName] as any[]).push(newDoc);
  }
  
  saveSandboxDB(db);
  return newDoc;
}

export function updateSandboxDoc<K extends keyof SandboxDB>(
  collectionName: K,
  id: string,
  updatedFields: Partial<SandboxDB[K][number]>
) {
  const db = getSandboxDB();
  const list = db[collectionName] as any[];
  const idx = list.findIndex((item) => item.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedFields };
    saveSandboxDB(db);
  }
}

export function deleteSandboxDoc<K extends keyof SandboxDB>(
  collectionName: K,
  id: string
) {
  const db = getSandboxDB();
  const list = db[collectionName] as any[];
  const idx = list.findIndex((item) => item.id === id);
  if (idx !== -1) {
    list.splice(idx, 1);
    saveSandboxDB(db);
  }
}
