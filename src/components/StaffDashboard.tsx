import React, { useState, useMemo } from 'react';
import { Product, Transaction, TransactionType, User } from '../types';
import { 
  Briefcase,
  RotateCcw,
  AlertCircle,
  Clock,
  Layers,
  TrendingUp,
  DollarSign,
  Inbox,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';

interface StaffDashboardProps {
  currentStaff: User;
  products: Product[];
  transactions: Transaction[];
  onAddTransaction: (newTransaction: Transaction) => void;
  onUpdateProducts: (updatedProducts: Product[]) => void;
}

export default function StaffDashboard({
  currentStaff,
  products,
  transactions
}: StaffDashboardProps) {

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const IndonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const yearsList = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    transactions.forEach(tx => {
      years.add(new Date(tx.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

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
      return txDate.getMonth() + 1 === selectedMonth && txDate.getFullYear() === selectedYear;
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

  // Calculate list of products currently carried by this staff
  const carriedProducts = useMemo(() => {
    const counts: { [productId: string]: { name: string; unit: string; price: number; quantity: number } } = {};

    filteredPersonalTransactions.forEach(tx => {
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
      }
    });

    return Object.keys(counts)
      .map(id => ({
        id,
        ...counts[id],
        totalValue: counts[id].quantity * counts[id].price
      }))
      .filter(item => item.quantity > 0);
  }, [filteredPersonalTransactions]);

  // Sum total value of currently carried products
  const totalCarriedValue = useMemo(() => {
    return carriedProducts.reduce((acc, p) => acc + p.totalValue, 0);
  }, [carriedProducts]);

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
        
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60">
          <Calendar className="h-4 w-4 text-slate-400 mr-1 ml-1" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-100 font-medium cursor-pointer"
            id="staff-month-select"
          >
            {IndonesianMonths.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-100 font-medium cursor-pointer"
            id="staff-year-select"
          >
            {yearsList.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
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
              {formatRupiah(personalLedger.outstandingBill)}
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

    </div>
  );
}
