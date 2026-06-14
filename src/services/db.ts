import { db, storage, isDemoMode } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface Transaction {
  id?: string;
  userId: string;
  type: 'ingreso' | 'gasto';
  category: 'OMNEX' | 'Personal/Hijos' | 'Ingreso';
  subCategory?: string;
  amount: number;
  date: Timestamp | Date;
  description: string;
  invoiceUrl?: string;
}

let mockTransactions: Transaction[] = [
  { id: '1', userId: 'demo-user-123', type: 'ingreso', category: 'Ingreso', subCategory: 'Plataformas digitales', amount: 5000, date: new Date(Date.now() - 86400000 * 5), description: 'Ventas de la semana' },
  { id: '2', userId: 'demo-user-123', type: 'gasto', category: 'OMNEX', subCategory: 'Plataforma digital', amount: 350, date: new Date(Date.now() - 86400000 * 2), description: 'Suscripción de software' },
  { id: '3', userId: 'demo-user-123', type: 'gasto', category: 'Personal/Hijos', subCategory: 'Útiles escolares', amount: 120, date: new Date(), description: 'Compra de útiles escolares' },
];

const getTransactionsCollection = () => collection(db, 'transactions');

export const addTransaction = async (transaction: Transaction) => {
  if (isDemoMode) {
    console.warn("Modo Demo: Guardando transacción en memoria...");
    const newTx = { ...transaction, id: Date.now().toString() };
    mockTransactions = [newTx, ...mockTransactions];
    return newTx.id;
  }
  try {
    const docRef = await addDoc(getTransactionsCollection(), {
      ...transaction,
      date: transaction.date instanceof Date ? Timestamp.fromDate(transaction.date) : transaction.date
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const getUserTransactions = async (userId: string) => {
  if (isDemoMode) {
    console.warn("Modo Demo: Obteniendo transacciones de memoria...");
    return [...mockTransactions];
  }
  try {
    const q = query(
      getTransactionsCollection(),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() } as Transaction);
    });
    return transactions;
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
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
