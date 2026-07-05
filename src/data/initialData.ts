import { User, UserRole, Product, Transaction, TransactionType } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'staff-1',
    name: 'Budi Santoso',
    email: 'budi.santoso@sales.com',
    role: UserRole.STAFF,
    phone: '0812-3456-7890',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-2',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@sales.com',
    role: UserRole.STAFF,
    phone: '0812-9876-5432',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-3',
    name: 'Adi Wijaya',
    email: 'adi.wijaya@sales.com',
    role: UserRole.STAFF,
    phone: '0813-4455-6677',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'admin-1',
    name: 'Siti Rahma',
    email: 'siti.rahma@admin.com',
    role: UserRole.ADMIN,
    phone: '0811-2233-4455',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'manager-1',
    name: 'Hendra Wijaya',
    email: 'hendra.wijaya@manager.com',
    role: UserRole.MANAGER,
    phone: '0812-0000-1111',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PRD-01',
    name: 'Indomie Goreng Spesial',
    stock: 120, // 120 karton/box
    unit: 'Box',
    price: 115000,
    expiryDate: '2027-04-15'
  },
  {
    id: 'PRD-02',
    name: 'Teh Botol Sosro 450ml',
    stock: 85, // 85 karton
    unit: 'Karton',
    price: 135000,
    expiryDate: '2026-12-10'
  },
  {
    id: 'PRD-03',
    name: 'Kopi Kapal Api Mix',
    stock: 50, // 50 pack
    unit: 'Pack',
    price: 85000,
    expiryDate: '2027-02-28'
  },
  {
    id: 'PRD-04',
    name: 'Minyak Goreng Bimoli 2L',
    stock: 150, // 150 pcs
    unit: 'Pcs',
    price: 38000,
    expiryDate: '2027-06-01'
  },
  {
    id: 'PRD-05',
    name: 'Aqua Gelas 220ml',
    stock: 200, // 200 karton
    unit: 'Karton',
    price: 32000,
    expiryDate: '2027-01-20'
  },
  {
    id: 'PRD-06',
    name: 'Frisian Flag Susu Kental Manis',
    stock: 45, // 45 karton
    unit: 'Karton',
    price: 260000,
    expiryDate: '2026-11-30'
  },
  {
    id: 'PRD-07',
    name: 'Roti Sari Roti Tawar',
    stock: 60, // 60 pcs
    unit: 'Pcs',
    price: 15000,
    expiryDate: '2026-07-15'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Budi Santoso Transactions
  {
    id: 'TX-001',
    type: TransactionType.INTAKE,
    date: '2026-06-05T09:15:00Z',
    staffId: 'staff-1',
    staffName: 'Budi Santoso',
    adminId: 'admin-1',
    adminName: 'Siti Rahma',
    items: [
      { productId: 'PRD-01', productName: 'Indomie Goreng Spesial', quantity: 15, unit: 'Box', price: 115000, total: 1725000 },
      { productId: 'PRD-05', productName: 'Aqua Gelas 220ml', quantity: 10, unit: 'Karton', price: 32000, total: 320000 }
    ],
    notes: 'Stok penjualan awal bulan area barat'
  },
  {
    id: 'TX-002',
    type: TransactionType.DEPOSIT,
    date: '2026-06-10T16:00:00Z',
    staffId: 'staff-1',
    staffName: 'Budi Santoso',
    adminId: 'admin-1',
    adminName: 'Siti Rahma',
    amount: 1500000,
    notes: 'Setoran hasil penjualan minggu pertama'
  },
  {
    id: 'TX-003',
    type: TransactionType.RETURN,
    date: '2026-06-12T10:30:00Z',
    staffId: 'staff-1',
    staffName: 'Budi Santoso',
    adminId: 'admin-1',
    adminName: 'Siti Rahma',
    items: [
      { productId: 'PRD-01', productName: 'Indomie Goreng Spesial', quantity: 1, unit: 'Box', price: 115000, total: 115000 }
    ],
    notes: 'Retur dus penyok'
  },
  {
    id: 'TX-004',
    type: TransactionType.INTAKE,
    date: '2026-06-18T08:45:00Z',
    staffId: 'staff-1',
    staffName: 'Budi Santoso',
    adminId: 'admin-1',
    adminName: 'Siti Rahma',
    items: [
      { productId: 'PRD-02', productName: 'Teh Botol Sosro 450ml', quantity: 8, unit: 'Karton', price: 135000, total: 1080000 },
      { productId: 'PRD-04', productName: 'Minyak Goreng Bimoli 2L', quantity: 10, unit: 'Pcs', price: 38000, total: 380000 }
    ],
    notes: 'Pengambilan produk repeat order'
  },
  {
    id: 'TX-005',
    type: TransactionType.DEPOSIT,
    date: '2026-06-25T15:30:00Z',
    staffId: 'staff-1',
    staffName: 'Budi Santoso',
    adminId: 'admin-1',
    adminName: 'Siti Rahma',
    amount: 1200000,
    notes: 'Setoran penjualan minggu kedua & ketiga'
  },

  // Dewi Lestari Transactions
  {
    id: 'TX-006',
    type: TransactionType.INTAKE,
    date: '2026-06-08T10:00:00Z',
    staffId: 'staff-2',
    staffName: 'Dewi Lestari',
    adminId: 'admin-1',
    adminName: 'Siti Rahma',
    items: [
      { productId: 'PRD-02', productName: 'Teh Botol Sosro 450ml', quantity: 12, unit: 'Karton', price: 135000, total: 1620000 },
      { productId: 'PRD-03', productName: 'Kopi Kapal Api Mix', quantity: 15, unit: 'Pack', price: 85000, total: 1275000 }
    ],
    notes: 'Pengambilan awal bulan area timur'
  },
  {
    id: 'TX-007',
    type: TransactionType.DEPOSIT,
    date: '2026-06-15T16:20:00Z',
    staffId: 'staff-2',
    staffName: 'Dewi Lestari',
    adminId: 'admin-1',
    adminName: 'Siti Rahma',
    amount: 2000000,
    notes: 'Setoran tunai area timur'
  },
  {
    id: 'TX-008',
    type: TransactionType.RETURN,
    date: '2026-06-17T11:00:00Z',
    staffId: 'staff-2',
    staffName: 'Dewi Lestari',
    adminId: 'admin-1',
    adminName: 'Siti Rahma',
    items: [
      { productId: 'PRD-03', productName: 'Kopi Kapal Api Mix', quantity: 2, unit: 'Pack', price: 85000, total: 170000 }
    ],
    notes: 'Retur kemasan basah saat pengiriman'
  },

  // Adi Wijaya Transactions
  {
    id: 'TX-009',
    type: TransactionType.INTAKE,
    date: '2026-06-11T08:30:00Z',
    staffId: 'staff-3',
    staffName: 'Adi Wijaya',
    adminId: 'admin-1',
    adminName: 'Siti Rahma',
    items: [
      { productId: 'PRD-04', productName: 'Minyak Goreng Bimoli 2L', quantity: 20, unit: 'Pcs', price: 38000, total: 760000 },
      { productId: 'PRD-06', productName: 'Frisian Flag Susu Kental Manis', quantity: 3, unit: 'Karton', price: 260000, total: 780000 },
      { productId: 'PRD-07', productName: 'Roti Sari Roti Tawar', quantity: 30, unit: 'Pcs', price: 15000, total: 450000 }
    ],
    notes: 'Distribusi area pusat perbelanjaan'
  },
  {
    id: 'TX-010',
    type: TransactionType.DEPOSIT,
    date: '2026-06-20T14:45:00Z',
    staffId: 'staff-3',
    staffName: 'Adi Wijaya',
    adminId: 'admin-1',
    adminName: 'Siti Rahma',
    amount: 1500000,
    notes: 'Setoran penjualan Roti dan Minyak'
  },
  {
    id: 'TX-011',
    type: TransactionType.RETURN,
    date: '2026-06-22T09:15:00Z',
    staffId: 'staff-3',
    staffName: 'Adi Wijaya',
    adminId: 'admin-1',
    adminName: 'Siti Rahma',
    items: [
      { productId: 'PRD-07', productName: 'Roti Sari Roti Tawar', quantity: 5, unit: 'Pcs', price: 15000, total: 75000 }
    ],
    notes: 'Expired date terlampaui'
  },

  // July 2026 Transactions (Recent)
  {
    id: 'TX-012',
    type: TransactionType.INTAKE,
    date: '2026-07-02T10:00:00Z',
    staffId: 'staff-1',
    staffName: 'Budi Santoso',
    adminId: 'admin-1',
    adminName: 'Siti Rahma',
    items: [
      { productId: 'PRD-01', productName: 'Indomie Goreng Spesial', quantity: 10, unit: 'Box', price: 115000, total: 1150000 },
      { productId: 'PRD-05', productName: 'Aqua Gelas 220ml', quantity: 15, unit: 'Karton', price: 32000, total: 480000 }
    ],
    notes: 'Stok awal Juli'
  },
  {
    id: 'TX-013',
    type: TransactionType.INTAKE,
    date: '2026-07-03T11:30:00Z',
    staffId: 'staff-2',
    staffName: 'Dewi Lestari',
    adminId: 'admin-1',
    adminName: 'Siti Rahma',
    items: [
      { productId: 'PRD-02', productName: 'Teh Botol Sosro 450ml', quantity: 10, unit: 'Karton', price: 135000, total: 1350000 },
      { productId: 'PRD-06', productName: 'Frisian Flag Susu Kental Manis', quantity: 2, unit: 'Karton', price: 260000, total: 520000 }
    ],
    notes: 'Permintaan pasar meningkat area timur'
  }
];

// Helper to load/save state from localStorage
export const getStoredData = () => {
  try {
    const products = localStorage.getItem('mop_products');
    const transactions = localStorage.getItem('mop_transactions');
    const users = localStorage.getItem('mop_users');

    return {
      products: products ? JSON.parse(products) : INITIAL_PRODUCTS,
      transactions: transactions ? JSON.parse(transactions) : INITIAL_TRANSACTIONS,
      users: users ? JSON.parse(users) : INITIAL_USERS
    };
  } catch (e) {
    console.error('Error reading localStorage', e);
    return {
      products: INITIAL_PRODUCTS,
      transactions: INITIAL_TRANSACTIONS,
      users: INITIAL_USERS
    };
  }
};

export const saveStoredData = (products: Product[], transactions: Transaction[], users: User[]) => {
  try {
    localStorage.setItem('mop_products', JSON.stringify(products));
    localStorage.setItem('mop_transactions', JSON.stringify(transactions));
    localStorage.setItem('mop_users', JSON.stringify(users));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
};
