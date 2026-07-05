import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  getDocFromServer,
  Firestore
} from "firebase/firestore";
import { Product, Transaction, User } from "../types";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
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
    db = getFirestore(app);
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
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    const productsList: Product[] = [];
    querySnapshot.forEach((document) => {
      productsList.push(document.data() as Product);
    });
    return productsList;
  } catch (error) {
    console.error("Error fetching products from Firebase:", error);
    throw error;
  }
}

// Fetch all transactions
export async function getTransactionsFromFirebase(): Promise<Transaction[] | null> {
  if (!db) return null;
  try {
    const querySnapshot = await getDocs(collection(db, "transactions"));
    const transactionsList: Transaction[] = [];
    querySnapshot.forEach((document) => {
      transactionsList.push(document.data() as Transaction);
    });
    // Sort transactions by date descending (newest first)
    return transactionsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error fetching transactions from Firebase:", error);
    throw error;
  }
}

// Fetch all users
export async function getUsersFromFirebase(): Promise<User[] | null> {
  if (!db) return null;
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const usersList: User[] = [];
    querySnapshot.forEach((document) => {
      usersList.push(document.data() as User);
    });
    return usersList;
  } catch (error) {
    console.error("Error fetching users from Firebase:", error);
    throw error;
  }
}

// Save or Update a single product
export async function saveProductToFirebase(product: Product): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, "products", product.id), product);
  } catch (error) {
    console.error("Error saving product to Firebase:", error);
    throw error;
  }
}

// Delete a product
export async function deleteProductFromFirebase(productId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, "products", productId));
  } catch (error) {
    console.error("Error deleting product from Firebase:", error);
    throw error;
  }
}

// Save a single transaction
export async function saveTransactionToFirebase(transaction: Transaction): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, "transactions", transaction.id), transaction);
  } catch (error) {
    console.error("Error saving transaction to Firebase:", error);
    throw error;
  }
}

// Save or Update a single user (Access Management)
export async function saveUserToFirebase(user: User): Promise<void> {
  if (!db) return;
  try {
    await setDoc(doc(db, "users", user.id), user);
  } catch (error) {
    console.error("Error saving user to Firebase:", error);
    throw error;
  }
}

// Delete a user
export async function deleteUserFromFirebase(userId: string): Promise<void> {
  if (!db) return;
  try {
    await deleteDoc(doc(db, "users", userId));
  } catch (error) {
    console.error("Error deleting user from Firebase:", error);
    throw error;
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
