'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '../auth-server';
import { registerUser, updateUserPassword, updateUserProfile } from '../auth-server';
import { uploadPhotoAction } from './upload';
import { User } from '@/types';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const payload = verifyToken(token);

  if (!payload) {
    throw new Error('Token inválido');
  }

  return payload;
}

async function requireAdmin() {
  const user = await getAuthenticatedUser();
  
  if (user.role !== 'admin') {
    throw new Error('Apenas administradores podem realizar esta ação');
  }

  return user;
}

export async function registerUserAction(formData: FormData) {
  try {
    await requireAdmin();

    const username = formData.get('username') as string;
    const role = formData.get('role') as 'admin' | 'user';

    if (!username || !role) {
      return { error: 'Username e role são obrigatórios' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { error: 'Nome de usuário deve conter apenas letras, números e underscore' };
    }

    if (role !== 'admin' && role !== 'user') {
      return { error: 'Role deve ser admin ou user' };
    }

    const userId = await registerUser({ username, role });

    return {
      success: true,
      userId,
      message: 'Usuário cadastrado com sucesso',
    };
  } catch (error) {
    console.error('Erro no cadastro:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Nome de usuário já existe') {
        return { error: error.message };
      }
      if (error.message.includes('administradores')) {
        return { error: error.message };
      }
    }

    return { error: 'Erro interno do servidor' };
  }
}

export async function updatePasswordAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    const newPassword = formData.get('newPassword') as string;

    if (!newPassword) {
      return { error: 'Nova senha é obrigatória' };
    }

    if (newPassword.length < 6) {
      return { error: 'A senha deve ter pelo menos 6 caracteres' };
    }

    await updateUserPassword(user.userId, newPassword);

    return {
      success: true,
      message: 'Senha atualizada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function updateProfileAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const pixKey = formData.get('pixKey') as string;
    const photoURL = formData.get('photoURL') as string;

    // Validar email se fornecido
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: 'Email inválido' };
    }

    const profileData: any = {};
    if (email !== undefined && email !== '') profileData.email = email;
    if (name !== undefined && name !== '') profileData.name = name;
    if (pixKey !== undefined && pixKey !== '') profileData.pixKey = pixKey;
    if (photoURL !== undefined && photoURL !== '') profileData.photoURL = photoURL;

    await updateUserProfile(user.userId, profileData);

    return {
      success: true,
      message: 'Perfil atualizado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function updateUserProfileAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const pixKey = formData.get('pixKey') as string;
    const photo = formData.get('photo') as File;

    if (!name || name.trim() === '') {
      return { error: 'Nome é obrigatório' };
    }

    // Validar email se fornecido
    if (email && email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: 'Email inválido' };
    }

    const profileData: any = {
      name: name.trim(),
    };
    
    if (email && email.trim() !== '') {
      profileData.email = email.trim();
    }
    
    if (pixKey && pixKey.trim() !== '') {
      profileData.pixKey = pixKey.trim();
    }

    // Se há uma foto para upload
    if (photo && photo.size > 0) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('photo', photo);
        
        const uploadResult = await uploadPhotoAction(uploadFormData);
        
        if (uploadResult.error) {
          return { error: uploadResult.error };
        }
        
        if (uploadResult.success && uploadResult.photoURL) {
          profileData.photoURL = uploadResult.photoURL;
        }
      } catch (error) {
        console.error('Erro no upload da foto:', error);
        return { error: 'Erro ao fazer upload da foto' };
      }
    }

    const updatedUser = await updateUserProfile(user.userId, profileData);

    return {
      success: true,
      user: updatedUser,
      message: 'Perfil atualizado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return { error: 'Erro interno do servidor' };
  }
}