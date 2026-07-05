import React, { useState, useMemo } from 'react';
import { Product, Transaction, TransactionType, User, StaffSummary, UserRole } from '../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  RotateCcw, 
  AlertTriangle, 
  TrendingDown, 
  Users, 
  ShoppingBag, 
  Calendar, 
  Search,
  ArrowRightLeft,
  Briefcase,
  UserCheck,
  UserX,
  Plus,
  Edit,
  Trash2,
  Key,
  Phone,
  Mail,
  Lock,
  Settings,
  Shield,
  ShieldCheck,
  Check,
  Cloud,
  CloudOff,
  Database,
  HelpCircle,
  RefreshCw,
  ChevronDown,
  Layers
} from 'lucide-react';

interface ManagerDashboardProps {
  products: Product[];
  transactions: Transaction[];
  users: User[];
  onSaveUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  firebaseActive: boolean;
  isFirebaseConfigured: boolean;
}

export default function ManagerDashboard({ 
  products, 
  transactions, 
  users, 
  onSaveUser, 
  onDeleteUser,
  firebaseActive,
  isFirebaseConfigured
}: ManagerDashboardProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'analytics' | 'ledger' | 'access'>('analytics');

  // Active ledger selections for Manager Product sub-ledger
  const [ledgerStaffId, setLedgerStaffId] = useState<string>('');
  const [ledgerProductId, setLedgerProductId] = useState<string>('');

  // Month & Year state
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth() + 1); // 1-12 or 'all'
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // User list searching / filtering
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Modal / Form state for user creation/editing
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form input states
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>(UserRole.STAFF);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formAvatar, setFormAvatar] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formError, setFormError] = useState('');

  const IndonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const availableMonths = useMemo(() => {
    const map = new Map<string, { month: number; year: number }>();
    
    // Sort transactions by date descending
    const sortedTxs = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    sortedTxs.forEach(tx => {
      const d = new Date(tx.date);
      const m = d.getMonth() + 1; // 1-12
      const y = d.getFullYear();
      const key = `${m}-${y}`;
      if (!map.has(key)) {
        map.set(key, { month: m, year: y });
      }
    });

    // Make sure current month is always present
    const curM = new Date().getMonth() + 1;
    const curY = new Date().getFullYear();
    const curKey = `${curM}-${curY}`;
    if (!map.has(curKey)) {
      map.set(curKey, { month: curM, year: curY });
    }

    return Array.from(map.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
      .map(item => ({
        key: `${item.month}-${item.year}`,
        month: item.month,
        year: item.year,
        label: `${IndonesianMonths[item.month - 1]} ${item.year}`
      }));
  }, [transactions]);

  const handleMonthYearChange = (val: string) => {
    if (val === 'all') {
      setSelectedMonth('all');
    } else {
      const [m, y] = val.split('-').map(Number);
      setSelectedMonth(m);
      setSelectedYear(y);
    }
  };

  const selectedMonthYearKey = selectedMonth === 'all' ? 'all' : `${selectedMonth}-${selectedYear}`;
  const selectedMonthYearLabel = useMemo(() => {
    if (selectedMonth === 'all') return 'Semua Bulan';
    return `${IndonesianMonths[(selectedMonth as number) - 1]} ${selectedYear}`;
  }, [selectedMonth, selectedYear]);

  // Format IDR Helper
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const staffUsers = useMemo(() => users.filter(u => u.role === UserRole.STAFF), [users]);

  const activeLedgerStaffId = ledgerStaffId || (staffUsers.length > 0 ? staffUsers[0].id : '');
  const activeLedgerProductId = ledgerProductId || (products.length > 0 ? products[0].id : '');
  const activeLedgerProduct = products.find(p => p.id === activeLedgerProductId);
  const activeLedgerStaff = staffUsers.find(u => u.id === activeLedgerStaffId);

  const ledgerHistoryData = useMemo(() => {
    if (!activeLedgerStaffId || !activeLedgerProductId) {
      return { 
        debitList: [], 
        creditList: [], 
        totalDebitQty: 0, 
        totalDebitAmount: 0, 
        totalCreditQty: 0, 
        totalCreditAmount: 0, 
        balance: 0 
      };
    }

    const debitList: Array<{
      id: string;
      date: string;
      adminName: string;
      quantity: number;
      price: number;
      total: number;
      notes: string;
    }> = [];

    const creditList: Array<{
      id: string;
      date: string;
      type: TransactionType;
      quantity: number;
      price: number;
      total: number;
      notes: string;
    }> = [];

    // Filter by active staff member first
    const staffTxs = transactions.filter(tx => tx.staffId === activeLedgerStaffId);
    
    // Sort transactions by date ascending (oldest first to build running ledger)
    const sortedTxs = [...staffTxs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTxs.forEach(tx => {
      if (tx.type === TransactionType.INTAKE && tx.items) {
        const item = tx.items.find(it => it.productId === activeLedgerProductId);
        if (item) {
          debitList.push({
            id: tx.id,
            date: tx.date,
            adminName: tx.adminName,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            notes: tx.notes || ''
          });
        }
      } else if (tx.type === TransactionType.RETURN && tx.items) {
        const item = tx.items.find(it => it.productId === activeLedgerProductId);
        if (item) {
          creditList.push({
            id: tx.id,
            date: tx.date,
            type: TransactionType.RETURN,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            notes: tx.notes || 'Retur Barang'
          });
        }
      } else if (tx.type === TransactionType.DEPOSIT && tx.items) {
        const item = tx.items.find(it => it.productId === activeLedgerProductId);
        if (item) {
          creditList.push({
            id: tx.id,
            date: tx.date,
            type: TransactionType.DEPOSIT,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            notes: tx.notes || 'Setoran Tunai'
          });
        }
      }
    });

    const totalDebitQty = debitList.reduce((sum, item) => sum + item.quantity, 0);
    const totalDebitAmount = debitList.reduce((sum, item) => sum + item.total, 0);

    const totalCreditQty = creditList.reduce((sum, item) => sum + item.quantity, 0);
    const totalCreditAmount = creditList.reduce((sum, item) => sum + item.total, 0);

    const balance = totalDebitAmount - totalCreditAmount;

    return {
      debitList,
      creditList,
      totalDebitQty,
      totalDebitAmount,
      totalCreditQty,
      totalCreditAmount,
      balance
    };
  }, [transactions, activeLedgerStaffId, activeLedgerProductId]);

  const ledgerPerbandinganLabel = useMemo(() => {
    const { totalDebitQty, totalCreditQty } = ledgerHistoryData;
    if (totalDebitQty === 0 && totalCreditQty === 0) return { ar: 0, setor: 0 };
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };
    const divisor = gcd(totalDebitQty, totalCreditQty) || 1;
    return {
      ar: totalDebitQty / divisor,
      setor: totalCreditQty / divisor
    };
  }, [ledgerHistoryData]);

  // Filter transactions for selected Month & Year
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const matchMonth = selectedMonth === 'all' || txDate.getMonth() + 1 === selectedMonth;
      const matchYear = selectedMonth === 'all' || txDate.getFullYear() === selectedYear;
      return matchMonth && matchYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Overall statistics for the selected month
  const stats = useMemo(() => {
    let totalTaken = 0;
    let totalDeposited = 0;
    let totalReturned = 0;

    filteredTransactions.forEach(tx => {
      if (tx.type === TransactionType.INTAKE) {
        if (tx.items) {
          tx.items.forEach(item => {
            totalTaken += item.total;
          });
        }
      } else if (tx.type === TransactionType.DEPOSIT) {
        totalDeposited += tx.amount || 0;
      } else if (tx.type === TransactionType.RETURN) {
        if (tx.items) {
          tx.items.forEach(item => {
            totalReturned += item.total;
          });
        }
      }
    });

    const outstandingBill = totalTaken - totalDeposited - totalReturned;

    return {
      totalTaken,
      totalDeposited,
      totalReturned,
      outstandingBill
    };
  }, [filteredTransactions]);

  // Staff summary rankings for the selected month
  const staffSummaries = useMemo(() => {
    const staffMap = new Map<string, StaffSummary>();
    const staffList = users.filter(u => u.role === 'staff');

    // Initialize map
    staffList.forEach(s => {
      staffMap.set(s.id, {
        staffId: s.id,
        staffName: s.name,
        totalTaken: 0,
        totalDeposited: 0,
        totalReturned: 0,
        outstandingBill: 0
      });
    });

    // Accumulate transactions for this month
    filteredTransactions.forEach(tx => {
      const sSum = staffMap.get(tx.staffId);
      if (sSum) {
        if (tx.type === TransactionType.INTAKE && tx.items) {
          tx.items.forEach(item => { sSum.totalTaken += item.total; });
        } else if (tx.type === TransactionType.DEPOSIT) {
          sSum.totalDeposited += tx.amount || 0;
        } else if (tx.type === TransactionType.RETURN && tx.items) {
          tx.items.forEach(item => { sSum.totalReturned += item.total; });
        }
      }
    });

    // Calculate outstanding bill for each staff
    const results: StaffSummary[] = [];
    staffMap.forEach(sSum => {
      sSum.outstandingBill = sSum.totalTaken - sSum.totalDeposited - sSum.totalReturned;
      results.push(sSum);
    });

    // Sort by outstanding bill desc
    return results.sort((a, b) => b.outstandingBill - a.outstandingBill);
  }, [filteredTransactions, users]);

  // Recharts: Trend data over the month (Daily or Monthly aggregations)
  const chartTrendData = useMemo(() => {
    if (selectedMonth === 'all') {
      const monthlyData: { [key: string]: { monthKey: string; monthLabel: string; Intake: number; Deposit: number; Return: number; year: number; month: number } } = {};
      
      transactions.forEach(tx => {
        const d = new Date(tx.date);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const key = `${m}-${y}`;
        if (!monthlyData[key]) {
          monthlyData[key] = {
            monthKey: key,
            monthLabel: `${IndonesianMonths[m - 1].slice(0, 3)} ${y}`,
            Intake: 0,
            Deposit: 0,
            Return: 0,
            year: y,
            month: m
          };
        }
        if (tx.type === TransactionType.INTAKE && tx.items) {
          tx.items.forEach(item => { monthlyData[key].Intake += item.total; });
        } else if (tx.type === TransactionType.DEPOSIT) {
          monthlyData[key].Deposit += tx.amount || 0;
        } else if (tx.type === TransactionType.RETURN && tx.items) {
          tx.items.forEach(item => { monthlyData[key].Return += item.total; });
        }
      });
      
      return Object.values(monthlyData).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      }).map(it => ({
        day: it.monthLabel,
        Intake: it.Intake,
        Deposit: it.Deposit,
        Return: it.Return
      }));
    }

    const daysInMonth = new Date(selectedYear, selectedMonth as number, 0).getDate();
    const dayData: { [day: number]: { day: string; Intake: number; Deposit: number; Return: number } } = {};

    for (let i = 1; i <= daysInMonth; i++) {
      dayData[i] = {
        day: `${i}`,
        Intake: 0,
        Deposit: 0,
        Return: 0
      };
    }

    filteredTransactions.forEach(tx => {
      const txDay = new Date(tx.date).getDate();
      if (dayData[txDay]) {
        if (tx.type === TransactionType.INTAKE && tx.items) {
          tx.items.forEach(item => { dayData[txDay].Intake += item.total; });
        } else if (tx.type === TransactionType.DEPOSIT) {
          dayData[txDay].Deposit += tx.amount || 0;
        } else if (tx.type === TransactionType.RETURN && tx.items) {
          tx.items.forEach(item => { dayData[txDay].Return += item.total; });
        }
      }
    });

    return Object.values(dayData);
  }, [transactions, filteredTransactions, selectedMonth, selectedYear]);

  // Pie chart data: Intake vs Deposit vs Return
  const pieChartData = useMemo(() => {
    return [
      { name: 'Uang Disetor', value: stats.totalDeposited, color: '#10B981' }, // emerald
      { name: 'Produk Diretur', value: stats.totalReturned, color: '#3B82F6' }, // blue
      { name: 'Sisa Tagihan', value: stats.outstandingBill > 0 ? stats.outstandingBill : 0, color: '#EF4444' } // red
    ];
  }, [stats]);

  // Stock and expiry warnings
  const inventoryWarnings = useMemo(() => {
    const warnings: { product: Product; type: 'low_stock' | 'expiry' | 'both'; message: string }[] = [];
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);

    products.forEach(p => {
      const expDate = new Date(p.expiryDate);
      const isLowStock = p.stock <= 15;
      const isNearExpiry = expDate <= threeMonthsLater;

      if (isLowStock && isNearExpiry) {
        warnings.push({
          product: p,
          type: 'both',
          message: `Stok kritis (${p.stock} ${p.unit}) & Kedaluwarsa dekat (${p.expiryDate})`
        });
      } else if (isLowStock) {
        warnings.push({
          product: p,
          type: 'low_stock',
          message: `Stok menipis sisa ${p.stock} ${p.unit}`
        });
      } else if (isNearExpiry) {
        warnings.push({
          product: p,
          type: 'expiry',
          message: `Kedaluwarsa dekat tanggal ${p.expiryDate}`
        });
      }
    });

    return warnings;
  }, [products]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (user.phone && user.phone.includes(userSearchQuery));
      return matchesSearch;
    });
  }, [users, userSearchQuery]);

  // Toggle user active status directly
  const handleToggleStatus = (user: User) => {
    const nextStatus = user.status === 'inactive' ? 'active' : 'inactive';
    const updatedUser: User = {
      ...user,
      status: nextStatus
    };
    onSaveUser(updatedUser);
  };

  // Open modal for user creation
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormId('');
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole(UserRole.STAFF);
    setFormStatus('active');
    setFormAvatar('');
    setFormPassword('123456'); // Default password for new accounts
    setFormError('');
    setIsUserModalOpen(true);
  };

  // Open modal for editing user
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormStatus(user.status || 'active');
    setFormAvatar(user.avatarUrl || '');
    setFormPassword(user.password || '123456');
    setFormError('');
    setIsUserModalOpen(true);
  };

  // Submit Add/Edit user form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formEmail.trim()) {
      setFormError('Nama lengkap dan alamat email wajib diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail)) {
      setFormError('Format email tidak valid.');
      return;
    }

    if (!formPassword.trim()) {
      setFormError('Kata sandi wajib diisi.');
      return;
    }

    // ID generation if empty (only for creation)
    let finalId = formId.trim();
    if (!editingUser) {
      if (!finalId) {
        const prefix = formRole === UserRole.STAFF ? 'staff-' : formRole === UserRole.ADMIN ? 'admin-' : 'manager-';
        const count = users.filter(u => u.role === formRole).length + 1;
        finalId = `${prefix}${Date.now().toString().slice(-4)}${count}`;
      } else {
        // Check if ID already exists
        if (users.some(u => u.id.toLowerCase() === finalId.toLowerCase())) {
          setFormError('ID Pengguna / Username tersebut sudah digunakan.');
          return;
        }
      }
    }

    // Avatar generation if empty
    let finalAvatar = formAvatar.trim();
    if (!finalAvatar) {
      const colors = ['6366F1', '10B981', '3B82F6', 'F59E0B', 'EF4444', '8B5CF6'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      finalAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(formName)}&background=${randomColor}&color=fff&size=150&bold=true`;
    }

    const savedUser: User = {
      id: finalId,
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: formRole,
      phone: formPhone.trim() || undefined,
      status: formStatus,
      avatarUrl: finalAvatar,
      password: formPassword.trim()
    };

    onSaveUser(savedUser);
    setIsUserModalOpen(false);
  };

  // Delete user account
  const handleDeleteUserClick = (userId: string, userName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun ${userName}? Tindakan ini permanen.`)) {
      onDeleteUser(userId);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="manager-dashboard-view">
      {/* Upper Navigation & Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-sans tracking-tight">Portal Manajemen Manajer</h1>
            <p className="text-slate-500 text-xs mt-1">Kelola hak akses staff, pantau kinerja distribusi penjualan, serta lakukan monitoring real-time cloud.</p>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Database:</span>
            {isFirebaseConfigured ? (
              firebaseActive ? (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cloud Firestore Aktif
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Config Offline
                </span>
              )
            ) : (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-bold">
                Lokal (LocalStorage)
              </span>
            )}
          </div>
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-slate-50/50 px-6 border-t border-slate-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'analytics'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-analytics"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Dashboard Analisis</span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-5 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'ledger'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-ledger"
          >
            <Layers className="h-4 w-4" />
            <span>Laporan & Buku Pembantu</span>
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`px-5 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'access'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-access"
          >
            <Users className="h-4 w-4" />
            <span>Manajemen Akses Staff</span>
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <>
          {/* Calendar selector */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs text-slate-500 font-bold">Periode Laporan:</span>
            <div className="flex items-center bg-slate-100/80 border border-slate-200/80 rounded-full overflow-hidden p-1 pr-1.5 shadow-sm w-full sm:w-auto sm:max-w-[280px]">
              <div className="flex items-center gap-1.5 px-2.5 text-slate-500">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">Bulan Laporan:</span>
              </div>
              <div className="relative bg-white rounded-full border border-slate-100 shadow-inner px-3 py-1 flex items-center gap-1.5 min-w-[125px] justify-between flex-1 sm:flex-initial">
                <select
                  value={selectedMonthYearKey}
                  onChange={(e) => handleMonthYearChange(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="manager-month-year-select"
                >
                  <option value="all">Semua Bulan</option>
                  {availableMonths.map(item => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
                <span className="text-[10px] font-extrabold text-slate-800 truncate max-w-[100px]">
                  {selectedMonthYearLabel}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* KPI Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Produk Dibawa Staff</span>
                  <h3 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight mt-1">
                    {formatRupiah(stats.totalTaken)}
                  </h3>
                </div>
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                  <Briefcase className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2">
                Total produk terdistribusi bulan ini
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Sudah Disetor (IDR)</span>
                  <h3 className="text-xl font-extrabold text-emerald-600 font-sans tracking-tight mt-1">
                    {formatRupiah(stats.totalDeposited)}
                  </h3>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2 flex items-center gap-1">
                <span className="text-emerald-600 font-bold">
                  {stats.totalTaken > 0 ? ((stats.totalDeposited / stats.totalTaken) * 100).toFixed(1) : 0}%
                </span>
                <span>dari produk dibawa</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Nilai Produk Diretur</span>
                  <h3 className="text-xl font-extrabold text-blue-600 font-sans tracking-tight mt-1">
                    {formatRupiah(stats.totalReturned)}
                  </h3>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                  <RotateCcw className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2">
                Produk rusak / kedaluwarsa ditarik
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Sisa Tagihan Outstanding</span>
                  <h3 className="text-xl font-extrabold text-red-600 font-sans tracking-tight mt-1">
                    {formatRupiah(stats.outstandingBill)}
                  </h3>
                </div>
                <div className="p-2.5 bg-red-50 rounded-xl text-red-600 border border-red-100">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2">
                Piutang yang wajib ditagihkan
              </p>
            </div>
          </div>

          {/* Recharts Graphical Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="charts-row">
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    {selectedMonth === 'all' ? 'Aktivitas Distribusi & Setoran Bulanan' : 'Aktivitas Distribusi & Setoran Harian'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedMonth === 'all' ? 'Visualisasi perbandingan pengambilan produk dengan setoran uang masuk bulanan.' : 'Visualisasi perbandingan pengambilan produk dengan setoran uang masuk harian.'}
                  </p>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold uppercase font-mono border border-indigo-100">
                  {selectedMonth === 'all' ? 'Semua Bulan' : `${IndonesianMonths[selectedMonth - 1]} ${selectedYear}`}
                </span>
              </div>

              <div className="h-72 w-full">
                {filteredTransactions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <p>
                      {selectedMonth === 'all' ? 'Tidak ada transaksi tercatat' : `Tidak ada transaksi pada bulan ${IndonesianMonths[selectedMonth - 1]} ${selectedYear}`}
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIntake" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.8} />
                      <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis 
                        stroke="#94A3B8" 
                        fontSize={10} 
                        tickLine={false}
                        tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${v/1000}k` : v} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                        labelStyle={{ color: '#64748b', fontWeight: 'bold', fontSize: '11px' }}
                        itemStyle={{ fontSize: '12px', color: '#0f172a' }}
                        formatter={(v: any) => [formatRupiah(Number(v)), '']}
                        labelFormatter={(label) => selectedMonth === 'all' ? `Periode ${label}` : `Tanggal ${label} ${IndonesianMonths[selectedMonth - 1]}`}
                      />
                      <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                      <Area type="monotone" name="Produk Dibawa" dataKey="Intake" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorIntake)" />
                      <Area type="monotone" name="Setoran Uang" dataKey="Deposit" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorDeposit)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 mb-1">Proporsi Status Tagihan</h2>
                <p className="text-xs text-slate-500 font-sans">Rincian penyerapan produk yang dibawa sales bulan ini.</p>
              </div>

              <div className="h-52 w-full flex items-center justify-center my-4">
                {stats.totalTaken === 0 ? (
                  <div className="text-slate-400 text-xs text-center p-4">
                    Tidak ada data produk dibawa untuk dianalisis.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                        itemStyle={{ fontSize: '12px', color: '#0f172a' }}
                        formatter={(v: any) => [formatRupiah(Number(v)), '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                {pieChartData.map((d, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                      <span>{d.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">
                      {stats.totalTaken > 0 ? `${((d.value / stats.totalTaken) * 100).toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Leaderboard & Expiry Warning */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="details-row">
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-800">Rincian Tagihan & Kinerja Per Staff</h2>
                <p className="text-xs text-slate-500 mt-0.5">Urutan staff berdasarkan nominal tagihan outstanding tertinggi.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5">Nama Staff</th>
                      <th className="py-2.5 text-right">Produk Dibawa</th>
                      <th className="py-2.5 text-right">Uang Disetor</th>
                      <th className="py-2.5 text-right">Retur</th>
                      <th className="py-2.5 text-right">Sisa Tagihan</th>
                      <th className="py-2.5 text-right">Rasio Bayar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {staffSummaries.map((s) => {
                      const netBillable = s.totalTaken - s.totalReturned;
                      const ratio = netBillable > 0 ? (s.totalDeposited / netBillable) * 100 : 100;

                      return (
                        <tr key={s.staffId} className="hover:bg-slate-50/55 transition-colors">
                          <td className="py-3 font-semibold text-slate-900">{s.staffName}</td>
                          <td className="py-3 text-right">{formatRupiah(s.totalTaken)}</td>
                          <td className="py-3 text-right text-emerald-600 font-medium">{formatRupiah(s.totalDeposited)}</td>
                          <td className="py-3 text-right text-blue-600 font-medium">{formatRupiah(s.totalReturned)}</td>
                          <td className="py-3 text-right text-red-600 font-bold">{formatRupiah(s.outstandingBill)}</td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                              ratio >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              ratio >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                              {ratio.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-800">Alert Manajemen Stok & Kedaluwarsa</h2>
                <p className="text-xs text-slate-500 mt-0.5">Produk yang membutuhkan perhatian manajer (Stok tipis / kedaluwarsa &lt; 3 bulan).</p>
              </div>

              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {inventoryWarnings.length === 0 ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-xs text-emerald-700 font-semibold">
                    Semua produk dalam kondisi aman dan kedaluwarsa terkendali.
                  </div>
                ) : (
                  inventoryWarnings.map((warning, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border flex gap-2.5 ${
                        warning.type === 'both' ? 'bg-red-50 border-red-200 text-red-700' :
                        warning.type === 'expiry' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <AlertTriangle className={`h-4.5 w-4.5 shrink-0 ${
                        warning.type === 'both' ? 'text-red-500' : 'text-amber-500'
                      }`} />
                      <div className="text-xs">
                        <p className="font-bold text-slate-800">{warning.product.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{warning.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'ledger' ? (
        /* PRODUCT LEDGER SECTION (Buku Pembantu Per Produk) */
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 animate-fade-in" id="manager-product-ledger-section">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-500" />
                Laporan & Buku Pembantu Per Produk
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian riwayat pengambilan (Distribusi) vs penyelesaian (Setoran & Retur) per staff dan produk.
              </p>
            </div>
            
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 text-slate-800">
              {/* Staff Selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-400 whitespace-nowrap font-sans">Nama Staff:</span>
                <div className="relative w-full sm:w-52">
                  <select
                    value={activeLedgerStaffId}
                    onChange={(e) => setLedgerStaffId(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-850 text-xs rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer pr-10 font-sans"
                    id="manager-ledger-staff-selector"
                  >
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.id})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Product Selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-400 whitespace-nowrap font-sans">Pilih Produk:</span>
                <div className="relative w-full sm:w-52">
                  <select
                    value={activeLedgerProductId}
                    onChange={(e) => setLedgerProductId(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-850 text-xs rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer pr-10 font-sans"
                    id="manager-ledger-product-selector"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {activeLedgerStaff && activeLedgerProduct ? (
            <div className="space-y-6">
              {/* Product Ledger Summary Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] bg-amber-200/60 text-amber-800 font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                      Produk Terpilih
                    </span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                      Staff: {activeLedgerStaff.name}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-1.5 font-sans">{activeLedgerProduct.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-sans">Satuan: <span className="font-bold">{activeLedgerProduct.unit}</span> • Harga Satuan Default: <span className="font-bold">{formatRupiah(activeLedgerProduct.price)}</span></p>
                </div>
                <div className="text-left sm:text-right font-sans">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Sisa Kewajiban Tagihan Produk Ini</span>
                  <span className={`text-lg font-black block mt-0.5 ${ledgerHistoryData.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {ledgerHistoryData.balance > 0 ? formatRupiah(ledgerHistoryData.balance) : 'LUNAS / TIDAK ADA TAGIHAN'}
                  </span>
                </div>
              </div>

              {/* Split Tables Container */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* LEFT SIDE: DISTRIBUSI (D) */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-yellow-400 text-slate-900 font-black text-center py-2 text-xs uppercase tracking-wider border-b border-slate-200">
                    DISTRIBUSI (DEBIT / AMBIL)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px] font-sans text-slate-850">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-center">
                          <th className="py-2.5 px-2 border-r border-slate-200 w-10">NO</th>
                          <th className="py-2.5 px-2 border-r border-slate-200">TGL / BLN</th>
                          <th className="py-2.5 px-2 border-r border-slate-200">ADMINISTRATOR</th>
                          <th className="py-2.5 px-2 border-r border-slate-200 w-12 text-right">QTY</th>
                          <th className="py-2.5 px-2 border-r border-slate-200 text-right">HARGA</th>
                          <th className="py-2.5 px-2 border-r border-slate-200 text-right">JUMLAH</th>
                          <th className="py-2.5 px-2">KETERANGAN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {ledgerHistoryData.debitList.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                              Tidak ada data pengambilan untuk produk ini oleh {activeLedgerStaff.name}.
                            </td>
                          </tr>
                        ) : (
                          ledgerHistoryData.debitList.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 text-center">
                              <td className="py-2 px-2 border-r border-slate-200 font-medium text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-2 border-r border-slate-200 text-slate-600 font-mono">
                                {new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-')}
                              </td>
                              <td className="py-2 px-2 border-r border-slate-200 text-slate-800 text-left font-semibold truncate max-w-[100px]">{item.adminName}</td>
                              <td className="py-2 px-2 border-r border-slate-200 text-right font-bold text-slate-900">{item.quantity}</td>
                              <td className="py-2 px-2 border-r border-slate-200 text-right text-slate-500">{formatRupiah(item.price)}</td>
                              <td className="py-2 px-2 border-r border-slate-200 text-right font-bold text-slate-800">{formatRupiah(item.total)}</td>
                              <td className="py-2 px-2 text-left text-slate-500 truncate max-w-[120px]" title={item.notes}>{item.notes || '-'}</td>
                            </tr>
                          ))
                        )}
                        {/* Empty rows to mimic spreadsheet feel (min 3 rows) */}
                        {ledgerHistoryData.debitList.length < 3 && 
                          Array.from({ length: 3 - ledgerHistoryData.debitList.length }).map((_, i) => (
                            <tr key={`empty-debit-${i}`} className="h-8">
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td></td>
                            </tr>
                          ))
                        }
                        {/* Total Row */}
                        <tr className="bg-yellow-100 font-bold border-t-2 border-slate-300 text-center">
                          <td colSpan={3} className="py-2 px-2 text-right border-r border-slate-200">TOTAL DISTRIBUSI (D):</td>
                          <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-900">{ledgerHistoryData.totalDebitQty}</td>
                          <td className="py-2 px-2 border-r border-slate-200"></td>
                          <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-850 font-mono">{formatRupiah(ledgerHistoryData.totalDebitAmount)}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT SIDE: KREDIT (K) */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-yellow-400 text-slate-900 font-black text-center py-2 text-xs uppercase tracking-wider border-b border-slate-200">
                    REALISASI (KREDIT / SETORAN & RETUR)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px] font-sans text-slate-850">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-center">
                          <th className="py-2.5 px-2 border-r border-slate-200">TGL / BLN</th>
                          <th className="py-2.5 px-2 border-r border-slate-200 w-12 text-right">QTY</th>
                          <th className="py-2.5 px-2 border-r border-slate-200 text-right">HARGA</th>
                          <th className="py-2.5 px-2 border-r border-slate-200 text-right">JUMLAH</th>
                          <th className="py-2.5 px-2 border-r border-slate-200">KETERANGAN</th>
                          <th className="py-2.5 px-2">NOTED</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {ledgerHistoryData.creditList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                              Belum ada realisasi setoran atau retur untuk produk ini.
                            </td>
                          </tr>
                        ) : (
                          ledgerHistoryData.creditList.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 text-center">
                              <td className="py-2 px-2 border-r border-slate-200 text-slate-600 font-mono">
                                {new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-')}
                              </td>
                              <td className="py-2 px-2 border-r border-slate-200 text-right font-bold text-slate-900">{item.quantity}</td>
                              <td className="py-2 px-2 border-r border-slate-200 text-right text-slate-500">{formatRupiah(item.price)}</td>
                              <td className="py-2 px-2 border-r border-slate-200 text-right font-bold text-slate-800">{formatRupiah(item.total)}</td>
                              <td className="py-2 px-2 border-r border-slate-200">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  item.type === TransactionType.RETURN 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}>
                                  {item.type === TransactionType.RETURN ? 'Retur' : 'Setor'}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-left text-slate-500 truncate max-w-[120px]" title={item.notes}>{item.notes}</td>
                            </tr>
                          ))
                        )}
                        {/* Empty rows to mimic spreadsheet feel (min 3 rows) */}
                        {ledgerHistoryData.creditList.length < 3 && 
                          Array.from({ length: 3 - ledgerHistoryData.creditList.length }).map((_, i) => (
                            <tr key={`empty-credit-${i}`} className="h-8">
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td></td>
                            </tr>
                          ))
                        }
                        {/* Total Row */}
                        <tr className="bg-yellow-100 font-bold border-t-2 border-slate-300 text-center">
                          <td className="py-2 px-2 text-right border-r border-slate-200">TOTAL REKONSILIASI (K):</td>
                          <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-900">{ledgerHistoryData.totalCreditQty}</td>
                          <td className="py-2 px-2 border-r border-slate-200"></td>
                          <td className="py-2 px-2 text-right border-r border-slate-200 text-emerald-750 font-mono">{formatRupiah(ledgerHistoryData.totalCreditAmount)}</td>
                          <td className="py-2 px-2 border-r border-slate-200"></td>
                          <td className="py-2 px-2 text-center text-white text-[10px]">
                            {ledgerHistoryData.balance > 0 ? (
                              <span className="bg-rose-600 px-2 py-1 rounded font-black block font-mono">
                                ({formatRupiah(ledgerHistoryData.balance)})
                              </span>
                            ) : (
                              <span className="bg-emerald-600 px-2 py-1 rounded font-black block">
                                -
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Bottom Meta Boxes (Pending Bayar & Perbandingan Ratio) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-sans text-white">
                <div className="flex items-center justify-between bg-emerald-500 p-3.5 rounded-xl border border-emerald-600 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider">Pending Bayar (Sisa Selisih)</span>
                  <span className="font-mono font-black text-sm">
                    {ledgerHistoryData.balance > 0 ? formatRupiah(ledgerHistoryData.balance) : '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-emerald-500 p-3.5 rounded-xl border border-emerald-600 shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="text-center border-r border-emerald-400/50 pr-4">
                      <span className="text-[9px] block text-emerald-100 uppercase font-bold">AR (Ambil)</span>
                      <span className="text-sm font-black font-mono">{ledgerPerbandinganLabel.ar}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] block text-emerald-100 uppercase font-bold">SETOR (Realisasi)</span>
                      <span className="text-sm font-black font-mono">{ledgerPerbandinganLabel.setor}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-emerald-100 uppercase block font-bold">PERBANDINGAN</span>
                    <span className="text-sm font-black bg-emerald-600/60 px-2.5 py-0.5 rounded-lg border border-emerald-400/40 font-mono">
                      {ledgerPerbandinganLabel.ar} : {ledgerPerbandinganLabel.setor}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Pilih staff dan produk terlebih dahulu untuk memuat buku pembantu.
            </div>
          )}
        </div>
      ) : (
        /* ACCESS AND USER CREDENTIALS MANAGEMENT PANEL */
        <div className="space-y-6 animate-fade-in" id="access-management-panel">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Cari nama, email, role..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs transition-all font-medium"
                id="user-search-input"
              />
            </div>

            {/* Create Account Button */}
            <button
              onClick={handleOpenAddModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto justify-center shadow-sm"
              id="btn-create-user"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Pengguna Baru</span>
            </button>
          </div>

          {/* User Accounts Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-5">Nama & Profil</th>
                    <th className="py-3 px-4">Kontak Email</th>
                    <th className="py-3 px-4">No. HP</th>
                    <th className="py-3 px-4">Kata Sandi</th>
                    <th className="py-3 px-4">Role Akses</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-5 text-center">Aksi / Kontrol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                        Tidak ada pengguna yang cocok dengan kriteria pencarian Anda.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                        {/* Profile Info */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366F1&color=fff`}
                              alt={user.name}
                              className={`w-9 h-9 rounded-xl object-cover border border-slate-200/60 ${
                                user.status === 'inactive' ? 'grayscale opacity-60' : ''
                              }`}
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">{user.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {user.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 font-medium text-slate-600">{user.email}</td>

                        {/* Phone */}
                        <td className="py-3.5 px-4 font-mono text-slate-500">{user.phone || '-'}</td>

                        {/* Password */}
                        <td className="py-3.5 px-4 font-mono text-slate-600 bg-slate-50/30 font-semibold">{user.password || '123456'}</td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            user.role === UserRole.MANAGER ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            user.role === UserRole.ADMIN ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {user.role}
                          </span>
                        </td>

                        {/* Toggle Status (Clickable status badge) */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer border flex items-center gap-1.5 transition-colors ${
                              user.status !== 'inactive' 
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            }`}
                            title={user.status !== 'inactive' ? "Klik untuk Menolak Akses / Suspend" : "Klik untuk Berikan Akses / Aktifkan"}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status !== 'inactive' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            <span>{user.status !== 'inactive' ? 'Aktif (Active)' : 'Nonaktif (Suspended)'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Toggle Suspend Button Shortcut */}
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                                user.status !== 'inactive'
                                  ? 'bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border-slate-200 text-slate-500'
                                  : 'bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 border-slate-200 text-slate-500'
                              }`}
                              title={user.status !== 'inactive' ? "Bekukan Akses (Suspend)" : "Aktifkan Akses"}
                            >
                              {user.status !== 'inactive' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Edit Profil Pengguna"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete Button (Do not allow deleting manager themselves) */}
                            <button
                              onClick={() => handleDeleteUserClick(user.id, user.name)}
                              disabled={user.id === 'manager-1'}
                              className={`p-1.5 rounded-lg transition-colors border ${
                                user.id === 'manager-1'
                                  ? 'bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed'
                                  : 'bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border-slate-200 text-slate-600 cursor-pointer'
                              }`}
                              title="Hapus Akun Pengguna"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* MODAL WINDOW FOR ADDING AND EDITING USERS */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold tracking-tight">
                  {editingUser ? 'Perbarui Profil Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex gap-2 items-center">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ID input (Disabled on Edit) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ID Pengguna (Username/Unique ID)</label>
                <input
                  type="text"
                  placeholder="Contoh: sales-3 (Biarkan kosong untuk auto-generate)"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  disabled={!!editingUser}
                  className="w-full bg-slate-50 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium font-mono"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap staff..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alamat Email</label>
                <input
                  type="email"
                  placeholder="contoh: budi.santoso@sales.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kata Sandi (Password untuk Login)</label>
                <input
                  type="text"
                  placeholder="Masukkan password akun..."
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">No. Handphone</label>
                  <input
                    type="text"
                    placeholder="Contoh: 0812-xxxx-xxxx"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hak Akses (Role)</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                  >
                    <option value={UserRole.STAFF}>Staff Lapangan (Sales)</option>
                    <option value={UserRole.ADMIN}>Administrator Gudang</option>
                    <option value={UserRole.MANAGER}>Manajer Eksekutif</option>
                  </select>
                </div>
              </div>

              {/* Status & Custom Avatar */}
              <div className="grid grid-cols-2 gap-4">
                {/* Status Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Keaktifan</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormStatus('active')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        formStatus === 'active'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Aktif (Active)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus('inactive')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        formStatus === 'inactive'
                          ? 'bg-rose-50 border-rose-400 text-rose-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Suspend (Blok)
                    </button>
                  </div>
                </div>

                {/* Avatar Field */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Custom Avatar URL (Opsional)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formAvatar}
                    onChange={(e) => setFormAvatar(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingUser ? 'Perbarui Akses' : 'Buat Akun Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
