import React, { useState, useEffect } from 'react';
import { User, UserRole, Product, Transaction, TransactionType } from './types';
import { getStoredData, saveStoredData, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_USERS } from './data/initialData';
import LoginScreen from './components/LoginScreen';
import StaffDashboard from './components/StaffDashboard';
import AdminPanel from './components/AdminPanel';
import ManagerDashboard from './components/ManagerDashboard';
import { 
  LogOut, 
  ShoppingBag, 
  ShieldCheck, 
  Users, 
  Warehouse, 
  ArrowRight,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  isFirebaseConfigured,
  getProductsFromFirebase,
  getTransactionsFromFirebase,
  getUsersFromFirebase,
  saveProductToFirebase,
  deleteProductFromFirebase,
  saveTransactionToFirebase,
  deleteTransactionFromFirebase,
  saveUserToFirebase,
  deleteUserFromFirebase,
  seedInitialFirebaseData,
  testConnection
} from './lib/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('mop_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  // App-level shared database states
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Loading state
  const [loading, setLoading] = useState(true);

  // Firebase connection and sync states
  const [firebaseActive, setFirebaseActive] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load and sync with Firebase if configured, otherwise use localStorage fallback
  useEffect(() => {
    const loadAndSyncData = async () => {
      // 1. Immediately load whatever is currently in localStorage (or initial data if fresh)
      // This prevents visual flicker and ensures there is ALWAYS a valid local copy of user updates.
      const localData = getStoredData();
      setProducts(localData.products);
      setTransactions(localData.transactions);
      setUsers(localData.users);

      if (isFirebaseConfigured()) {
        try {
          setSyncing(true);
          const isConnected = await testConnection();
          if (isConnected) {
            setFirebaseActive(true);
            
            // Seed default dataset to Firestore ONLY if the Firestore collections are completely empty
            await seedInitialFirebaseData(INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_USERS);

            // Fetch live cloud data
            let fbProducts = await getProductsFromFirebase();
            let fbTransactions = await getTransactionsFromFirebase();
            let fbUsers = await getUsersFromFirebase();

            // Clear any lingering demo data in Firestore to prevent them from showing up
            const DEMO_PRODUCT_IDS = ['PRD-01', 'PRD-02', 'PRD-03', 'PRD-04', 'PRD-05', 'PRD-06', 'PRD-07'];
            const DEMO_TRANSACTION_IDS = [
              'TX-001', 'TX-002', 'TX-003', 'TX-004', 'TX-005', 'TX-006', 'TX-007', 'TX-008', 'TX-009', 'TX-010', 'TX-011', 'TX-012', 'TX-013'
            ];
            const DEMO_USER_IDS = ['staff-1', 'staff-2', 'staff-3'];

            if (fbProducts) {
              const demoProducts = fbProducts.filter(p => DEMO_PRODUCT_IDS.includes(p.id));
              for (const p of demoProducts) {
                await deleteProductFromFirebase(p.id).catch(err => console.error(err));
              }
              fbProducts = fbProducts.filter(p => !DEMO_PRODUCT_IDS.includes(p.id));
            }

            if (fbTransactions) {
              const demoTransactions = fbTransactions.filter(t => DEMO_TRANSACTION_IDS.includes(t.id));
              for (const t of demoTransactions) {
                await deleteTransactionFromFirebase(t.id).catch(err => console.error(err));
              }
              fbTransactions = fbTransactions.filter(t => !DEMO_TRANSACTION_IDS.includes(t.id));
            }

            if (fbUsers) {
              const demoUsers = fbUsers.filter(u => DEMO_USER_IDS.includes(u.id));
              for (const u of demoUsers) {
                await deleteUserFromFirebase(u.id).catch(err => console.error(err));
              }
              fbUsers = fbUsers.filter(u => !DEMO_USER_IDS.includes(u.id));
            }

            // Use live Firebase data if successfully retrieved
            const finalProducts = fbProducts && fbProducts.length > 0 ? fbProducts : localData.products;
            const finalTransactions = fbTransactions && fbTransactions.length > 0 ? fbTransactions : localData.transactions;
            const finalUsers = fbUsers && fbUsers.length > 0 ? fbUsers : localData.users;

            setProducts(finalProducts);
            setTransactions(finalTransactions);
            setUsers(finalUsers);

            // Update localStorage so that it is always synchronized with the latest cloud data as a robust cache
            saveStoredData(finalProducts, finalTransactions, finalUsers);
          } else {
            console.warn("Firebase configured but connection failed. Using cached offline data.");
          }
        } catch (error) {
          console.error("Firebase database synchronization failed. Using cached offline data:", error);
        } finally {
          setSyncing(false);
          setLoading(false);
        }
      } else {
        // No Firebase configuration, run in pure localStorage Mode
        setLoading(false);
      }
    };

    loadAndSyncData();
  }, []);

  // Save to state + localStorage + Firebase whenever states change
  const handleUpdateProducts = async (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    saveStoredData(updatedProducts, transactions, users);

    if (isFirebaseConfigured() && firebaseActive) {
      try {
        for (const p of updatedProducts) {
          await saveProductToFirebase(p);
        }
      } catch (e) {
        console.error("Firebase product sync error:", e);
      }
    }
  };

  const handleAddTransaction = async (newTransaction: Transaction) => {
    const updatedTx = [newTransaction, ...transactions];
    setTransactions(updatedTx);
    saveStoredData(products, updatedTx, users);

    if (isFirebaseConfigured() && firebaseActive) {
      try {
        await saveTransactionToFirebase(newTransaction);
        // Also sync updated product stocks to Firebase
        for (const p of products) {
          await saveProductToFirebase(p);
        }
      } catch (e) {
        console.error("Firebase transaction sync error:", e);
      }
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx) return;

    let updatedProds = [...products];
    if (tx.type === TransactionType.INTAKE && tx.items) {
      updatedProds = products.map(p => {
        const item = tx.items?.find(it => it.productId === p.id);
        return item ? { ...p, stock: p.stock + item.quantity } : p;
      });
    } else if (tx.type === TransactionType.RETURN && tx.items) {
      updatedProds = products.map(p => {
        const item = tx.items?.find(it => it.productId === p.id);
        return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
      });
    }

    const updatedTxs = transactions.filter(t => t.id !== transactionId);
    setProducts(updatedProds);
    setTransactions(updatedTxs);
    saveStoredData(updatedProds, updatedTxs, users);

    if (isFirebaseConfigured() && firebaseActive) {
      try {
        await deleteTransactionFromFirebase(transactionId);
        if (tx.type !== TransactionType.DEPOSIT && tx.items) {
          for (const item of tx.items) {
            const p = updatedProds.find(pr => pr.id === item.productId);
            if (p) {
              await saveProductToFirebase(p);
            }
          }
        }
      } catch (e) {
        console.error("Firebase transaction deletion sync error:", e);
      }
    }
  };

  const handleEditTransaction = async (editedTransaction: Transaction) => {
    const oldTx = transactions.find(t => t.id === editedTransaction.id);
    if (!oldTx) return;

    let tempProds = [...products];
    if (oldTx.type === TransactionType.INTAKE && oldTx.items) {
      tempProds = tempProds.map(p => {
        const item = oldTx.items?.find(it => it.productId === p.id);
        return item ? { ...p, stock: p.stock + item.quantity } : p;
      });
    } else if (oldTx.type === TransactionType.RETURN && oldTx.items) {
      tempProds = tempProds.map(p => {
        const item = oldTx.items?.find(it => it.productId === p.id);
        return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
      });
    }

    if (editedTransaction.type === TransactionType.INTAKE && editedTransaction.items) {
      tempProds = tempProds.map(p => {
        const item = editedTransaction.items?.find(it => it.productId === p.id);
        return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
      });
    } else if (editedTransaction.type === TransactionType.RETURN && editedTransaction.items) {
      tempProds = tempProds.map(p => {
        const item = editedTransaction.items?.find(it => it.productId === p.id);
        return item ? { ...p, stock: p.stock + item.quantity } : p;
      });
    }

    const updatedTxs = transactions.map(t => t.id === editedTransaction.id ? editedTransaction : t);
    setProducts(tempProds);
    setTransactions(updatedTxs);
    saveStoredData(tempProds, updatedTxs, users);

    if (isFirebaseConfigured() && firebaseActive) {
      try {
        await saveTransactionToFirebase(editedTransaction);
        for (const p of tempProds) {
          await saveProductToFirebase(p);
        }
      } catch (e) {
        console.error("Firebase transaction edit sync error:", e);
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini dari katalog?')) {
      const updatedProds = products.filter(p => p.id !== productId);
      setProducts(updatedProds);
      saveStoredData(updatedProds, transactions, users);

      if (isFirebaseConfigured() && firebaseActive) {
        try {
          await deleteProductFromFirebase(productId);
        } catch (e) {
          console.error("Firebase product deletion sync error:", e);
        }
      }
    }
  };

  // User / Access Management handlers for the Manager role
  const handleSaveUser = async (user: User) => {
    const exists = users.some(u => u.id === user.id);
    let updatedUsers: User[];
    
    if (exists) {
      updatedUsers = users.map(u => u.id === user.id ? user : u);
    } else {
      updatedUsers = [...users, user];
    }
    
    setUsers(updatedUsers);
    saveStoredData(products, transactions, updatedUsers);

    if (isFirebaseConfigured() && firebaseActive) {
      try {
        await saveUserToFirebase(user);
      } catch (e) {
        console.error("Firebase user save sync error:", e);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    saveStoredData(products, transactions, updatedUsers);

    if (isFirebaseConfigured() && firebaseActive) {
      try {
        await deleteUserFromFirebase(userId);
      } catch (e) {
        console.error("Firebase user deletion sync error:", e);
      }
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('mop_current_user', JSON.stringify(user));
    } catch (e) {
      console.error("Failed to persist login session:", e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('mop_current_user');
    } catch (e) {
      console.error("Failed to clear login session:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 font-sans">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs tracking-wider uppercase font-bold text-slate-500">Memuat Sistem MOP...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="app-root-container">
      
      <AnimatePresence mode="wait">
        {!currentUser ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            <LoginScreen users={users} onLogin={handleLogin} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            {/* Upper Navigation Header */}
            <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 px-4 py-3 shadow-sm">
              <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
                
                {/* Brand Logo */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="bg-indigo-50 p-1.5 rounded-xl border border-indigo-100 flex items-center justify-center">
                    <img 
                      src="https://drive.google.com/thumbnail?id=1L8BTmeULOdJhKhVhE-6ZNI23FbiWWkEu&sz=120" 
                      alt="Logo PPN Group" 
                      className="h-6 w-6 object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="hidden sm:block">
                    <span className="font-bold text-sm tracking-tight text-slate-850 block">PPN Group</span>
                    <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">Monitor Pengambilan Produk dan Setoran</span>
                  </div>
                  <span className="font-bold text-sm tracking-tight text-slate-850 sm:hidden">Sales PPN Group</span>
                </div>

                {/* Profile and Logout info */}
                <div className="flex items-center gap-3">
                  {/* Real-time Firebase Database Connection Status Badge */}
                  <div className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-xl border shrink-0">
                    {isFirebaseConfigured() ? (
                      firebaseActive ? (
                        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50/60 border-emerald-100">
                          <Cloud className="h-3 w-3 text-emerald-500" />
                          <span className="hidden sm:inline">Firebase Connected</span>
                          <span className="inline sm:hidden">Cloud</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600 bg-amber-50/60 border-amber-100">
                          <CloudOff className="h-3 w-3 text-amber-500" />
                          <span>No Conn</span>
                        </span>
                      )
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500 bg-slate-50/80 border-slate-200">
                        <CloudOff className="h-3 w-3 text-slate-400" />
                        <span className="hidden sm:inline">Offline (LocalStorage)</span>
                        <span className="inline sm:hidden">Local</span>
                      </span>
                    )}
                    {syncing && <RefreshCw className="h-2.5 w-2.5 animate-spin text-slate-400 ml-1" />}
                  </div>

                  <div className="text-right hidden md:block">
                    <span className="text-xs font-bold text-slate-800 block">{currentUser.name}</span>
                    <span className="text-[10px] text-slate-400 block font-bold tracking-wide uppercase capitalize">Role: {currentUser.role}</span>
                  </div>

                  <div className="w-px h-6 bg-slate-200 hidden md:block"></div>

                  <button
                    onClick={handleLogout}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80"
                    id="header-logout-btn"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Main Application Container */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-12">
              <AnimatePresence mode="wait">
                {currentUser.role === UserRole.STAFF && (
                  <motion.div
                    key="staff-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <StaffDashboard 
                      currentStaff={currentUser}
                      products={products}
                      transactions={transactions}
                      onAddTransaction={handleAddTransaction}
                      onUpdateProducts={handleUpdateProducts}
                    />
                  </motion.div>
                )}

                {currentUser.role === UserRole.ADMIN && (
                  <motion.div
                    key="admin-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AdminPanel 
                      products={products}
                      transactions={transactions}
                      users={users}
                      currentAdmin={currentUser}
                      onUpdateProducts={handleUpdateProducts}
                      onAddTransaction={handleAddTransaction}
                      onDeleteProduct={handleDeleteProduct}
                      onDeleteTransaction={handleDeleteTransaction}
                      onEditTransaction={handleEditTransaction}
                    />
                  </motion.div>
                )}

                {currentUser.role === UserRole.MANAGER && (
                  <motion.div
                    key="manager-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ManagerDashboard 
                      products={products}
                      transactions={transactions}
                      users={users}
                      onSaveUser={handleSaveUser}
                      onDeleteUser={handleDeleteUser}
                      firebaseActive={firebaseActive}
                      isFirebaseConfigured={isFirebaseConfigured()}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

