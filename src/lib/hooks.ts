import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  QueryConstraint,
  DocumentData,
  collectionGroup
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { getSandboxDB } from './sandbox';

// Generate a light, bulletproof primitive key from Firestore QueryConstraints to prevent infinite resubscribes
function getConstraintsKey(constraints: QueryConstraint[]): string {
  try {
    return constraints.map(c => {
      if (!c) return '';
      const raw = c as any;
      const type = raw.type || '';
      const field = raw.fieldPath || (raw._field && String(raw._field)) || '';
      const op = raw.opStr || raw._operator || '';
      const val = raw.value !== undefined ? String(raw.value) : (raw._value !== undefined ? String(raw._value) : '');
      return `${type}:${field}:${op}:${val}`;
    }).join('|');
  } catch (err) {
    return String(constraints.length);
  }
}

// Global caching system (Stale-While-Revalidate memory store)
const collectionCache: Record<string, any[]> = {};
const cacheListeners: Record<string, Set<(data: any[]) => void>> = {};

function subscribeToCache(key: string, listener: (data: any[]) => void) {
  if (!cacheListeners[key]) {
    cacheListeners[key] = new Set();
  }
  cacheListeners[key].add(listener);
  return () => {
    cacheListeners[key].delete(listener);
    if (cacheListeners[key].size === 0) {
      delete cacheListeners[key];
    }
  };
}

function updateCache(key: string, data: any[]) {
  collectionCache[key] = data;
  if (cacheListeners[key]) {
    cacheListeners[key].forEach(listener => listener(data));
  }
}

export function useCollection<T = DocumentData>(
  path: string, 
  constraints: QueryConstraint[] = [],
  isCollectionGroup = false
) {
  const constraintsKey = getConstraintsKey(constraints);
  const cacheKey = `${path}:${constraintsKey}:${isCollectionGroup}`;

  // Initialize from cache if possible, providing instant interactivity (0ms load perception)
  const initialData = (collectionCache[cacheKey] || []) as T[];
  const initialLoading = !collectionCache[cacheKey]; // only show loading on first fetch

  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Sync React state if cache updates in background (from other subscriptions)
    const unsubscribeCache = subscribeToCache(cacheKey, (newData) => {
      setData(newData as T[]);
      setLoading(false);
    });

    // If client is in demo/sandbox mode
    if (localStorage.getItem('demo_user')) {
      const loadDemoData = () => {
        const sdb = getSandboxDB();
        const demoUser = JSON.parse(localStorage.getItem('demo_user') || '{}');
        const uid = demoUser.uid;
        const role = demoUser.role;

        let results: T[] = [];

        if (path === 'clients') {
          results = sdb.clients as unknown as T[];
          results = results.filter((item: any) => item.adminId === uid);
        } else if (path === 'projects') {
          results = sdb.projects as unknown as T[];
          if (role === 'admin') {
            results = results.filter((item: any) => item.adminId === uid);
          } else {
            results = results.filter((item: any) => item.clientId === uid);
          }
        } else if (path === 'invoices' || path.includes('invoices')) {
          results = sdb.invoices as unknown as T[];
          if (role === 'client') {
            results = results.filter((item: any) => item.clientId === uid);
          } else {
            // Freelancer/admin gets invoices belonging to their projects
            const myProjectIds = sdb.projects.filter((p: any) => p.adminId === uid).map((p: any) => p.id);
            results = results.filter((item: any) => myProjectIds.includes(item.projectId));
          }
        } else if (path === 'messages' || path.includes('messages')) {
          results = sdb.messages as unknown as T[];
          const projectIdMatch = path.match(/projects\/([^\/]+)\/messages/);
          if (projectIdMatch) {
            const projId = projectIdMatch[1];
            results = results.filter((item: any) => item.projectId === projId);
          }
        } else if (path === 'files' || path.includes('files')) {
          results = (sdb.files || []) as unknown as T[];
          const projectIdMatch = path.match(/projects\/([^\/]+)\/files/);
          if (projectIdMatch) {
            const projId = projectIdMatch[1];
            results = results.filter((item: any) => item.projectId === projId);
          } else {
            if (role === 'client') {
              results = results.filter((item: any) => item.clientId === uid);
            } else {
              const myProjectIds = sdb.projects.filter((p: any) => p.adminId === uid).map((p: any) => p.id);
              results = results.filter((item: any) => myProjectIds.includes(item.projectId));
            }
          }
        } else if (path === 'notifications' || path.includes('notifications')) {
          results = (sdb.notifications || []) as unknown as T[];
          results = results.filter((item: any) => item.userId === uid);
        }

        // Apply sorting
        if (path.includes('messages')) {
          results.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else if (path.includes('files')) {
          results.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        updateCache(cacheKey, results);
      };

      loadDemoData();
      window.addEventListener('sandbox_update', loadDemoData);
      return () => {
        unsubscribeCache();
        window.removeEventListener('sandbox_update', loadDemoData);
      };
    }

    setLoading(!collectionCache[cacheKey]); // reset loading if we don't have cached data yet
    const ref = isCollectionGroup ? collectionGroup(db, path) : collection(db, path);
    const q = query(ref, ...constraints);

    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      updateCache(cacheKey, results);
    }, (err) => {
      setError(err);
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return () => {
      unsubscribeCache();
      unsubscribeFirestore();
    };
  }, [path, constraintsKey, isCollectionGroup]);

  return { data, loading, error };
}
