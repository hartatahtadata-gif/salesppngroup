import React, { useState, useMemo } from 'react';
import { Product, Transaction, TransactionType, User, TransactionItem } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  DollarSign, 
  ArrowUpRight, 
  RotateCcw, 
  Check, 
  Search, 
  ShoppingBag, 
  UserCheck, 
  Calendar,
  Layers,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  products: Product[];
  transactions: Transaction[];
  users: User[];
  currentAdmin: User;
  onUpdateProducts: (updatedProducts: Product[]) => void;
  onAddTransaction: (newTransaction: Transaction) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onEditTransaction: (editedTransaction: Transaction) => void;
}

export default function AdminPanel({ 
  products, 
  transactions, 
  users, 
  currentAdmin,
  onUpdateProducts,
  onAddTransaction,
  onDeleteProduct,
  onDeleteTransaction,
  onEditTransaction
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'record' | 'history'>('products');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth() + 1); // 1-12 or 'all'
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

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

  const [productSearch, setProductSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');

  // Product form states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodId, setProdId] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodStock, setProdStock] = useState<number>(0);
  const [prodUnit, setProdUnit] = useState('Box');
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodExpiry, setProdExpiry] = useState('');
  const [formError, setFormError] = useState('');

  // Transaction form states
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedTxType, setSelectedTxType] = useState<TransactionType>(TransactionType.INTAKE);
  const [txDate, setTxDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [txNotes, setTxNotes] = useState('');
  
  // States for deposit by product
  const [selectedDepositProductId, setSelectedDepositProductId] = useState<string>('');
  const [depositProductQty, setDepositProductQty] = useState<number>(1);
  const [depositProductPrice, setDepositProductPrice] = useState<number>(0);
  const [depositCartItems, setDepositCartItems] = useState<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    unit: string;
    total: number;
  }[]>([]);
  
  // Transaction items for Intake and Return
  const [cartItems, setCartItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [txError, setTxError] = useState('');
  const [txSuccess, setTxSuccess] = useState('');

  // Edit Transaction states
  const [showEditTxModal, setShowEditTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editTxNotes, setEditTxNotes] = useState('');
  const [editTxDate, setEditTxDate] = useState('');
  const [editTxAmount, setEditTxAmount] = useState<number>(0);
  const [editTxItems, setEditTxItems] = useState<TransactionItem[]>([]);
  const [editTxError, setEditTxError] = useState('');

  const staffUsers = useMemo(() => users.filter(u => u.role === 'staff'), [users]);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.id.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  // Total stock inventory value
  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock * p.price), 0);
  }, [products]);

  // Calculate undeposited products for the selected staff
  const undepositedProductsOfSelectedStaff = useMemo(() => {
    if (!selectedStaffId) return [];
    
    const taken: { [id: string]: number } = {};
    const returned: { [id: string]: number } = {};
    const deposited: { [id: string]: number } = {};
    
    // Look at all transactions for this staff
    const staffTxs = transactions.filter(t => t.staffId === selectedStaffId);
    
    staffTxs.forEach(tx => {
      if (tx.type === TransactionType.INTAKE && tx.items) {
        tx.items.forEach(it => {
          taken[it.productId] = (taken[it.productId] || 0) + it.quantity;
        });
      } else if (tx.type === TransactionType.RETURN && tx.items) {
        tx.items.forEach(it => {
          returned[it.productId] = (returned[it.productId] || 0) + it.quantity;
        });
      } else if (tx.type === TransactionType.DEPOSIT && tx.items) {
        tx.items.forEach(it => {
          deposited[it.productId] = (deposited[it.productId] || 0) + it.quantity;
        });
      }
    });
    
    return products.map(p => {
      const tQty = taken[p.id] || 0;
      const rQty = returned[p.id] || 0;
      const dQty = deposited[p.id] || 0;
      const unpaidQty = tQty - rQty - dQty;
      return {
        ...p,
        unpaidQty
      };
    }).filter(p => p.unpaidQty > 0);
  }, [selectedStaffId, transactions, products]);

  // Product CRUD Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdId(`PRD-${String(products.length + 1).padStart(2, '0')}`);
    setProdName('');
    setProdStock(0);
    setProdUnit('Box');
    setProdPrice(0);
    setProdExpiry(new Date().toISOString().split('T')[0]);
    setFormError('');
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdId(p.id);
    setProdName(p.name);
    setProdStock(p.stock);
    setProdUnit(p.unit);
    setProdPrice(p.price);
    setProdExpiry(p.expiryDate);
    setFormError('');
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodId || !prodName || prodStock < 0 || prodPrice <= 0 || !prodExpiry) {
      setFormError('Semua kolom wajib diisi dengan nilai yang valid.');
      return;
    }

    if (!editingProduct && products.some(p => p.id === prodId)) {
      setFormError('ID Produk sudah digunakan. Silakan buat ID unik.');
      return;
    }

    const newProduct: Product = {
      id: prodId.trim(),
      name: prodName.trim(),
      stock: Number(prodStock),
      unit: prodUnit.trim(),
      price: Number(prodPrice),
      expiryDate: prodExpiry
    };

    let updatedList: Product[];
    if (editingProduct) {
      updatedList = products.map(p => p.id === editingProduct.id ? newProduct : p);
    } else {
      updatedList = [...products, newProduct];
    }

    onUpdateProducts(updatedList);
    setShowProductModal(false);
  };

  // Cart Management for logging Intake/Return
  const handleAddToCart = (productId: string) => {
    const existing = cartItems.find(item => item.productId === productId);
    if (existing) {
      setCartItems(cartItems.map(item => 
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems([...cartItems, { productId, quantity: 1 }]);
    }
    setTxError('');
  };

  const handleUpdateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCartItems(cartItems.filter(item => item.productId !== productId));
    } else {
      setCartItems(cartItems.map(item => 
        item.productId === productId ? { ...item, quantity: qty } : item
      ));
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.productId !== productId));
  };

  const handleAddDepositCartItem = (productId: string, quantity: number, customPrice?: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const unpaidProd = undepositedProductsOfSelectedStaff.find(p => p.id === productId);
    const maxQty = unpaidProd ? unpaidProd.unpaidQty : 0;

    // Check if item already exists in deposit cart
    const existing = depositCartItems.find(it => it.productId === productId);
    const existingQty = existing ? existing.quantity : 0;
    const newQty = existingQty + quantity;

    if (newQty > maxQty) {
      setTxError(`Kuantitas melebihi sisa yang belum disetor (${maxQty} ${product.unit}).`);
      return;
    }

    const priceToUse = customPrice !== undefined ? customPrice : product.price;

    let updatedCart;
    if (existing) {
      updatedCart = depositCartItems.map(it => 
        it.productId === productId 
          ? { ...it, quantity: newQty, price: priceToUse, total: newQty * priceToUse } 
          : it
      );
    } else {
      updatedCart = [
        ...depositCartItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: quantity,
          price: priceToUse,
          unit: product.unit,
          total: quantity * priceToUse
        }
      ];
    }

    setDepositCartItems(updatedCart);
    
    // Auto-update deposit amount
    const newTotal = updatedCart.reduce((sum, item) => sum + item.total, 0);
    setDepositAmount(newTotal);
    
    // Reset selection
    setSelectedDepositProductId('');
    setDepositProductQty(1);
    setTxError('');
  };

  const handleRemoveDepositCartItem = (productId: string) => {
    const updatedCart = depositCartItems.filter(it => it.productId !== productId);
    setDepositCartItems(updatedCart);
    const newTotal = updatedCart.reduce((sum, item) => sum + item.total, 0);
    setDepositAmount(newTotal);
  };

  // Transaction logging submit
  const handleLogTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setTxError('');
    setTxSuccess('');

    if (!selectedStaffId) {
      setTxError('Silakan pilih staff penjualan terlebih dahulu.');
      return;
    }

    const staffUser = users.find(u => u.id === selectedStaffId);
    if (!staffUser) return;

    if (selectedTxType === TransactionType.DEPOSIT) {
      if (depositAmount <= 0) {
        setTxError('Nominal setoran harus lebih besar dari Rp 0.');
        return;
      }

      const newTx: Transaction = {
        id: `TX-${Date.now().toString().slice(-6)}`,
        type: TransactionType.DEPOSIT,
        date: new Date().toISOString(),
        staffId: staffUser.id,
        staffName: staffUser.name,
        adminId: currentAdmin.id,
        adminName: currentAdmin.name,
        amount: Number(depositAmount),
        items: depositCartItems.length > 0 ? depositCartItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: item.total
        })) : undefined,
        notes: txNotes.trim() || (depositCartItems.length > 0 
          ? `Setoran produk: ${depositCartItems.map(it => `${it.productName} (${it.quantity} ${it.unit})`).join(', ')}`
          : 'Setoran tunai harian')
      };

      onAddTransaction(newTx);
      setTxSuccess(`Setoran sebesar ${formatRupiah(depositAmount)} oleh ${staffUser.name} berhasil dicatat.`);
      setDepositAmount(0);
      setTxNotes('');
      setDepositCartItems([]);
      setSelectedDepositProductId('');
      setDepositProductQty(1);
    } else {
      // Intake or Return
      if (cartItems.length === 0) {
        setTxError('Silakan tambahkan minimal satu produk ke daftar transaksi.');
        return;
      }

      // Validate stock levels if Intake
      if (selectedTxType === TransactionType.INTAKE) {
        for (const cartItem of cartItems) {
          const product = products.find(p => p.id === cartItem.productId);
          if (!product) continue;
          if (product.stock < cartItem.quantity) {
            setTxError(`Stok tidak mencukupi untuk "${product.name}". Stok gudang: ${product.stock}, diminta: ${cartItem.quantity}.`);
            return;
          }
        }
      }

      // Build items array
      const itemsList: TransactionItem[] = cartItems.map(cartItem => {
        const product = products.find(p => p.id === cartItem.productId)!;
        return {
          productId: product.id,
          productName: product.name,
          quantity: cartItem.quantity,
          unit: product.unit,
          price: product.price,
          total: cartItem.quantity * product.price
        };
      });

      let transactionDate = new Date().toISOString();
      if (selectedTxType === TransactionType.INTAKE && txDate) {
        try {
          const parsed = new Date(txDate);
          const now = new Date();
          parsed.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
          transactionDate = parsed.toISOString();
        } catch (e) {
          console.error("Failed to parse custom transaction date:", e);
        }
      }

      const newTx: Transaction = {
        id: `TX-${Date.now().toString().slice(-6)}`,
        type: selectedTxType,
        date: transactionDate,
        staffId: staffUser.id,
        staffName: staffUser.name,
        adminId: currentAdmin.id,
        adminName: currentAdmin.name,
        items: itemsList,
        notes: txNotes.trim()
      };

      // Apply product stock updates
      const updatedProducts = products.map(p => {
        const cartItem = cartItems.find(c => c.productId === p.id);
        if (cartItem) {
          const stockChange = selectedTxType === TransactionType.INTAKE ? -cartItem.quantity : cartItem.quantity;
          return { ...p, stock: Math.max(0, p.stock + stockChange) };
        }
        return p;
      });

      onUpdateProducts(updatedProducts);
      onAddTransaction(newTx);
      
      const totalVal = itemsList.reduce((acc, it) => acc + it.total, 0);
      const actionText = selectedTxType === TransactionType.INTAKE ? 'Pengambilan' : 'Retur';
      setTxSuccess(`${actionText} produk berhasil dicatat. Total nominal: ${formatRupiah(totalVal)}.`);
      
      setCartItems([]);
      setTxNotes('');
    }
  };

  const handleEditClick = (tx: Transaction) => {
    setEditingTx(tx);
    setEditTxNotes(tx.notes || '');
    try {
      const d = new Date(tx.date);
      const pad = (num: number) => String(num).padStart(2, '0');
      const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setEditTxDate(formattedDate);
    } catch {
      setEditTxDate('');
    }
    setEditTxAmount(tx.amount || 0);
    setEditTxItems(tx.items ? [...tx.items] : []);
    setEditTxError('');
    setShowEditTxModal(true);
  };

  const handleEditTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    if (editingTx.type === TransactionType.INTAKE) {
      for (const editItem of editTxItems) {
        const product = products.find(p => p.id === editItem.productId);
        const oldItem = editingTx.items?.find(it => it.productId === editItem.productId);
        const oldQty = oldItem ? oldItem.quantity : 0;
        const currentStock = product ? product.stock : 0;
        const availableStock = currentStock + oldQty;

        if (editItem.quantity > availableStock) {
          setEditTxError(`Stok tidak mencukupi untuk "${editItem.productName}". Maksimal diperbolehkan: ${availableStock}.`);
          return;
        }
      }
    }

    const updatedTx: Transaction = {
      ...editingTx,
      notes: editTxNotes.trim(),
      date: editTxDate ? new Date(editTxDate).toISOString() : editingTx.date,
      amount: editingTx.type === TransactionType.DEPOSIT ? editTxAmount : undefined,
      items: editingTx.type !== TransactionType.DEPOSIT ? editTxItems.map(item => ({
        ...item,
        total: item.quantity * item.price
      })) : undefined
    };

    onEditTransaction(updatedTx);
    setShowEditTxModal(false);
    setEditingTx(null);
  };

  const handleDeleteTxClick = (txId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini akan mengembalikan stok produk yang terpengaruh.')) {
      onDeleteTransaction(txId);
    }
  };

  // Search and filtered transactions
  const filteredHistory = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = 
        tx.staffName.toLowerCase().includes(historySearch.toLowerCase()) ||
        tx.adminName.toLowerCase().includes(historySearch.toLowerCase()) ||
        tx.id.toLowerCase().includes(historySearch.toLowerCase()) ||
        (tx.notes && tx.notes.toLowerCase().includes(historySearch.toLowerCase()));
      
      const matchType = txTypeFilter === 'all' || tx.type === txTypeFilter;

      const txDate = new Date(tx.date);
      const matchMonth = selectedMonth === 'all' || txDate.getMonth() + 1 === selectedMonth;
      const matchYear = selectedMonth === 'all' || txDate.getFullYear() === selectedYear;

      return matchSearch && matchType && matchMonth && matchYear;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, historySearch, txTypeFilter, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6 animate-fade-in" id="admin-panel-view">
      {/* Upper header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-sans tracking-tight">Panel Administrasi Penjualan</h1>
          <p className="text-slate-500 text-xs mt-1">
            Selamat bekerja, <span className="text-indigo-600 font-semibold">{currentAdmin.name}</span>. Kelola katalog produk, catat pengambilan barang, setoran, dan retur staff.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          {/* Month & Year Selectors */}
          <div className="flex items-center bg-slate-100/80 border border-slate-200/80 rounded-full overflow-hidden p-1 pr-1.5 shadow-sm max-w-[280px] self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-2.5 text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">Bulan Laporan:</span>
            </div>
            <div className="relative bg-white rounded-full border border-slate-100 shadow-inner px-3 py-1 flex items-center gap-1.5 min-w-[125px] justify-between">
              <select
                value={selectedMonthYearKey}
                onChange={(e) => handleMonthYearChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="admin-month-year-select"
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

          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0 justify-around">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                activeTab === 'products' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              id="admin-tab-products"
            >
              Daftar Produk
            </button>
            <button
              onClick={() => { setActiveTab('record'); setTxError(''); setTxSuccess(''); }}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                activeTab === 'record' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              id="admin-tab-record"
            >
              Catat Transaksi
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              id="admin-tab-history"
            >
              Riwayat Log
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: PRODUCT DIRECTORY */}
      {activeTab === 'products' && (
        <div className="space-y-6" id="admin-tab-products-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Jenis SKU</span>
              <h3 className="text-2xl font-black text-slate-900 font-sans tracking-tight mt-1">{products.length} SKU</h3>
              <p className="text-[10px] text-slate-400 mt-2">Jumlah jenis produk terdaftar</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nilai Total Aset Stok</span>
              <h3 className="text-2xl font-black text-emerald-600 font-sans tracking-tight mt-1">{formatRupiah(totalInventoryValue)}</h3>
              <p className="text-[10px] text-slate-400 mt-2">Berdasarkan stok terdaftar * harga satuan</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex justify-end items-end">
              <button
                onClick={handleOpenAddProduct}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4.5 py-3 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer w-full md:w-auto justify-center shadow-sm"
                id="admin-add-product-btn"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Produk Baru</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-5">
              <h2 className="text-sm font-bold text-slate-800">Katalog Produk Terdaftar</h2>
              
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari ID atau nama produk..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-9 pr-4 py-2.5 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-slate-100"
                  id="admin-product-search"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3">ID Produk</th>
                    <th className="py-3">Nama Produk</th>
                    <th className="py-3">Expired Date</th>
                    <th className="py-3 text-right">Harga Satuan</th>
                    <th className="py-3 text-right">Stok Gudang</th>
                    <th className="py-3 text-right">Total Nilai</th>
                    <th className="py-3 pl-4">Satuan</th>
                    <th className="py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">Tidak ada produk ditemukan.</td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 font-mono font-bold text-indigo-600">{p.id}</td>
                        <td className="py-3 font-medium text-slate-950">{p.name}</td>
                        <td className="py-3 font-mono text-slate-500">{p.expiryDate}</td>
                        <td className="py-3 text-right">{formatRupiah(p.price)}</td>
                        <td className="py-3 text-right font-semibold">
                          <span className={p.stock <= 15 ? 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded' : ''}>{p.stock}</span>
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-900">
                          {formatRupiah(p.stock * p.price)}
                        </td>
                        <td className="py-3 text-slate-500 pl-4">{p.unit}</td>
                        <td className="py-3">
                          <div className="flex justify-center items-center gap-2">
                            <button
                               onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                              id={`edit-product-btn-${p.id}`}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
                              id={`delete-product-btn-${p.id}`}
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

      {/* TAB 2: RECORD TRANSACTION */}
      {activeTab === 'record' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="admin-tab-record-content">
          
          {/* Main logging form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 mb-4">Catat Pengambilan, Setoran atau Retur</h2>

              {txError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex gap-2 items-center text-xs" id="tx-error-alert">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <span>{txError}</span>
                </div>
              )}

              {txSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex gap-2 items-center text-xs" id="tx-success-alert">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{txSuccess}</span>
                </div>
              )}

              <form onSubmit={handleLogTransaction} className="space-y-4">
                
                {/* 1. Select Sales Staff */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pilih Staff Penjualan</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => { setSelectedStaffId(e.target.value); setTxError(''); setTxSuccess(''); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-100"
                    id="tx-staff-select"
                  >
                    <option value="">-- Pilih Staff --</option>
                    {staffUsers.map(staff => (
                      <option key={staff.id} value={staff.id}>{staff.name} ({staff.phone})</option>
                    ))}
                  </select>
                </div>

                {/* 2. Select Transaction Type */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipe Transaksi</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => { setSelectedTxType(TransactionType.INTAKE); setTxError(''); setTxSuccess(''); }}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        selectedTxType === TransactionType.INTAKE 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                      id="tx-type-intake"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      <span>Bawa Produk</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => { setSelectedTxType(TransactionType.DEPOSIT); setTxError(''); setTxSuccess(''); }}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        selectedTxType === TransactionType.DEPOSIT 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                      id="tx-type-deposit"
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Setor Uang</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSelectedTxType(TransactionType.RETURN); setTxError(''); setTxSuccess(''); }}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        selectedTxType === TransactionType.RETURN 
                          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                      id="tx-type-return"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Retur Barang</span>
                    </button>
                  </div>
                </div>

                {/* 2b. Tanggal untuk Bawa Produk */}
                {selectedTxType === TransactionType.INTAKE && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tanggal Bawa Produk</label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold font-mono"
                      id="tx-custom-date-input"
                      required
                    />
                  </div>
                )}

                {/* 3. Conditional: Deposit Amount vs Cart List */}
                {selectedTxType === TransactionType.DEPOSIT ? (
                  <div className="space-y-4">
                    {/* Select product from undeposited products */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Pilih Produk Belum Disetor (Opsional)
                      </label>
                      {!selectedStaffId ? (
                        <p className="text-[10px] text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                          Silakan pilih staff penjualan terlebih dahulu untuk memuat produk yang dibawa.
                        </p>
                      ) : undepositedProductsOfSelectedStaff.length === 0 ? (
                        <p className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          Staff ini tidak memiliki produk yang belum lunas/disetor saat ini.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <select
                              value={selectedDepositProductId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedDepositProductId(val);
                                setDepositProductQty(1);
                                setTxError('');
                                const prod = undepositedProductsOfSelectedStaff.find(p => p.id === val);
                                if (prod) {
                                  setDepositProductPrice(prod.price);
                                } else {
                                  setDepositProductPrice(0);
                                }
                              }}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-100"
                              id="deposit-product-select"
                            >
                              <option value="">-- Pilih Produk Belum Lunas --</option>
                              {undepositedProductsOfSelectedStaff.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (Sisa: {p.unpaidQty} {p.unit} - {formatRupiah(p.price)})
                                </option>
                              ))}
                            </select>
                          </div>

                          {selectedDepositProductId && (
                            <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/80 space-y-3">
                              {(() => {
                                const prod = undepositedProductsOfSelectedStaff.find(p => p.id === selectedDepositProductId);
                                if (!prod) return null;
                                return (
                                  <>
                                    <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                                      <span>Maksimal yang belum disetor:</span>
                                      <span className="font-bold text-slate-900">{prod.unpaidQty} {prod.unit}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Jumlah PCS yang Disetor</label>
                                        <input
                                          type="number"
                                          min={1}
                                          max={prod.unpaidQty}
                                          value={depositProductQty}
                                          onChange={(e) => {
                                            const val = Math.max(1, Math.min(prod.unpaidQty, Number(e.target.value)));
                                            setDepositProductQty(val);
                                          }}
                                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 font-bold"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Harga per PCS (Rp)</label>
                                        <input
                                          type="number"
                                          min={0}
                                          value={depositProductPrice}
                                          onChange={(e) => {
                                            setDepositProductPrice(Math.max(0, Number(e.target.value)));
                                          }}
                                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-200 font-bold font-mono"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center bg-white/50 p-2.5 rounded-lg border border-slate-200/50">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Nilai Setoran</span>
                                      <span className="text-sm font-black text-emerald-700 font-mono">{formatRupiah(depositProductQty * depositProductPrice)}</span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleAddDepositCartItem(selectedDepositProductId, depositProductQty, depositProductPrice)}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2 rounded-lg transition-colors cursor-pointer"
                                    >
                                      Tambahkan ke Setoran
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Deposit Cart Items List */}
                    {depositCartItems.length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detail Setoran Produk</span>
                          <button
                            type="button"
                            onClick={() => {
                              setDepositCartItems([]);
                              setDepositAmount(0);
                            }}
                            className="text-[10px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                          >
                            Bersihkan Semua
                          </button>
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {depositCartItems.map(item => (
                            <div key={item.productId} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 text-xs">
                              <div className="min-w-0 flex-1 pr-1">
                                <p className="font-semibold text-slate-800 truncate">{item.productName}</p>
                                <p className="text-[10px] text-slate-500">{item.quantity} {item.unit} x {formatRupiah(item.price)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{formatRupiah(item.total)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDepositCartItem(item.productId)}
                                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                  title="Hapus"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total Nominal Setoran */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Total Nominal Setoran (Rupiah)
                        </label>
                        {depositCartItems.length > 0 && (
                          <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-medium">
                            Terkunci: Otomatis dari produk terpilih
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        placeholder="Masukkan nilai setoran, misal: 1500000"
                        value={depositAmount || ''}
                        onChange={(e) => {
                          if (depositCartItems.length === 0) {
                            setDepositAmount(Number(e.target.value));
                            setTxError('');
                          }
                        }}
                        disabled={depositCartItems.length > 0}
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-slate-800 text-xs focus:outline-none focus:ring-2 ${
                          depositCartItems.length > 0 
                            ? 'bg-slate-100 border-slate-200 text-slate-500 font-bold' 
                            : 'bg-slate-50 border-slate-200 focus:ring-slate-100'
                        }`}
                        id="tx-deposit-amount"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Daftar Produk yang {selectedTxType === TransactionType.INTAKE ? 'Dibawa' : 'Diretur'}
                      </label>
                      <span className="text-[10px] text-slate-400">Pilih dari katalog di sebelah kanan</span>
                    </div>

                    {cartItems.length === 0 ? (
                      <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        Belum ada produk ditambahkan. Klik produk di katalog kanan untuk menambahkan.
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 max-h-56 overflow-y-auto">
                        {cartItems.map(item => {
                          const prod = products.find(p => p.id === item.productId);
                          if (!prod) return null;

                          return (
                            <div key={item.productId} className="flex justify-between items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-800 truncate">{prod.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{formatRupiah(prod.price)} / {prod.unit}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(item.productId, item.quantity - 1)}
                                  className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-mono font-bold text-slate-800">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(item.productId, item.quantity + 1)}
                                  className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded flex items-center justify-center font-bold"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromCart(item.productId)}
                                  className="text-red-500 hover:text-red-700 ml-2.5"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Cart Summary */}
                        <div className="border-t border-slate-200 pt-2.5 mt-2 flex justify-between items-center font-bold text-slate-800 text-xs">
                          <span>Estimasi Total:</span>
                          <span className={selectedTxType === TransactionType.INTAKE ? 'text-indigo-600' : 'text-blue-600'}>
                            {formatRupiah(cartItems.reduce((acc, c) => {
                              const p = products.find(pr => pr.id === c.productId);
                              return acc + (c.quantity * (p?.price || 0));
                            }, 0))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Keterangan / Catatan</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Pengiriman area Barat, retur kemasan rusak, setoran hasil penjualan tgl..."
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100 text-xs"
                    id="tx-notes-textarea"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full text-white font-bold py-3 rounded-xl transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                    selectedTxType === TransactionType.INTAKE ? 'bg-indigo-600 hover:bg-indigo-700' :
                    selectedTxType === TransactionType.DEPOSIT ? 'bg-emerald-600 hover:bg-emerald-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                  id="tx-submit-btn"
                >
                  <Check className="h-4 w-4" />
                  <span>Simpan Transaksi</span>
                </button>
              </form>
            </div>
          </div>

          {/* Catalog Quick Selector (5 cols) */}
          <div className="lg:col-span-5">
            {selectedTxType === TransactionType.DEPOSIT ? (
              !selectedStaffId ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm h-full flex flex-col justify-center items-center text-center">
                  <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 mb-4 border border-emerald-100">
                    <DollarSign className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Pencatatan Setoran Tunai</h3>
                  <p className="text-slate-500 text-xs max-w-xs mt-2 leading-relaxed">
                    Silakan pilih staff penjualan di sebelah kiri terlebih dahulu untuk melihat daftar produk bawaan mereka yang belum disetorkan uangnya.
                  </p>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[520px]">
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-800 text-sm">Produk Belum Disetor</h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Daftar produk yang dibawa oleh <span className="font-semibold text-indigo-600">{users.find(u => u.id === selectedStaffId)?.name}</span> namun belum dibayarkan/disetor uangnya.
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-sans">
                    {undepositedProductsOfSelectedStaff.length === 0 ? (
                      <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 h-full flex flex-col justify-center items-center">
                        <Check className="h-8 w-8 text-emerald-500 mb-2 bg-emerald-50 p-1.5 rounded-full" />
                        <span className="font-bold text-slate-700 mb-1">Semua Produk Lunas!</span>
                        <span className="text-slate-400">Tidak ada sisa produk yang belum disetor uangnya untuk staff ini.</span>
                      </div>
                    ) : (
                      undepositedProductsOfSelectedStaff.map(p => (
                        <div 
                          key={p.id} 
                          className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center text-xs group hover:border-emerald-300 transition-all"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                            <div className="flex flex-col gap-1 mt-1 text-[10px] text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-indigo-600">{p.id}</span>
                                <span>•</span>
                                <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Belum Setor: {p.unpaidQty} {p.unit}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span>Harga: {formatRupiah(p.price)}</span>
                                <span>•</span>
                                <span>Tagihan: <span className="font-bold text-slate-700">{formatRupiah(p.unpaidQty * p.price)}</span></span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDepositProductId(p.id);
                              setDepositProductQty(1);
                              setTxError('');
                            }}
                            className="bg-white group-hover:bg-emerald-600 group-hover:text-white border border-slate-200 group-hover:border-transparent text-slate-600 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center font-bold text-[10px] shrink-0"
                            title="Pilih untuk Disetor"
                          >
                            Setor
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col max-h-[600px]">
                <div className="mb-4">
                  <h3 className="font-bold text-slate-800 text-sm">Katalog Produk Cepat</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Klik tombol + untuk memasukkan produk ke daftar transaksi di kiri.</p>
                </div>

                <div className="relative mb-3.5">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari produk cepat..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 text-[11px] rounded-lg pl-8 pr-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-slate-100"
                    id="admin-catalog-quicksearch"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {filteredProducts.map(p => (
                    <div 
                      key={p.id} 
                      className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center text-xs group hover:border-slate-300 transition-all"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                          <span className="font-mono font-bold text-indigo-600">{p.id}</span>
                          <span>•</span>
                          <span className={p.stock <= 15 ? 'text-amber-600 font-medium' : ''}>Stok: {p.stock} {p.unit}</span>
                          <span>•</span>
                          <span>{formatRupiah(p.price)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(p.id)}
                        className="bg-white group-hover:bg-indigo-600 group-hover:text-white border border-slate-200 group-hover:border-transparent text-slate-600 p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                        id={`add-to-tx-${p.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTION LOG HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm" id="admin-tab-history-content">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3.5 mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Riwayat Catatan Transaksi</h2>
              <p className="text-xs text-slate-500 mt-0.5">Seluruh log riwayat bawa produk, setoran tunai, dan retur.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-100"
                id="tx-history-filter"
              >
                <option value="all">Semua Tipe</option>
                <option value={TransactionType.INTAKE}>Pengambilan Produk</option>
                <option value={TransactionType.DEPOSIT}>Setoran Tunai</option>
                <option value={TransactionType.RETURN}>Retur Produk</option>
              </select>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari staff, admin, ID, catatan..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-8 pr-3 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-slate-100"
                  id="admin-history-search"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada log transaksi ditemukan.
              </div>
            ) : (
              filteredHistory.map((tx) => {
                const totalTxAmount = tx.type === TransactionType.DEPOSIT 
                  ? tx.amount || 0 
                  : tx.items?.reduce((acc, it) => acc + it.total, 0) || 0;

                return (
                  <div key={tx.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col sm:flex-row justify-between gap-3.5 text-xs">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-mono font-bold text-indigo-600">{tx.id}</span>
                        <span className="text-slate-300">•</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === TransactionType.INTAKE ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          tx.type === TransactionType.DEPOSIT ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {tx.type === TransactionType.INTAKE ? 'Bawa Produk' :
                           tx.type === TransactionType.DEPOSIT ? 'Setoran Tunai' : 'Retur Barang'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 text-[10px] flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {new Date(tx.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="text-slate-700 font-medium">
                        Staff: <span className="text-slate-900 font-semibold">{tx.staffName}</span> 
                        <span className="text-slate-300 mx-1">|</span> 
                        Disetujui Admin: <span className="text-slate-600">{tx.adminName}</span>
                      </div>

                      {tx.items && tx.items.length > 0 && (
                        <div className="pl-3 border-l-2 border-slate-200 mt-2 space-y-1">
                          {tx.items.map((it, i) => (
                            <div key={i} className="text-slate-500 text-[11px] flex justify-between max-w-md">
                              <span>• {it.productName} ({it.quantity} {it.unit})</span>
                              <span>{formatRupiah(it.total)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {tx.notes && (
                        <div className="text-[10px] text-slate-500 italic mt-1 bg-white p-2 rounded-lg border border-slate-200/50">
                          Catatan: "{tx.notes}"
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col justify-between sm:justify-center items-end shrink-0 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 gap-2.5">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-400 text-[10px] sm:hidden">Total Nominal:</span>
                        <span className={`text-sm font-black ${
                          tx.type === TransactionType.INTAKE ? 'text-indigo-600' :
                          tx.type === TransactionType.DEPOSIT ? 'text-emerald-600' :
                          'text-blue-600'
                        }`}>
                          {formatRupiah(totalTxAmount)}
                        </span>
                      </div>

                      <div className="flex gap-1.5 mt-0.5">
                        <button
                          type="button"
                          onClick={() => handleEditClick(tx)}
                          className="p-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                          title="Edit Transaksi / Catatan"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTxClick(tx.id)}
                          className="p-1.5 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Transaksi (Kembalikan Stok)"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* PRODUCT MODAL (ADD / EDIT) */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 text-xs shadow-xl space-y-4 text-slate-800"
            >
              <h3 className="text-sm font-bold text-slate-900">
                {editingProduct ? 'Ubah Informasi Produk' : 'Tambah Produk Baru ke Katalog'}
              </h3>

              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex gap-1.5 items-center">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="space-y-3.5">
                <div className="grid grid-cols-3 gap-3.5">
                  <div className="col-span-1">
                    <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">ID SKU</label>
                    <input
                      type="text"
                      disabled={editingProduct !== null}
                      value={prodId}
                      onChange={(e) => setProdId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100 disabled:opacity-50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Nama Produk</label>
                    <input
                      type="text"
                      placeholder="Indomie Goreng, Aqua..."
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Jumlah Stok</label>
                    <input
                      type="number"
                      value={prodStock || 0}
                      onChange={(e) => setProdStock(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Satuan</label>
                    <select
                      value={prodUnit}
                      onChange={(e) => setProdUnit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100"
                    >
                      <option value="Pcs">Pcs</option>
                      <option value="Box">Box</option>
                      <option value="Karton">Karton</option>
                      <option value="Pack">Pack</option>
                      <option value="Renceng">Renceng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Harga (Rp)</label>
                    <input
                      type="number"
                      value={prodPrice || 0}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Expired Date</label>
                  <input
                    type="date"
                    value={prodExpiry}
                    onChange={(e) => setProdExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                {/* Estimate total value */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between font-bold text-slate-700">
                  <span>Estimasi Total Aset:</span>
                  <span className="text-emerald-600">{formatRupiah(prodStock * prodPrice)}</span>
                </div>

                <div className="flex gap-2.5 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer font-bold transition-colors"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TRANSACTION EDIT MODAL */}
      <AnimatePresence>
        {showEditTxModal && editingTx && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 text-xs shadow-xl space-y-4 text-slate-800"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Ubah Transaksi ({editingTx.id})
                </h3>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  editingTx.type === TransactionType.INTAKE ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                  editingTx.type === TransactionType.DEPOSIT ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {editingTx.type === TransactionType.INTAKE ? 'Bawa Produk' :
                   editingTx.type === TransactionType.DEPOSIT ? 'Setoran Tunai' : 'Retur Barang'}
                </span>
              </div>

              {editTxError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex gap-1.5 items-center">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{editTxError}</span>
                </div>
              )}

              <form onSubmit={handleEditTxSubmit} className="space-y-4">
                {/* Staff Name & Admin Info */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nama Staff</span>
                    <span className="text-xs font-semibold text-slate-800">{editingTx.staffName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Admin Penginput</span>
                    <span className="text-xs font-semibold text-slate-850">{editingTx.adminName}</span>
                  </div>
                </div>

                {/* Date & Time Field */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Tanggal & Waktu Transaksi</label>
                  <input
                    type="datetime-local"
                    value={editTxDate}
                    onChange={(e) => setEditTxDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100 font-medium"
                    required
                  />
                </div>

                {/* If DEPOSIT: amount input */}
                {editingTx.type === TransactionType.DEPOSIT && (
                  <div>
                    <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Jumlah Setoran (Rp)</label>
                    <input
                      type="number"
                      value={editTxAmount}
                      onChange={(e) => setEditTxAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100 font-bold text-xs"
                      required
                      min={100}
                    />
                  </div>
                )}

                {/* If INTAKE or RETURN: items quantity inputs */}
                {editingTx.type !== TransactionType.DEPOSIT && editTxItems.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-slate-500 font-bold uppercase tracking-wider text-[9px]">Kuantitas Item Produk</label>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                            <th className="p-2.5">Nama Produk</th>
                            <th className="p-2.5 text-right w-24">Jumlah</th>
                            <th className="p-2.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {editTxItems.map((item, index) => (
                            <tr key={item.productId}>
                              <td className="p-2.5 font-medium">{item.productName}</td>
                              <td className="p-2.5">
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newQty = Math.max(1, Number(e.target.value));
                                      const updated = [...editTxItems];
                                      updated[index] = { ...item, quantity: newQty };
                                      setEditTxItems(updated);
                                    }}
                                    className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-indigo-200 font-semibold"
                                  />
                                  <span className="text-[10px] text-slate-400">{item.unit}</span>
                                </div>
                              </td>
                              <td className="p-2.5 text-right font-semibold text-slate-850">
                                {formatRupiah(item.quantity * item.price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Notes Input */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[9px]">Catatan / Keterangan</label>
                  <textarea
                    rows={2}
                    value={editTxNotes}
                    onChange={(e) => setEditTxNotes(e.target.value)}
                    placeholder="Contoh: Pengambilan produk tambahan..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-100 font-medium"
                  />
                </div>

                {/* Estimate total value of transaction */}
                {editingTx.type !== TransactionType.DEPOSIT && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between font-bold text-slate-700">
                    <span>Estimasi Total Baru:</span>
                    <span className="text-indigo-600 font-black">
                      {formatRupiah(editTxItems.reduce((acc, it) => acc + (it.quantity * it.price), 0))}
                    </span>
                  </div>
                )}

                {/* Modal actions */}
                <div className="flex gap-2.5 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditTxModal(false);
                      setEditingTx(null);
                    }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer font-bold transition-colors"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
