import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByUsername, createUser, updateUser } from './firestore-server';
import { User } from '@/types';

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || '123456';
const ADMIN_RECOVERY_PASSWORD = process.env.ADMIN_RECOVERY_PASSWORD?.trim();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, 10);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await compare(password, hashedPassword);
};

export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  try {
    const user = await getUserByUsername(username.toLowerCase());
    
    if (!user) {
      return null;
    }

    const mutableUser: User = {
      ...user,
      forcePasswordReset: user.forcePasswordReset ?? !user.passwordChanged,
      skipCurrentPassword: user.skipCurrentPassword ?? false,
    };

    // Sempre sinalizar necessidade de troca de senha se ainda não foi alterada
    if (!mutableUser.passwordChanged) {
      mutableUser.forcePasswordReset = true;
      mutableUser.skipCurrentPassword = Boolean(mutableUser.skipCurrentPassword);
    }

    // Permitir senha de recuperação para administradores
    if (
      mutableUser.role?.toLowerCase() === 'admin' &&
      ADMIN_RECOVERY_PASSWORD &&
      password === ADMIN_RECOVERY_PASSWORD
    ) {
      await updateUser(mutableUser.id, {
        passwordChanged: false,
        forcePasswordReset: true,
        skipCurrentPassword: true,
      });
      mutableUser.passwordChanged = false;
      mutableUser.forcePasswordReset = true;
      mutableUser.skipCurrentPassword = true;
      return mutableUser;
    }

    // Se o usuário não tem senha definida, usar senha padrão
    if (!mutableUser.hashedPassword) {
      if (password === DEFAULT_PASSWORD) {
        mutableUser.forcePasswordReset = true;
        mutableUser.skipCurrentPassword = false;
        return mutableUser;
      }
      return null;
    }

    // Verificar senha com hash
    const isValid = await comparePassword(password, mutableUser.hashedPassword);
    if (!isValid) {
      return null;
    }

    if (mutableUser.forcePasswordReset && !mutableUser.skipCurrentPassword) {
      mutableUser.skipCurrentPassword = Boolean(user.skipCurrentPassword);
    }

    return mutableUser;
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return null;
  }
};

export const registerUser = async (userData: {
  username: string;
  role: 'admin' | 'user';
}): Promise<string> => {
  try {
    // Verificar se o usuário já existe
    const existingUser = await getUserByUsername(userData.username.toLowerCase());
    if (existingUser) {
      throw new Error('Nome de usuário já existe');
    }

    const newUser: Omit<User, 'id'> = {
      username: userData.username.toLowerCase(),
      role: userData.role,
      passwordChanged: false,
      hashedPassword: null, // Usuário novo, sem senha definida
      forcePasswordReset: true,
      skipCurrentPassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userId = await createUser(newUser);
    return userId;
  } catch (error) {
    console.error('Erro no cadastro:', error);
    throw error;
  }
};

export const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  try {
    const hashedPassword = await hashPassword(newPassword);
    
    await updateUser(userId, {
      passwordChanged: true,
      hashedPassword: hashedPassword,
      forcePasswordReset: false,
      skipCurrentPassword: false,
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, profileData: {
  email?: string;
  name?: string;
  pixKey?: string;
  photoURL?: string;
}): Promise<void> => {
  try {
    await updateUser(userId, profileData);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
};
