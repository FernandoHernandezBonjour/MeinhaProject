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
  forcePasswordReset?: boolean;
  skipCurrentPassword?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Debt {
  id: string;
  creditorId: string; // Quem deve receber
  debtorId: string; // Quem deve pagar
  amount: number;
  originalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  totalPaidInChain?: number;
  chainId?: string;
  parentDebtId?: string;
  wasPartialPayment?: boolean;
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

// Novos tipos para o Hub Meinha Games
export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  date: Date;
  time: string;
  createdBy: string;
  createdByUsername?: string;
  createdByName?: string;
  photos: string[];
  videos: string[];
  comments: EventComment[];
  reactions: EventReaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EventComment {
  id: string;
  userId: string;
  username?: string;
  content: string;
  createdAt: Date;
}

export interface EventReaction {
  id: string;
  userId: string;
  username?: string;
  reaction: string; // "vai tomar no c*", "segue virgem", etc
  createdAt: Date;
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'photo' | 'video';
  eventId?: string;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedByUsername?: string;
  createdAt: Date;
  description?: string;
  storagePath?: string;
  eventTitle?: string;
  updatedAt?: Date;
  comments: MediaComment[];
  reactions: MediaReaction[];
}

export interface MediaComment {
  id: string;
  userId: string;
  username?: string;
  content: string;
  createdAt: Date;
}

export interface MediaReaction {
  id: string;
  userId: string;
  username?: string;
  reaction: string;
  createdAt: Date;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  category: 'debate' | 'votacao' | 'zoeira' | 'geral';
  poll?: Poll;
  comments: ForumComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  expiresAt?: Date;
  createdAt: Date;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[]; // IDs dos usuários que votaram
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | 'debt_created'
    | 'debt_updated'
    | 'debt_paid'
    | 'debt_deleted'
    | 'event_created'
    | 'event_reaction'
    | 'event_comment'
    | 'media_uploaded'
    | 'media_comment'
    | 'media_reaction'
    | 'forum_post'
    | 'debt_overdue';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserLevel {
  level: number;
  name: string;
  xp: number;
  isCaloteiro: boolean; // Flag especial para caloteiros
}

export interface WeeklyStats {
  debtsCreated: number;
  paymentsMade: number;
  eventsCreated: number;
  newCaloteiros: number;
  period: string;
}

export interface CaloteiroRanking {
  userId: string;
  username: string;
  totalDebt: number;
  overdueDebts: number;
  position: number;
  isLeader: boolean; // Para a "Coroa do Vagabundo"
}

export interface ActivityFeed {
  id: string;
  type: 'debt_created' | 'debt_paid' | 'event_created' | 'media_uploaded';
  userId: string;
  username: string;
  message: string;
  createdAt: Date;
}

// Tipos para formulários
export interface EventFormData {
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  photos?: File[];
  videos?: File[];
}

export interface ForumPostFormData {
  title: string;
  content: string;
  category: 'debate' | 'votacao' | 'zoeira' | 'geral';
  pollQuestion?: string;
  pollOptions?: string[];
  pollExpiresAt?: string;
}

export interface MediaUploadFormData {
  files: File[];
  eventId?: string;
}