import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { LogIn, ShieldAlert, ShoppingBag, Landmark, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

export default function LoginScreen({ users, onLogin }: LoginScreenProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Silakan masukkan email Anda.');
      return;
    }

    const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (matchedUser) {
      if (matchedUser.status === 'inactive') {
        setError('Akun Anda dinonaktifkan oleh Manajer. Silakan hubungi Manajer Anda.');
        return;
      }
      onLogin(matchedUser);
    } else {
      setError('User tidak ditemukan. Gunakan salah satu email dari panel Quick Login di bawah.');
    }
  };

  const selectQuickUser = (user: User) => {
    if (user.status === 'inactive') {
      setError('Akun tersebut dinonaktifkan oleh Manajer.');
      return;
    }
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" id="login-container">
      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-0 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Left column: Visual branding */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle abstract background art */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white p-1.5 rounded-xl border border-white/20 flex items-center justify-center shadow-sm">
                <img 
                  src="https://drive.google.com/thumbnail?id=1L8BTmeULOdJhKhVhE-6ZNI23FbiWWkEu&sz=120" 
                  alt="Logo PT. Distribusi Nusantara" 
                  className="h-8 w-8 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-sans font-extrabold text-lg tracking-wider text-white">MOP STAFF</span>
            </div>
          </div>

          <div className="my-auto z-10 py-8">
            <h1 className="font-sans font-extrabold text-3xl leading-tight tracking-tight mb-4 text-white">
              Monitor Pengambilan Produk Penjualan
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed font-sans">
              Pantau pengambilan produk, kelola setoran keuangan, catat retur, dan lihat performa penjualan dalam satu dashboard terintegrasi.
            </p>
          </div>

          <div className="z-10 text-xs text-slate-400 font-mono border-t border-white/10 pt-4 flex justify-between items-center">
            <span>Versi 1.1.0 (Stable)</span>
            <span>PT. Distribusi Nusantara</span>
          </div>
        </div>

        {/* Right column: Login forms */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Selamat Datang Kembali</h2>
            <p className="text-slate-500 text-sm mt-1">Silakan masuk menggunakan akun Anda atau pilih akun demo di bawah.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex gap-2.5 items-center text-sm"
              id="login-error-alert"
            >
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alamat Email</label>
              <input
                type="email"
                placeholder="contoh: budi.santoso@sales.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                id="login-email-input"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Kata Sandi</label>
                <span className="text-xs text-indigo-600 hover:underline cursor-pointer font-medium">Lupa Sandi?</span>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                id="login-password-input"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer mt-2 shadow-sm"
              id="login-btn-submit"
            >
              <LogIn className="h-4 w-4" />
              <span>Masuk Aplikasi</span>
            </button>
          </form>

          {/* Quick Login Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Login Instan Sebagai Demo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Staff Button */}
              {users.filter(u => u.role === UserRole.STAFF).slice(0, 1).map(user => (
                <button
                  key={user.id}
                  onClick={() => selectQuickUser(user)}
                  className="bg-slate-50 hover:bg-amber-50/30 hover:border-amber-500/30 border border-slate-200 p-3.5 rounded-xl text-left transition-all duration-200 group cursor-pointer"
                  id={`quick-login-${user.id}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1 bg-amber-100 rounded text-amber-700 group-hover:bg-amber-200">
                      <UserCheck className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 tracking-wider uppercase">Staff</span>
                  </div>
                  <div className="font-semibold text-slate-800 text-xs truncate">{user.name}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</div>
                </button>
              ))}

              {/* Admin Button */}
              {users.filter(u => u.role === UserRole.ADMIN).slice(0, 1).map(user => (
                <button
                  key={user.id}
                  onClick={() => selectQuickUser(user)}
                  className="bg-slate-50 hover:bg-emerald-50/30 hover:border-emerald-500/30 border border-slate-200 p-3.5 rounded-xl text-left transition-all duration-200 group cursor-pointer"
                  id={`quick-login-${user.id}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1 bg-emerald-100 rounded text-emerald-700 group-hover:bg-emerald-200">
                      <Landmark className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">Admin</span>
                  </div>
                  <div className="font-semibold text-slate-800 text-xs truncate">{user.name}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</div>
                </button>
              ))}

              {/* Manager Button */}
              {users.filter(u => u.role === UserRole.MANAGER).slice(0, 1).map(user => (
                <button
                  key={user.id}
                  onClick={() => selectQuickUser(user)}
                  className="bg-slate-50 hover:bg-indigo-50/30 hover:border-indigo-500/30 border border-slate-200 p-3.5 rounded-xl text-left transition-all duration-200 group cursor-pointer"
                  id={`quick-login-${user.id}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1 bg-indigo-100 rounded text-indigo-700 group-hover:bg-indigo-200">
                      <ShoppingBag className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 tracking-wider uppercase">Manager</span>
                  </div>
                  <div className="font-semibold text-slate-800 text-xs truncate">{user.name}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
