'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticateUser, generateToken, verifyToken } from '../auth-server';
import { getUser } from '../firestore-server';
import { User } from '@/types';

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username e senha são obrigatórios' };
  }

  try {
    const user = await authenticateUser(username, password);
    console.log('user', user);
    console.log('password', password);
    if (!user) {
      return { error: 'Credenciais inválidas' };
    }

    const token = generateToken(user);

    // Definir cookie seguro
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: '/',
    });

    return { success: true, user };
  } catch (error) {
    console.error('Erro no login:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    redirect('/');
  } catch (error) {
    console.error('Erro no logout:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);

    if (!payload) {
      return null;
    }

    const user = await getUser(payload.userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      pixKey: user.pixKey,
      photoURL: user.photoURL,
      role: user.role,
      passwordChanged: user.passwordChanged,
      forcePasswordReset: user.forcePasswordReset ?? !user.passwordChanged,
      skipCurrentPassword: user.skipCurrentPassword ?? false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return null;
  }
}
