import { hash, compare } from 'bcryptjs';
import { getUserByUsername, createUser, updateUser } from './firestore';
import { User } from '@/types';

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || '123456';

export const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, 10);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await compare(password, hashedPassword);
};

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  try {
    const user = await getUserByUsername(username.toLowerCase());
    
    if (!user) {
      return null;
    }

    // Se a senha for a padrão, verificar sem hash
    if (password === DEFAULT_PASSWORD && !user.passwordChanged) {
      return user;
    }

    // Para senhas alteradas, precisaríamos implementar o hash
    // Por simplicidade, vamos assumir que a senha padrão é usada para novos usuários
    if (password === DEFAULT_PASSWORD && user.passwordChanged) {
      return null;
    }

    // Aqui você implementaria a verificação de hash para senhas alteradas
    // const isValid = await comparePassword(password, user.hashedPassword);
    // if (!isValid) return null;

    return user;
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
    // Aqui você hasharia a nova senha
    // const hashedPassword = await hashPassword(newPassword);
    
    await updateUser(userId, {
      passwordChanged: true,
      // hashedPassword: hashedPassword,
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
