'use server';

import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { verifyToken } from '../auth-server';
import { registerUser, updateUserPassword, updateUserProfile, hashPassword } from '../auth-server';
import { getAllUsers, getUser, updateUser, getUserByUsername } from '../firestore-server';
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

export async function getUsersAction() {
  try {
    await requireAdmin();

    const users = await getAllUsers();

    return JSON.parse(JSON.stringify({
      success: true,
      users: users.map((user: User) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        name: user.name,
        pixKey: user.pixKey,
        phone: user.phone,
        steamProfile: user.steamProfile,
        birthDate: user.birthDate,
        passwordChanged: user.passwordChanged,
        forcePasswordReset: user.forcePasswordReset ?? !user.passwordChanged,
        skipCurrentPassword: user.skipCurrentPassword ?? false,
        updatedAt: user.updatedAt,
      })),
    }));
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function getPublicUserListAction() {
  try {
    const users = await getAllUsers();

    return JSON.parse(JSON.stringify({
      success: true,
      users: users.map((user: User) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        photoURL: user.photoURL,
        birthDate: user.birthDate,
      })),
    }));
  } catch (error) {
    console.error('Erro ao buscar lista pública de usuários:', error);
    return { error: 'Erro interno do servidor' };
  }
}

function generateTemporaryPassword(length = 10) {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
  const bytes = randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i += 1) {
    password += charset[bytes[i] % charset.length];
  }

  return password;
}

export async function resetUserPasswordAction(formData: FormData) {
  try {
    await requireAdmin();

    const userId = formData.get('userId') as string;

    if (!userId) {
      return { error: 'ID do usuário é obrigatório' };
    }

    const user = await getUser(userId);

    if (!user) {
      return { error: 'Usuário não encontrado' };
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    await updateUser(userId, {
      hashedPassword,
      passwordChanged: false,
      forcePasswordReset: true,
      skipCurrentPassword: true,
    });

    return {
      success: true,
      userId,
      username: user.username,
      temporaryPassword,
    };
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
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
    const phone = formData.get('phone') as string;
    const steamProfile = formData.get('steamProfile') as string;
    const birthDate = formData.get('birthDate') as string;
    const photo = formData.get('photo') as File;

    if (!name || name.trim() === '') {
      return { error: 'Nome é obrigatório' };
    }

    // Validar email se fornecido
    if (email && email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: 'Email inválido' };
    }

    // Validar telefone se fornecido
    if (phone && phone.trim() !== '' && !/^\+[0-9]{11,15}$/.test(phone.trim())) {
      return { error: 'Telefone inválido. Formato esperado: +5511987654321 (código do país + DDD + número)' };
    }

    // Validar Steam Profile se fornecido
    if (steamProfile && steamProfile.trim() !== '') {
      try {
        const url = new URL(steamProfile.trim());
        if (!url.hostname.includes('steamcommunity.com')) {
          return { error: 'URL inválida. Deve ser um link do Steam Community (steamcommunity.com)' };
        }
      } catch (e) {
        return { error: 'URL da Steam inválida. Use o formato: https://steamcommunity.com/id/seu-usuario' };
      }
    }

    const profileData: any = {
      name: name.trim(),
    };

    if (email && email.trim() !== '') {
      profileData.email = email.trim();
    } else {
      profileData.email = null;
    }

    if (pixKey && pixKey.trim() !== '') {
      profileData.pixKey = pixKey.trim();
    } else {
      profileData.pixKey = null;
    }

    if (phone && phone.trim() !== '') {
      profileData.phone = phone.trim();
    } else {
      profileData.phone = null;
    }

    if (steamProfile && steamProfile.trim() !== '') {
      profileData.steamProfile = steamProfile.trim();
    } else {
      profileData.steamProfile = null;
    }

    if (birthDate && birthDate.trim() !== '') {
      profileData.birthDate = birthDate.trim();
    } else {
      profileData.birthDate = null;
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

export async function updateUserByAdminAction(formData: FormData) {
  try {
    await requireAdmin();

    const userId = formData.get('userId') as string;
    const username = formData.get('username') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const pixKey = formData.get('pixKey') as string;
    const phone = formData.get('phone') as string;
    const steamProfile = formData.get('steamProfile') as string;
    const birthDate = formData.get('birthDate') as string;
    const role = formData.get('role') as 'admin' | 'user';

    if (!userId) {
      return { error: 'ID do usuário é obrigatório' };
    }

    const user = await getUser(userId);
    if (!user) {
      return { error: 'Usuário não encontrado' };
    }

    const updateData: any = {};

    // Atualizar username se fornecido e diferente do atual
    if (username && username.trim() !== '') {
      const newUsername = username.trim().toLowerCase();

      // Validar formato do username
      if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
        return { error: 'Nome de usuário deve conter apenas letras, números e underscore' };
      }

      // Verificar se o username já existe (exceto se for o mesmo usuário)
      if (newUsername !== user.username) {
        const existingUser = await getUserByUsername(newUsername);
        if (existingUser && existingUser.id !== userId) {
          return { error: 'Nome de usuário já existe' };
        }
      }

      updateData.username = newUsername;
    }

    // Atualizar nome completo
    if (name !== null && name !== undefined) {
      updateData.name = name.trim() || null;
    }

    // Atualizar email
    if (email !== null && email !== undefined) {
      const emailValue = email.trim();
      if (emailValue === '') {
        updateData.email = null;
      } else {
        // Validar email se fornecido
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
          return { error: 'Email inválido' };
        }
        updateData.email = emailValue;
      }
    }

    // Atualizar telefone
    if (phone !== null && phone !== undefined) {
      const phoneValue = phone.trim();
      if (phoneValue === '') {
        updateData.phone = null;
      } else {
        // Validar formato do telefone (+ seguido de 11 a 15 dígitos)
        if (!/^\+[0-9]{11,15}$/.test(phoneValue)) {
          return { error: 'Telefone inválido. Formato esperado: +5511987654321 (código do país + DDD + número)' };
        }
        updateData.phone = phoneValue;
      }
    }

    // Atualizar chave PIX
    if (pixKey !== null && pixKey !== undefined) {
      updateData.pixKey = pixKey.trim() || null;
    }

    // Atualizar perfil da Steam
    if (steamProfile !== null && steamProfile !== undefined) {
      const steamValue = steamProfile.trim();
      if (steamValue === '') {
        updateData.steamProfile = null;
      } else {
        // Validar URL da Steam
        try {
          const url = new URL(steamValue);
          if (!url.hostname.includes('steamcommunity.com')) {
            return { error: 'URL inválida. Deve ser um link do Steam Community (steamcommunity.com)' };
          }
          updateData.steamProfile = steamValue;
        } catch (e) {
          return { error: 'URL da Steam inválida. Use o formato: https://steamcommunity.com/id/seu-usuario' };
        }
      }
    }

    // Atualizar data de nascimento
    if (birthDate !== null && birthDate !== undefined) {
      updateData.birthDate = birthDate.trim() || null;
    }

    // Atualizar papel (role) do usuário
    if (role && (role === 'admin' || role === 'user')) {
      // Se está removendo privilégios de admin, verificar se não é o último admin
      if (user.role === 'admin' && role === 'user') {
        const allUsers = await getAllUsers();
        const adminCount = allUsers.filter((u: User) => u.role === 'admin' && u.id !== userId).length;

        if (adminCount === 0) {
          return { error: 'Não é possível remover os privilégios do último administrador. Deve haver pelo menos um administrador no sistema.' };
        }
      }

      updateData.role = role;
    }

    // Atualizar usuário
    await updateUser(userId, updateData);

    return {
      success: true,
      message: 'Usuário atualizado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);

    if (error instanceof Error) {
      if (error.message.includes('administradores')) {
        return { error: error.message };
      }
    }

    return { error: 'Erro interno do servidor' };
  }
}