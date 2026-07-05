import React, { useState, useEffect } from 'react';
import { User, UserRole, Product, Transaction } from './types';
import { getStoredData, saveStoredData } from './data/initialData';
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
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // App-level shared database states
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Loading state
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const data = getStoredData();
    setProducts(data.products);
    setTransactions(data.transactions);
    setUsers(data.users);
    setLoading(false);
  }, []);

  // Save to localStorage whenever states change
  const handleUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    saveStoredData(updatedProducts, transactions, users);
  };

  const handleAddTransaction = (newTransaction: Transaction) => {
    const updatedTx = [newTransaction, ...transactions];
    setTransactions(updatedTx);
    saveStoredData(products, updatedTx, users);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini dari katalog?')) {
      const updatedProds = products.filter(p => p.id !== productId);
      setProducts(updatedProds);
      saveStoredData(updatedProds, transactions, users);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
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
                      alt="Logo PT. Distribusi Nusantara" 
                      className="h-6 w-6 object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="hidden sm:block">
                    <span className="font-bold text-sm tracking-tight text-slate-850 block">PT. Distribusi Nusantara</span>
                    <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">Sistem Monitor Pengambilan Produk</span>
                  </div>
                  <span className="font-bold text-sm tracking-tight text-slate-850 sm:hidden">MOP Staff</span>
                </div>

                {/* Profile and Logout info */}
                <div className="flex items-center gap-3">
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
