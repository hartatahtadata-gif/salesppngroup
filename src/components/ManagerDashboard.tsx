import React, { useState, useMemo } from 'react';
import { Product, Transaction, TransactionType, User, StaffSummary } from '../types';
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
  Briefcase
} from 'lucide-react';

interface ManagerDashboardProps {
  products: Product[];
  transactions: Transaction[];
  users: User[];
}

export default function ManagerDashboard({ products, transactions, users }: ManagerDashboardProps) {
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

  // Format IDR Helper
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Filter transactions for selected Month & Year
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() + 1 === selectedMonth && txDate.getFullYear() === selectedYear;
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

  // Recharts: Trend data over the month (Daily aggregations)
  const chartTrendData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
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
  }, [filteredTransactions, selectedMonth, selectedYear]);

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

  return (
    <div className="space-y-6 animate-fade-in" id="manager-dashboard-view">
      {/* Upper bar: Date selectors */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-sans tracking-tight">Dashboard Analisis Manajer</h1>
          <p className="text-slate-500 text-xs mt-1">Laporan bulanan monitoring distribusi produk, setoran, dan keuangan staff penjualan.</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60">
          <Calendar className="h-4 w-4 text-slate-400 mr-1 ml-1" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-100 font-medium"
            id="manager-month-select"
          >
            {IndonesianMonths.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-100 font-medium"
            id="manager-year-select"
          >
            {yearsList.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="manager-kpi-grid">
        {/* Total Taken (Nominal Produk Dibawa) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Produk Dibawa Staff</span>
              <h3 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight mt-1">
                {formatRupiah(stats.totalTaken)}
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2 flex items-center gap-1">
            <span>Total produk dari gudang admin bulan ini</span>
          </p>
        </div>

        {/* Total Deposited (Nominal Sudah Disetor) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nominal Sudah Disetor</span>
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
            <span>dari total produk dibawa</span>
          </p>
        </div>

        {/* Total Returned (Retur) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Produk Diretur</span>
              <h3 className="text-xl font-extrabold text-blue-600 font-sans tracking-tight mt-1">
                {formatRupiah(stats.totalReturned)}
              </h3>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
              <RotateCcw className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2">
            <span>Barang rusak / kedaluwarsa ditarik kembali</span>
          </p>
        </div>

        {/* Outstanding Bill (Sisa Tagihan) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sisa Tagihan Staff</span>
              <h3 className="text-xl font-extrabold text-red-600 font-sans tracking-tight mt-1">
                {formatRupiah(stats.outstandingBill)}
              </h3>
            </div>
            <div className="p-2.5 bg-red-50 rounded-xl text-red-600 border border-red-100">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-100 pt-2 flex items-center gap-1">
            <span>Outstanding piutang yang wajib ditagih</span>
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="manager-charts-row">
        {/* Trend Area Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Aktivitas Distribusi & Setoran Harian</h2>
              <p className="text-xs text-slate-500 mt-0.5">Visualisasi perbandingan pengambilan produk, setoran uang, dan retur.</p>
            </div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold uppercase font-mono border border-indigo-100">
              {IndonesianMonths[selectedMonth - 1]} {selectedYear}
            </span>
          </div>

          <div className="h-72 w-full">
            {filteredTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <p>Tidak ada transaksi pada bulan {IndonesianMonths[selectedMonth - 1]} {selectedYear}</p>
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
                    labelFormatter={(label) => `Tanggal ${label} ${IndonesianMonths[selectedMonth - 1]}`}
                  />
                  <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                  <Area type="monotone" name="Produk Dibawa" dataKey="Intake" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorIntake)" />
                  <Area type="monotone" name="Setoran Uang" dataKey="Deposit" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorDeposit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Breakdown Pie Chart (4 cols) */}
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

      {/* Staff Leaderboard and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="manager-details-row">
        {/* Staff performance table (7 cols) */}
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

        {/* Alerts: Inventory and Expiry (5 cols) */}
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
    </div>
  );
}
