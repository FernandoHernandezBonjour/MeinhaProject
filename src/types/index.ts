export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  pixKey?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  passwordChanged: boolean;
  hashedPassword?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Debt {
  id: string;
  creditorId: string; // Quem deve receber
  debtorId: string; // Quem deve pagar
  amount: number;
  dueDate: Date;
  status: 'OPEN' | 'PAID';
  attachment?: string; // URL do anexo
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'passwordChanged'>) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  loading: boolean;
  updateUser: (user: User | null) => void;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  password: string;
  role: 'admin' | 'user';
}

export interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileFormData {
  email?: string;
  name?: string;
  pixKey?: string;
  photoURL?: string;
}

export interface DebtFormData {
  debtorId: string;
  amount: number;
  dueDate: string;
  description?: string;
  attachment?: File;
}
