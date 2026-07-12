import { User, UserRole, Product, Transaction } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Siti Rahma',
    email: 'siti.rahma@admin.com',
    role: UserRole.ADMIN,
    phone: '0811-2233-4455',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    password: '123456'
  },
  {
    id: 'manager-1',
    name: 'Hendra Wijaya',
    email: 'hendra.wijaya@manager.com',
    role: UserRole.MANAGER,
    phone: '0812-0000-1111',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    password: '123456'
  }
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

// Helper to load/save state from localStorage
export const getStoredData = () => {
  try {
    const isDemoPurged = localStorage.getItem('mop_clear_demo_v5');
    if (!isDemoPurged) {
      localStorage.setItem('mop_clear_demo_v5', 'true');
      localStorage.setItem('mop_products', JSON.stringify([]));
      localStorage.setItem('mop_transactions', JSON.stringify([]));
      localStorage.setItem('mop_users', JSON.stringify(INITIAL_USERS));
      localStorage.setItem('mop_apotik_records', JSON.stringify([]));
      return {
        products: [],
        transactions: [],
        users: INITIAL_USERS,
        apotikRecords: []
      };
    }

    const products = localStorage.getItem('mop_products');
    const transactions = localStorage.getItem('mop_transactions');
    const users = localStorage.getItem('mop_users');
    const apotikRecords = localStorage.getItem('mop_apotik_records');

    return {
      products: products ? JSON.parse(products) : INITIAL_PRODUCTS,
      transactions: transactions ? JSON.parse(transactions) : INITIAL_TRANSACTIONS,
      users: users ? JSON.parse(users) : INITIAL_USERS,
      apotikRecords: apotikRecords ? JSON.parse(apotikRecords) : []
    };
  } catch (e) {
    console.error('Error reading localStorage', e);
    return {
      products: INITIAL_PRODUCTS,
      transactions: INITIAL_TRANSACTIONS,
      users: INITIAL_USERS,
      apotikRecords: []
    };
  }
};

export const saveStoredData = (products: Product[], transactions: Transaction[], users: User[], apotikRecords?: any[]) => {
  try {
    localStorage.setItem('mop_products', JSON.stringify(products));
    localStorage.setItem('mop_transactions', JSON.stringify(transactions));
    localStorage.setItem('mop_users', JSON.stringify(users));
    if (apotikRecords) {
      localStorage.setItem('mop_apotik_records', JSON.stringify(apotikRecords));
    }
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
};
