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
  const [fullName, setFullName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      setError('Silakan masukkan nama lengkap Anda.');
      return;
    }

    const matchedUser = users.find(u => u.name.toLowerCase() === fullName.toLowerCase().trim());
    if (matchedUser) {
      if (matchedUser.status === 'inactive') {
        setError('Akun Anda dinonaktifkan oleh Manajer. Silakan hubungi Manajer Anda.');
        return;
      }
      
      const userPassword = matchedUser.password || '123456';
      if (password !== userPassword) {
        setError('Kata sandi yang Anda masukkan salah.');
        return;
      }
      
      onLogin(matchedUser);
    } else {
      setError('User tidak ditemukan. Gunakan salah satu nama dari panel PILIH PROFIL di bawah.');
    }
  };

  const selectQuickUser = (user: User) => {
    if (user.status === 'inactive') {
      setError('Akun tersebut dinonaktifkan oleh Manajer.');
      return;
    }
    setFullName(user.name);
    setPassword('');
    setError('');
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
            <div className="flex items-center gap-2 mb-6">
              <img 
                src="https://drive.google.com/thumbnail?id=1L8BTmeULOdJhKhVhE-6ZNI23FbiWWkEu&sz=120" 
                alt="Logo PPN Group" 
                className="w-24 h-24 object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
              <span className="font-sans font-extrabold text-lg tracking-wider text-white -ml-2">SALES PPN GROUP</span>
            </div>
          </div>

          <div className="my-auto z-10 py-8">
            <h1 className="font-sans font-extrabold text-3xl leading-tight tracking-tight mb-4 text-white">
              Monitor Pengambilan Produk dan Setoran
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed font-sans">
              Pantau pengambilan produk, kelola setoran keuangan, catat retur, dan lihat performa penjualan dalam satu dashboard terintegrasi.
            </p>
          </div>

          <div className="z-10 text-xs text-slate-400 font-mono border-t border-white/10 pt-4 flex justify-between items-center">
            <span>Versi 1.1.0 (Stable)</span>
            <span>PPN Group</span>
          </div>
        </div>

        {/* Right column: Login forms */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Selamat Datang Kembali</h2>
            <p className="text-slate-500 text-sm mt-1">Silakan masuk menggunakan akun Anda atau pilih akun profil di bawah.</p>
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
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                placeholder="contoh: Budi Santoso"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(''); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                id="login-name-input"
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
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">PILIH PROFIL</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {users.map((user) => {
                const isStaff = user.role === UserRole.STAFF;
                const isAdmin = user.role === UserRole.ADMIN;
                const isManager = user.role === UserRole.MANAGER;

                let roleColor = 'text-amber-700 bg-amber-100 hover:bg-amber-200';
                let roleLabel = 'Staff';
                let IconComponent = UserCheck;
                let bgBorderHover = 'hover:bg-amber-50/30 hover:border-amber-500/30';

                if (isAdmin) {
                  roleColor = 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200';
                  roleLabel = 'Admin';
                  IconComponent = Landmark;
                  bgBorderHover = 'hover:bg-emerald-50/30 hover:border-emerald-500/30';
                } else if (isManager) {
                  roleColor = 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200';
                  roleLabel = 'Manager';
                  IconComponent = ShoppingBag;
                  bgBorderHover = 'hover:bg-indigo-50/30 hover:border-indigo-500/30';
                }

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectQuickUser(user)}
                    className={`bg-slate-50 border border-slate-200 p-3 rounded-xl text-left transition-all duration-200 group cursor-pointer flex items-center justify-between gap-3 ${bgBorderHover}`}
                    id={`quick-login-${user.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-0.5 rounded ${roleColor.split(' ')[1]} ${roleColor.split(' ')[0]}`}>
                          <IconComponent className="h-3 w-3" />
                        </div>
                        <span className={`text-[9px] font-bold tracking-wider uppercase ${roleColor.split(' ')[0]}`}>{roleLabel}</span>
                      </div>
                      <div className="font-semibold text-slate-800 text-xs truncate">{user.name}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</div>
                    </div>
                    <div className="shrink-0">
                      <img
                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366F1&color=fff`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
