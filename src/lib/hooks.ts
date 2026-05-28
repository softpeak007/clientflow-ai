import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  QueryConstraint,
  DocumentData,
  collectionGroup
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { getSandboxDB } from './sandbox';

export function useCollection<T = DocumentData>(
  path: string, 
  constraints: QueryConstraint[] = [],
  isCollectionGroup = false
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If in Demo Mode (sandbox is active)
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
        } else if (path === 'invoices') {
          results = sdb.invoices as unknown as T[];
          if (role === 'client') {
            results = results.filter((item: any) => item.clientId === uid);
          } else {
            // Freelancer/admin gets invoices belonging to their projects
            const myProjectIds = sdb.projects.filter((p: any) => p.adminId === uid).map((p: any) => p.id);
            results = results.filter((item: any) => myProjectIds.includes(item.projectId));
          }
        } else if (path.includes('messages')) {
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
        } else if (path === 'notifications') {
          results = (sdb.notifications || []) as unknown as T[];
          results = results.filter((item: any) => item.userId === uid);
        }

        // Apply sorting
        if (path.includes('messages')) {
          results.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else if (path.includes('files')) {
          results.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        setData(results);
        setLoading(false);
      };

      loadDemoData();
      window.addEventListener('sandbox_update', loadDemoData);
      return () => {
        window.removeEventListener('sandbox_update', loadDemoData);
      };
    }

    setLoading(true);
    const ref = isCollectionGroup ? collectionGroup(db, path) : collection(db, path);
    const q = query(ref, ...constraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      setData(results);
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [path, JSON.stringify(constraints), isCollectionGroup]);

  return { data, loading, error };
}

