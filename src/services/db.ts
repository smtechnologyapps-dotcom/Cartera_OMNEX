import { db, storage, isDemoMode } from '../firebase';
import { collection, doc, setDoc, getDoc, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface CustomCategory {
  id: string;
  name: string;
  type: 'ingreso' | 'gasto';
  color: string;
  subCategories: string[];
}

export interface UserProfile {
  userId: string;
  fullName: string;
  businessName: string;
  phone: string;
  country: string;
  themeColor: string;
  monthlyBudget: number;
  categories: CustomCategory[];
  createdAt?: Timestamp | Date;
}

export interface Transaction {
  id?: string;
  userId: string;
  type: 'ingreso' | 'gasto';
  category: string; // Changed to string to support dynamic categories
  subCategory?: string;
  amount: number;
  date: Timestamp | Date;
  description: string;
  invoiceUrl?: string;
  status?: 'active' | 'deleted';
  updatedAt?: Timestamp | Date;
}

export interface AuditLog {
  id?: string;
  userId: string;
  transactionId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  reason?: string;
  timestamp: Timestamp | Date;
  details?: any;
}

let mockUserProfile: UserProfile | null = null;

let mockTransactions: Transaction[] = [
  { id: '1', userId: 'demo-user-123', type: 'ingreso', category: 'Ingreso', subCategory: 'Plataformas digitales', amount: 5000, date: new Date(Date.now() - 86400000 * 5), description: 'Ventas de la semana', status: 'active' },
  { id: '2', userId: 'demo-user-123', type: 'gasto', category: 'OMNEX', subCategory: 'Plataforma digital', amount: 350, date: new Date(Date.now() - 86400000 * 2), description: 'Suscripción de software', status: 'active' },
  { id: '3', userId: 'demo-user-123', type: 'gasto', category: 'Personal/Hijos', subCategory: 'Útiles escolares', amount: 120, date: new Date(), description: 'Compra de útiles escolares', status: 'active' },
];

let mockAuditLogs: AuditLog[] = [];

const getTransactionsCollection = () => collection(db, 'transactions');
const getAuditCollection = () => collection(db, 'audit_logs');

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (isDemoMode) {
    return mockUserProfile || {
      userId: 'demo-user-123',
      fullName: 'Usuario Demo',
      businessName: 'OMNEX Demo',
      phone: '',
      country: '',
      themeColor: '#8b5cf6',
      monthlyBudget: 2000,
      categories: [
        { id: '1', name: 'OMNEX', type: 'gasto', color: '#8b5cf6', subCategories: ['Plataforma digital', 'Comida con clientes'] },
        { id: '2', name: 'Personal/Hijos', type: 'gasto', color: '#ec4899', subCategories: ['Útiles escolares', 'Ropa'] },
        { id: '3', name: 'Ingreso', type: 'ingreso', color: '#10b981', subCategories: ['Ventas', 'Servicios'] }
      ]
    };
  }
  
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  if (isDemoMode) {
    mockUserProfile = profile;
    return;
  }
  
  try {
    const docRef = doc(db, 'users', profile.userId);
    await setDoc(docRef, {
      ...profile,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

export const logAudit = async (log: AuditLog) => {
  if (isDemoMode) {
    mockAuditLogs = [{ ...log, id: Date.now().toString() }, ...mockAuditLogs];
    return;
  }
  try {
    await addDoc(getAuditCollection(), {
      ...log,
      timestamp: log.timestamp instanceof Date ? Timestamp.fromDate(log.timestamp) : log.timestamp
    });
  } catch (error) {
    console.error("Error logging audit: ", error);
  }
};

export const addTransaction = async (transaction: Transaction) => {
  const tx = { ...transaction, status: 'active' as const };
  if (isDemoMode) {
    const newTx = { ...tx, id: Date.now().toString() };
    mockTransactions = [newTx, ...mockTransactions];
    await logAudit({ userId: tx.userId, transactionId: newTx.id, action: 'CREATE', timestamp: new Date(), details: tx });
    return newTx.id;
  }
  try {
    const docRef = await addDoc(getTransactionsCollection(), {
      ...tx,
      date: tx.date instanceof Date ? Timestamp.fromDate(tx.date) : tx.date
    });
    await logAudit({ userId: tx.userId, transactionId: docRef.id, action: 'CREATE', timestamp: new Date(), details: tx });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>, userId: string, reason: string = 'Edición manual') => {
  if (isDemoMode) {
    mockTransactions = mockTransactions.map(tx => tx.id === id ? { ...tx, ...updates, updatedAt: new Date() } : tx);
    await logAudit({ userId, transactionId: id, action: 'UPDATE', reason, timestamp: new Date(), details: updates });
    return;
  }
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'transactions', id);
    const safeUpdates = { ...updates, updatedAt: Timestamp.now() };
    if (safeUpdates.date && safeUpdates.date instanceof Date) {
      safeUpdates.date = Timestamp.fromDate(safeUpdates.date);
    }
    await updateDoc(docRef, safeUpdates);
    await logAudit({ userId, transactionId: id, action: 'UPDATE', reason, timestamp: new Date(), details: updates });
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

export const softDeleteTransaction = async (id: string, userId: string, reason: string) => {
  return updateTransaction(id, { status: 'deleted' }, userId, reason);
};

export const getUserTransactions = async (userId: string) => {
  if (isDemoMode) {
    return [...mockTransactions.filter(t => t.status !== 'deleted')];
  }
  try {
    const q = query(
      getTransactionsCollection(),
      where("userId", "==", userId),
      where("status", "==", "active"),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() } as Transaction);
    });
    return transactions;
  } catch (error) {
    // Fallback if index missing for status active
    console.warn("Index might be missing, falling back to client filter", error);
    const qBack = query(
      getTransactionsCollection(),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(qBack);
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Transaction;
      if (data.status !== 'deleted') {
        transactions.push({ id: doc.id, ...data });
      }
    });
    return transactions;
  }
};

export const getAuditLogs = async (userId: string) => {
  if (isDemoMode) {
    return [...mockAuditLogs];
  }
  try {
    const q = query(getAuditCollection(), where("userId", "==", userId), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const logs: AuditLog[] = [];
    querySnapshot.forEach((doc) => logs.push({ id: doc.id, ...doc.data() } as AuditLog));
    return logs;
  } catch (error) {
    console.warn("Index missing for audit logs", error);
    const q2 = query(getAuditCollection(), where("userId", "==", userId));
    const qs = await getDocs(q2);
    const logs: AuditLog[] = [];
    qs.forEach((doc) => logs.push({ id: doc.id, ...doc.data() } as AuditLog));
    return logs.sort((a, b) => {
       const d1 = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : (a.timestamp as Date).getTime();
       const d2 = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : (b.timestamp as Date).getTime();
       return d2 - d1;
    });
  }
};

export const uploadInvoice = async (userId: string, file: File): Promise<string> => {
  if (isDemoMode) {
    console.warn("Modo Demo: Simulando subida de imagen...");
    return URL.createObjectURL(file);
  }
  try {
    const fileRef = ref(storage, `invoices/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error) {
    console.error("Error uploading file: ", error);
    throw error;
  }
};
