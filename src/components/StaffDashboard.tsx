import React, { useState, useMemo } from 'react';
import { Product, Transaction, TransactionType, User, ApotikRecord } from '../types';
import { 
  Briefcase,
  RotateCcw,
  AlertCircle,
  Clock,
  Layers,
  TrendingUp,
  DollarSign,
  Inbox,
  Calendar,
  ChevronDown,
  Plus,
  Trash,
  Building,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { motion } from 'motion/react';

interface StaffDashboardProps {
  currentStaff: User;
  products: Product[];
  transactions: Transaction[];
  onAddTransaction: (newTransaction: Transaction) => void;
  onUpdateProducts: (updatedProducts: Product[]) => void;
  apotikRecords: ApotikRecord[];
  onAddApotikRecord: (record: ApotikRecord) => void;
  onDeleteApotikRecord: (recordId: string) => void;
}

export default function StaffDashboard({
  currentStaff,
  products,
  transactions,
  apotikRecords = [],
  onAddApotikRecord,
  onDeleteApotikRecord
}: StaffDashboardProps) {

  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth() + 1); // 1-12 or 'all'
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedLedgerProductId, setSelectedLedgerProductId] = useState<string>('');

  // Local state for Apotik Input Form
  const [namaApotik, setNamaApotik] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kabupaten, setKabupaten] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formJumlah, setFormJumlah] = useState<number>(1);
  const [formNilai, setFormNilai] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle selected product change
  const handleProductChange = (prodId: string) => {
    setFormProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setFormNilai(prod.price);
    } else {
      setFormNilai(0);
    }
  };

  // Initialize selected product
  React.useEffect(() => {
    if (products.length > 0 && !formProductId) {
      handleProductChange(products[0].id);
    }
  }, [products]);

  const handleSubmitApotik = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!namaApotik.trim()) {
      setErrorMsg('Nama apotik tidak boleh kosong');
      return;
    }
    if (!alamat.trim()) {
      setErrorMsg('Alamat apotik tidak boleh kosong');
      return;
    }
    if (!kecamatan.trim()) {
      setErrorMsg('Kecamatan tidak boleh kosong');
      return;
    }
    if (!kabupaten.trim()) {
      setErrorMsg('Kabupaten tidak boleh kosong');
      return;
    }
    if (!formProductId) {
      setErrorMsg('Silakan pilih produk');
      return;
    }
    if (formJumlah <= 0) {
      setErrorMsg('Jumlah harus lebih dari 0');
      return;
    }

    const prod = products.find(p => p.id === formProductId);
    if (!prod) {
      setErrorMsg('Produk tidak valid');
      return;
    }

    const newRecord: ApotikRecord = {
      id: 'APT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      namaApotik: namaApotik.trim(),
      alamat: alamat.trim(),
      kecamatan: kecamatan.trim(),
      kabupaten: kabupaten.trim(),
      productId: formProductId,
      productName: prod.name,
      jumlah: formJumlah,
      satuan: prod.unit,
      nilai: formNilai,
      total: formJumlah * formNilai,
      staffId: currentStaff.id,
      staffName: currentStaff.name,
      date: new Date().toISOString()
    };

    onAddApotikRecord(newRecord);
    
    // Partially reset the form: keep apotik details but reset items to make batch entries easier
    setFormJumlah(1);
    setSuccessMsg('Berhasil menyimpan data apotik!');
    
    // Auto clear success message after 3 seconds
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleResetForm = () => {
    setNamaApotik('');
    setAlamat('');
    setKecamatan('');
    setKabupaten('');
    setFormJumlah(1);
    if (products.length > 0) {
      handleProductChange(products[0].id);
    }
    setErrorMsg('');
    setSuccessMsg('');
  };

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === formProductId);
  }, [formProductId, products]);

  // Filter apotik records belonging to the current staff
  const personalApotikRecords = useMemo(() => {
    return apotikRecords
      .filter(r => r.staffId === currentStaff.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [apotikRecords, currentStaff.id]);

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

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Personal transactions history (unfiltered)
  const personalTransactions = useMemo(() => {
    return transactions
      .filter(tx => tx.staffId === currentStaff.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentStaff.id]);

  // Filtered personal transactions for selected Month & Year
  const filteredPersonalTransactions = useMemo(() => {
    return personalTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      const matchMonth = selectedMonth === 'all' || txDate.getMonth() + 1 === selectedMonth;
      const matchYear = selectedMonth === 'all' || txDate.getFullYear() === selectedYear;
      return matchMonth && matchYear;
    });
  }, [personalTransactions, selectedMonth, selectedYear]);

  // Personal ledger calculations
  const personalLedger = useMemo(() => {
    let totalTaken = 0;
    let totalDeposited = 0;
    let totalReturned = 0;

    filteredPersonalTransactions.forEach(tx => {
      if (tx.type === TransactionType.INTAKE) {
        tx.items?.forEach(item => { totalTaken += item.total; });
      } else if (tx.type === TransactionType.DEPOSIT) {
        totalDeposited += tx.amount || 0;
      } else if (tx.type === TransactionType.RETURN) {
        tx.items?.forEach(item => { totalReturned += item.total; });
      }
    });

    const outstandingBill = totalTaken - totalDeposited - totalReturned;
    const paymentProgress = totalTaken > 0 ? (totalDeposited / (totalTaken - totalReturned)) * 100 : 100;

    return {
      totalTaken,
      totalDeposited,
      totalReturned,
      outstandingBill,
      paymentProgress
    };
  }, [filteredPersonalTransactions]);

  // Lifetime ledger calculations (unfiltered by selected month/year) for current balance
  const lifetimeLedger = useMemo(() => {
    let totalTaken = 0;
    let totalDeposited = 0;
    let totalReturned = 0;

    personalTransactions.forEach(tx => {
      if (tx.type === TransactionType.INTAKE) {
        tx.items?.forEach(item => { totalTaken += item.total; });
      } else if (tx.type === TransactionType.DEPOSIT) {
        totalDeposited += tx.amount || 0;
      } else if (tx.type === TransactionType.RETURN) {
        tx.items?.forEach(item => { totalReturned += item.total; });
      }
    });

    const outstandingBill = totalTaken - totalDeposited - totalReturned;

    return {
      totalTaken,
      totalDeposited,
      totalReturned,
      outstandingBill
    };
  }, [personalTransactions]);

  // Calculate list of products currently carried by this staff (lifetime/real-time)
  const carriedProducts = useMemo(() => {
    const counts: { [productId: string]: { name: string; unit: string; price: number; quantity: number } } = {};

    personalTransactions.forEach(tx => {
      if (tx.type === TransactionType.INTAKE) {
        tx.items?.forEach(item => {
          if (!counts[item.productId]) {
            counts[item.productId] = {
              name: item.productName,
              unit: item.unit,
              price: item.price,
              quantity: 0
            };
          }
          counts[item.productId].quantity += item.quantity;
        });
      } else if (tx.type === TransactionType.RETURN) {
        tx.items?.forEach(item => {
          if (!counts[item.productId]) {
            counts[item.productId] = {
              name: item.productName,
              unit: item.unit,
              price: item.price,
              quantity: 0
            };
          }
          counts[item.productId].quantity -= item.quantity;
        });
      } else if (tx.type === TransactionType.DEPOSIT) {
        tx.items?.forEach(item => {
          if (!counts[item.productId]) {
            counts[item.productId] = {
              name: item.productName,
              unit: item.unit,
              price: item.price,
              quantity: 0
            };
          }
          counts[item.productId].quantity -= item.quantity;
        });
      }
    });

    return Object.keys(counts)
      .map(id => ({
        id,
        ...counts[id],
        totalValue: counts[id].quantity * counts[id].price
      }))
      .filter(item => item.quantity > 0);
  }, [personalTransactions]);

  // Sum total value of currently carried products
  const totalCarriedValue = useMemo(() => {
    return carriedProducts.reduce((acc, p) => acc + p.totalValue, 0);
  }, [carriedProducts]);

  // Active selected product for ledger (defaults to first product in list if none selected)
  const activeLedgerProductId = selectedLedgerProductId || (products.length > 0 ? products[0].id : '');
  const activeLedgerProduct = products.find(p => p.id === activeLedgerProductId);

  const productHistoryData = useMemo(() => {
    if (!activeLedgerProductId) {
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

    // Sort personal transactions by date ascending (oldest first to build running ledger)
    const sortedTxs = [...personalTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
  }, [personalTransactions, activeLedgerProductId]);

  const perbandinganLabel = useMemo(() => {
    const { totalDebitQty, totalCreditQty } = productHistoryData;
    if (totalDebitQty === 0 && totalCreditQty === 0) return { ar: 0, setor: 0 };
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };
    const divisor = gcd(totalDebitQty, totalCreditQty) || 1;
    return {
      ar: totalDebitQty / divisor,
      setor: totalCreditQty / divisor
    };
  }, [productHistoryData]);

  return (
    <div className="space-y-6 animate-fade-in" id="staff-dashboard-view">
      
      {/* Top Welcome Panel (With Action Buttons / Selectors) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <img 
            src={currentStaff.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
            alt={currentStaff.name} 
            className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
          />
          <div>
            <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-100 uppercase tracking-wider inline-block">Staff Penjualan</span>
            <h1 className="text-xl font-bold text-slate-900 font-sans tracking-tight mt-1.5">{currentStaff.name}</h1>
            <p className="text-slate-500 text-xs mt-0.5">{currentStaff.email} • {currentStaff.phone}</p>
          </div>
        </div>
        
        <div className="flex items-center bg-slate-100/80 border border-slate-200/80 rounded-full overflow-hidden p-1 pr-1.5 shadow-sm w-full md:w-auto md:max-w-[280px]">
          <div className="flex items-center gap-1.5 px-2.5 text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">Bulan Laporan:</span>
          </div>
          <div className="relative bg-white rounded-full border border-slate-100 shadow-inner px-3 py-1 flex items-center gap-1.5 min-w-[125px] justify-between flex-1 md:flex-initial">
            <select
              value={selectedMonthYearKey}
              onChange={(e) => handleMonthYearChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="staff-month-year-select"
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="staff-kpi-grid">
        {/* Total Carried Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider block">Nilai Produk Di Tangan</span>
            <h3 className="text-xl font-extrabold text-indigo-700 font-sans tracking-tight mt-1.5">
              {formatRupiah(totalCarriedValue)}
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2 flex items-center gap-1.5">
            <Layers className="h-3 w-3 text-indigo-500" />
            <span>Nilai aktif barang yang dibawa saat ini</span>
          </p>
        </div>

        {/* Total Taken (Ever) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Total Bawa (Akumulasi)</span>
            <h3 className="text-xl font-extrabold text-slate-800 font-sans tracking-tight mt-1.5">
              {formatRupiah(personalLedger.totalTaken)}
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2 flex items-center gap-1.5">
            <Briefcase className="h-3 w-3 text-slate-400" />
            <span>Akumulasi barang diambil dari gudang</span>
          </p>
        </div>

        {/* Total Returned (Ever) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Total Diretur (Akumulasi)</span>
            <h3 className="text-xl font-extrabold text-blue-600 font-sans tracking-tight mt-1.5">
              {formatRupiah(personalLedger.totalReturned)}
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2 flex items-center gap-1.5">
            <RotateCcw className="h-3 w-3 text-blue-500" />
            <span>Akumulasi barang rusak/expired diretur</span>
          </p>
        </div>

        {/* Outstanding Bill */}
        <div className="bg-orange-50/60 p-5 rounded-2xl border border-orange-100/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-orange-700 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
              <span>Sisa Kewajiban Tagihan</span>
            </span>
            <h3 className="text-xl font-black text-orange-700 font-sans tracking-tight mt-1.5">
              {formatRupiah(lifetimeLedger.outstandingBill)}
            </h3>
          </div>
          <p className="text-[10px] text-orange-650 mt-4 border-t border-orange-100 pt-2 flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 text-orange-600" />
            <span>Sisa tagihan yang harus disetor ke admin</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Carried Products List and Transaction Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="staff-dashboard-main-grid">
        
        {/* Carried Products Table (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Rincian Produk di Tangan (Sedang Dibawa)</h2>
                <p className="text-xs text-slate-500 mt-0.5">Daftar produk aktif yang saat ini dipegang oleh Anda untuk penjualan.</p>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-indigo-100">
                {carriedProducts.length} Jenis Produk
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3">Nama Produk</th>
                    <th className="py-3">ID Produk</th>
                    <th className="py-3 text-right">Jumlah Dibawa</th>
                    <th className="py-3 text-right">Harga Satuan</th>
                    <th className="py-3 text-right pr-2">Total Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {carriedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Inbox className="h-8 w-8 text-slate-300" />
                          <span>Anda tidak sedang membawa produk apa pun saat ini.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    carriedProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/55 transition-colors">
                        <td className="py-3.5 font-semibold text-slate-900">{p.name}</td>
                        <td className="py-3.5 font-mono text-slate-400">{p.id}</td>
                        <td className="py-3.5 text-right font-bold text-slate-800">
                          {p.quantity} <span className="text-[10px] font-normal text-slate-500 ml-0.5">{p.unit}</span>
                        </td>
                        <td className="py-3.5 text-right text-slate-500">{formatRupiah(p.price)}</td>
                        <td className="py-3.5 text-right font-bold text-indigo-600 pr-2">{formatRupiah(p.totalValue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {carriedProducts.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4 flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200/50">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Ringkasan Nilai</span>
                <span className="text-xs text-slate-600 font-semibold mt-0.5">Total estimasi seluruh produk aktif</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-indigo-700 block">
                  {formatRupiah(totalCarriedValue)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Transaction History Logs (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Log Riwayat Saya</h2>
            <p className="text-xs text-slate-500 mt-0.5">Log aktivitas serah terima barang & keuangan dari Admin.</p>
          </div>

          <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 flex-1">
            {filteredPersonalTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Tidak ada catatan transaksi untuk bulan ini.
              </div>
            ) : (
              filteredPersonalTransactions.map((tx) => {
                const totalVal = tx.type === TransactionType.DEPOSIT 
                  ? tx.amount || 0 
                  : tx.items?.reduce((acc, it) => acc + it.total, 0) || 0;

                return (
                  <div key={tx.id} className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-indigo-600 text-[10px]">{tx.id}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                        tx.type === TransactionType.INTAKE ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        tx.type === TransactionType.DEPOSIT ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {tx.type === TransactionType.INTAKE ? 'Bawa Produk' :
                         tx.type === TransactionType.DEPOSIT ? 'Setor Uang' : 'Retur Barang'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-500 text-[10px]">
                        <span>Oleh: {tx.adminName}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      
                      {tx.items && tx.items.length > 0 && (
                        <div className="text-[10px] text-slate-600 border-l border-slate-200 pl-1.5 mt-1 space-y-0.5">
                          {tx.items.slice(0, 2).map((it, idx) => (
                            <p key={idx} className="truncate">
                              {it.productName} ({it.quantity} {it.unit})
                            </p>
                          ))}
                          {tx.items.length > 2 && (
                            <p className="text-slate-450 italic">+{tx.items.length - 2} produk lainnya</p>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-100/50 mt-1">
                        <span className="text-[10px] text-slate-400">Nominal:</span>
                        <span className={`font-bold ${
                          tx.type === TransactionType.INTAKE ? 'text-indigo-600' :
                          tx.type === TransactionType.DEPOSIT ? 'text-emerald-600' :
                          'text-blue-600'
                        }`}>
                          {formatRupiah(totalVal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Product Ledger Section (Laporan Per Produk) as requested */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6" id="product-ledger-section">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-500" />
              Laporan & Buku Pembantu Per Produk
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih produk di bawah untuk melihat rincian riwayat pengambilan (Distribusi) vs penyelesaian (Setoran & Retur).
            </p>
          </div>
          
          <div className="w-full sm:w-auto flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap font-sans">Filter Produk:</span>
            <div className="relative w-full sm:w-64">
              <select
                value={activeLedgerProductId}
                onChange={(e) => setSelectedLedgerProductId(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer pr-10 font-sans"
                id="ledger-product-selector"
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

        {activeLedgerProduct ? (
          <div className="space-y-6">
            {/* Product Header */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[9px] bg-amber-200/60 text-amber-800 font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                  Produk Terpilih
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">{activeLedgerProduct.name}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Satuan: <span className="font-bold">{activeLedgerProduct.unit}</span> • Harga Satuan Default: <span className="font-bold">{formatRupiah(activeLedgerProduct.price)}</span></p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Sisa Kewajiban Produk Ini</span>
                <span className={`text-lg font-black block mt-0.5 ${productHistoryData.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {productHistoryData.balance > 0 ? formatRupiah(productHistoryData.balance) : 'LUNAS / TIDAK ADA TAGIHAN'}
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
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-center">
                        <th className="py-2.5 px-2 border-r border-slate-200 w-10">NO</th>
                        <th className="py-2.5 px-2 border-r border-slate-200">TGL / BLN</th>
                        <th className="py-2.5 px-2 border-r border-slate-200">DISTRIBUTOR</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 w-12 text-right">QTY</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 text-right">HARGA</th>
                        <th className="py-2.5 px-2 border-r border-slate-200 text-right">JUMLAH</th>
                        <th className="py-2.5 px-2">KETERANGAN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {productHistoryData.debitList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                            Tidak ada data pengambilan untuk produk ini.
                          </td>
                        </tr>
                      ) : (
                        productHistoryData.debitList.map((item, idx) => (
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
                      {productHistoryData.debitList.length < 3 && 
                        Array.from({ length: 3 - productHistoryData.debitList.length }).map((_, i) => (
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
                        <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-900">{productHistoryData.totalDebitQty}</td>
                        <td className="py-2 px-2 border-r border-slate-200"></td>
                        <td className="py-2 px-2 text-right border-r border-slate-200 text-indigo-750">{formatRupiah(productHistoryData.totalDebitAmount)}</td>
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
                  <table className="w-full text-left border-collapse text-[11px]">
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
                      {productHistoryData.creditList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                            Belum ada realisasi setoran atau retur untuk produk ini.
                          </td>
                        </tr>
                      ) : (
                        productHistoryData.creditList.map((item, idx) => (
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
                      {productHistoryData.creditList.length < 3 && 
                        Array.from({ length: 3 - productHistoryData.creditList.length }).map((_, i) => (
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
                        <td className="py-2 px-2 text-right border-r border-slate-200 text-slate-900">{productHistoryData.totalCreditQty}</td>
                        <td className="py-2 px-2 border-r border-slate-200"></td>
                        <td className="py-2 px-2 text-right border-r border-slate-200 text-emerald-750">{formatRupiah(productHistoryData.totalCreditAmount)}</td>
                        <td className="py-2 px-2 border-r border-slate-200"></td>
                        <td className="py-2 px-2 text-center text-white text-[10px]">
                          {productHistoryData.balance > 0 ? (
                            <span className="bg-rose-600 px-2 py-1 rounded font-black block">
                              ({formatRupiah(productHistoryData.balance)})
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-sans">
              <div className="flex items-center justify-between bg-emerald-500 text-white p-3.5 rounded-xl border border-emerald-600 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Bayar (Sisa Selisih)</span>
                <span className="font-mono font-black text-sm">
                  {productHistoryData.balance > 0 ? formatRupiah(productHistoryData.balance) : '-'}
                </span>
              </div>

              <div className="flex items-center justify-between bg-emerald-500 text-white p-3.5 rounded-xl border border-emerald-600 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="text-center border-r border-emerald-400/50 pr-4">
                    <span className="text-[9px] block text-emerald-100 uppercase font-bold">AR (Ambil)</span>
                    <span className="text-sm font-black">{perbandinganLabel.ar}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] block text-emerald-100 uppercase font-bold">SETOR (Realisasi)</span>
                    <span className="text-sm font-black">{perbandinganLabel.setor}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-emerald-100 uppercase block font-bold">PERBANDINGAN</span>
                  <span className="text-sm font-black bg-emerald-600/60 px-2.5 py-0.5 rounded-lg border border-emerald-400/40">
                    {perbandinganLabel.ar} : {perbandinganLabel.setor}
                  </span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            Tidak ada data produk yang tersedia.
          </div>
        )}
      </div>

      {/* SECTION: LAPORAN DATA KUNJUNGAN APOTIK */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6" id="apotik-records-section">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building className="h-4 w-4 text-emerald-500" />
            Laporan Kunjungan & Pengisian Data Apotik
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gunakan form di bawah untuk melaporkan aktivitas kunjungan, penawaran, atau penjualan produk di apotik / outlet.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Side */}
          <div className="lg:col-span-1 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/50">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5 text-slate-500" />
              Form Isian Data
            </h3>

            <form onSubmit={handleSubmitApotik} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                  <span className="font-bold">{successMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Apotik <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    value={namaApotik}
                    onChange={(e) => setNamaApotik(e.target.value)}
                    placeholder="Contoh: Apotik Kimia Farma"
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    id="apotik-input-nama"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Alamat Apotik <span className="text-rose-500">*</span></label>
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Raya No. 123..."
                  rows={2}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                  id="apotik-input-alamat"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Kecamatan <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value)}
                    placeholder="Kecamatan"
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    id="apotik-input-kecamatan"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Kabupaten <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={kabupaten}
                    onChange={(e) => setKabupaten(e.target.value)}
                    placeholder="Kabupaten"
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    id="apotik-input-kabupaten"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 my-4 pt-4"></div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih Produk <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select
                    value={formProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer pr-10"
                    id="apotik-input-product"
                  >
                    <option value="">-- Pilih Produk --</option>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Jumlah (Qty) <span className="text-rose-500">*</span></label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min={1}
                      value={formJumlah}
                      onChange={(e) => setFormJumlah(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      id="apotik-input-qty"
                    />
                    <span className="text-[10px] text-slate-400 font-bold ml-1.5 shrink-0 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                      {selectedProduct?.unit || 'Unit'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nilai / Harga Satuan</label>
                  <input
                    type="number"
                    min={0}
                    value={formNilai}
                    onChange={(e) => setFormNilai(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 text-right"
                    id="apotik-input-nilai"
                  />
                </div>
              </div>

              <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Total Nilai</span>
                <span className="font-black text-slate-800 font-mono">
                  {formatRupiah(formJumlah * formNilai)}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer border border-slate-300/40"
                  id="apotik-btn-reset"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:shadow"
                  id="apotik-btn-save"
                >
                  <Plus className="h-4 w-4" />
                  Simpan Laporan
                </button>
              </div>
            </form>
          </div>

          {/* Table Side */}
          <div className="lg:col-span-2 flex flex-col">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-slate-500" />
              Daftar Kunjungan Apotik Saya ({personalApotikRecords.length})
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col bg-white">
              <div className="overflow-x-auto flex-1 max-h-[480px]">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-center">
                      <th className="py-2.5 px-2 border-r border-slate-200 w-10">NO</th>
                      <th className="py-2.5 px-2 border-r border-slate-200">NAMA APOTIK</th>
                      <th className="py-2.5 px-2 border-r border-slate-200">ALAMAT / WILAYAH</th>
                      <th className="py-2.5 px-2 border-r border-slate-200">PRODUK</th>
                      <th className="py-2.5 px-2 border-r border-slate-200 w-12 text-right">QTY</th>
                      <th className="py-2.5 px-2 border-r border-slate-200 text-right">NILAI</th>
                      <th className="py-2.5 px-2 border-r border-slate-200 text-right">TOTAL</th>
                      <th className="py-2.5 px-2 w-10">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {personalApotikRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                          Belum ada laporan kunjungan data apotik yang diisi.
                        </td>
                      </tr>
                    ) : (
                      personalApotikRecords.map((rec, idx) => (
                        <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-2 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-900 max-w-[120px] truncate" title={rec.namaApotik}>
                            {rec.namaApotik}
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200 max-w-[160px]" title={`${rec.alamat}, Kec. ${rec.kecamatan}, Kab. ${rec.kabupaten}`}>
                            <div className="truncate text-slate-600 font-medium">{rec.alamat}</div>
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                              <MapPin className="h-2 w-2 shrink-0 text-slate-300" />
                              <span className="truncate">Kec. {rec.kecamatan}, Kab. {rec.kabupaten}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-800 max-w-[100px] truncate" title={rec.productName}>
                            {rec.productName}
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200 text-right font-black text-slate-900">
                            {rec.jumlah} <span className="text-[9px] font-normal text-slate-400">{rec.satuan}</span>
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200 text-right text-slate-500 font-mono">{formatRupiah(rec.nilai)}</td>
                          <td className="py-2.5 px-2 border-r border-slate-200 text-right font-black text-emerald-600 font-mono">{formatRupiah(rec.total)}</td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => onDeleteApotikRecord(rec.id)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors cursor-pointer"
                              title="Hapus data"
                              id={`apotik-btn-delete-${rec.id}`}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                    {/* Empty Rows to maintain spreadsheet aesthetic if list is short */}
                    {personalApotikRecords.length < 5 &&
                      Array.from({ length: 5 - personalApotikRecords.length }).map((_, i) => (
                        <tr key={`empty-apt-${i}`} className="h-9">
                          <td className="border-r border-slate-200"></td>
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
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
