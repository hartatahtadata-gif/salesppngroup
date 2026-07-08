import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  getDocFromServer,
  Firestore
} from "firebase/firestore";
import { Product, Transaction, User } from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyAYqnqzKT_zLZ2kzZtTXoOR3oEZjwwwbls",
  authDomain: "herbalppngroup.firebaseapp.com",
  projectId: "herbalppngroup",
  storageBucket: "herbalppngroup.firebasestorage.app",
  messagingSenderId: "351637453793",
  appId: "1:351637453793:web:71d6244b2848a66225f0a0",
  measurementId: "G-YNZGZV1DSX"
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  return !!(firebaseConfig.projectId && firebaseConfig.apiKey);
};

let app;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    try {
      db = initializeFirestore(app, {
        ignoreUndefinedProperties: true,
        experimentalForceLongPolling: true
      });
    } catch {
      db = getFirestore(app);
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

// Test Connection (as requested by skill rules)
export async function testConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified successfully.");
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is currently offline.");
    } else {
      console.error("Please check your Firebase configuration:", error);
    }
    return false;
  }
}

// Fetch all products
export async function getProductsFromFirebase(): Promise<Product[] | null> {
  if (!db) return null;
  const path = "products";
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const productsList: Product[] = [];
    querySnapshot.forEach((document) => {
      productsList.push(document.data() as Product);
    });
    return productsList;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Fetch all transactions
export async function getTransactionsFromFirebase(): Promise<Transaction[] | null> {
  if (!db) return null;
  const path = "transactions";
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const transactionsList: Product[] = []; // Reuse list build but cast as Transaction
    const list: Transaction[] = [];
    querySnapshot.forEach((document) => {
      list.push(document.data() as Transaction);
    });
    // Sort transactions by date descending (newest first)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Fetch all users
export async function getUsersFromFirebase(): Promise<User[] | null> {
  if (!db) return null;
  const path = "users";
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const usersList: User[] = [];
    querySnapshot.forEach((document) => {
      usersList.push(document.data() as User);
    });
    return usersList;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Save or Update a single product
export async function saveProductToFirebase(product: Product): Promise<void> {
  if (!db) return;
  const path = `products/${product.id}`;
  try {
    const cleaned = JSON.parse(JSON.stringify(product));
    await setDoc(doc(db, "products", product.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a product
export async function deleteProductFromFirebase(productId: string): Promise<void> {
  if (!db) return;
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, "products", productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save a single transaction
export async function saveTransactionToFirebase(transaction: Transaction): Promise<void> {
  if (!db) return;
  const path = `transactions/${transaction.id}`;
  try {
    const cleaned = JSON.parse(JSON.stringify(transaction));
    await setDoc(doc(db, "transactions", transaction.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save or Update a single user (Access Management)
export async function saveUserToFirebase(user: User): Promise<void> {
  if (!db) return;
  const path = `users/${user.id}`;
  try {
    const cleaned = JSON.parse(JSON.stringify(user));
    await setDoc(doc(db, "users", user.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete a user
export async function deleteUserFromFirebase(userId: string): Promise<void> {
  if (!db) return;
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, "users", userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Delete a transaction
export async function deleteTransactionFromFirebase(transactionId: string): Promise<void> {
  if (!db) return;
  const path = `transactions/${transactionId}`;
  try {
    await deleteDoc(doc(db, "transactions", transactionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Seeding tool to populate Firebase on initial setup if collections are empty
export async function seedInitialFirebaseData(
  initialProducts: Product[],
  initialTransactions: Transaction[],
  initialUsers: User[]
): Promise<void> {
  if (!db) return;
  try {
    // 1. Seed products if empty
    const prods = await getProductsFromFirebase();
    if (prods && prods.length === 0) {
      console.log("Seeding initial products to Firestore...");
      for (const p of initialProducts) {
        await saveProductToFirebase(p);
      }
    }

    // 2. Seed transactions if empty
    const txs = await getTransactionsFromFirebase();
    if (txs && txs.length === 0) {
      console.log("Seeding initial transactions to Firestore...");
      for (const t of initialTransactions) {
        await saveTransactionToFirebase(t);
      }
    }

    // 3. Seed users if empty
    const usrs = await getUsersFromFirebase();
    if (usrs && usrs.length === 0) {
      console.log("Seeding initial users to Firestore...");
      for (const u of initialUsers) {
        await saveUserToFirebase(u);
      }
    }
  } catch (error) {
    console.error("Error seeding initial Firestore data:", error);
  }
}

// Run connection test if configured
if (isFirebaseConfigured()) {
  testConnection();
}
