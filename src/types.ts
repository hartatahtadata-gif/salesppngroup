export enum UserRole {
  STAFF = 'staff',
  ADMIN = 'admin',
  MANAGER = 'manager'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  password?: string;
}

export interface Product {
  id: string; // SKU / ID Produk
  name: string;
  stock: number; // Jumlah stok saat ini di gudang admin
  unit: string; // Satuan (Pcs, Box, Karton)
  price: number; // Harga per satuan
  expiryDate: string; // Tanggal kedaluwarsa (YYYY-MM-DD)
}

export enum TransactionType {
  INTAKE = 'intake', // Pengambilan produk
  RETURN = 'return', // Retur produk
  DEPOSIT = 'deposit' // Setoran uang
}

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // ISO String or YYYY-MM-DD
  staffId: string;
  staffName: string;
  adminId: string;
  adminName: string;
  items?: TransactionItem[]; // For INTAKE and RETURN
  amount?: number; // For DEPOSIT, representing cash paid
  notes?: string; // Additional info
}

export interface StaffSummary {
  staffId: string;
  staffName: string;
  totalTaken: number; // Total rupiah produk yang pernah diambil
  totalDeposited: number; // Total rupiah uang yang sudah disetorkan
  totalReturned: number; // Total rupiah produk yang diretur
  outstandingBill: number; // Sisa tagihan (Taken - Deposited - Returned)
}

export interface ApotikRecord {
  id: string;
  namaApotik: string;
  alamat: string;
  kecamatan: string;
  kabupaten: string;
  productId: string;
  productName: string;
  jumlah: number;
  satuan: string;
  nilai: number;
  total: number;
  staffId: string;
  staffName: string;
  date: string;
}
