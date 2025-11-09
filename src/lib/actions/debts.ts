'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '../auth-server';
import {
  getOpenDebts,
  getPaidDebts,
  getAllUsers,
  createDebt,
  getDebt,
  updateDebt,
  deleteDebt,
  createNotification,
  getUser,
} from '../firestore-server';
import { uploadPhotoAction } from './upload';
import { Debt, User } from '@/types';

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

export async function getDebtsAction() {
  try {
    await getAuthenticatedUser();

    const [debts, users] = await Promise.all([
      getOpenDebts(),
      getAllUsers()
    ]);

    return {
      success: true,
      debts,
      users,
    };
  } catch (error) {
    console.error('Erro ao buscar dívidas:', error);
    return {
      success: false,
      error: 'Erro interno do servidor',
      debts: [],
      users: [],
    };
  }
}

export async function getPaidDebtsAction() {
  try {
    await getAuthenticatedUser();

    const [debts, users] = await Promise.all([
      getPaidDebts(),
      getAllUsers()
    ]);

    return {
      success: true,
      debts,
      users,
    };
  } catch (error) {
    console.error('Erro ao buscar dívidas pagas:', error);
    return {
      success: false,
      error: 'Erro interno do servidor',
      debts: [],
      users: [],
    };
  }
}

export async function getUsersAction() {
  try {
    await getAuthenticatedUser();

    const users = await getAllUsers();

    return {
      success: true,
      users,
    };
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return {
      success: false,
      error: 'Erro interno do servidor',
      users: [],
    };
  }
}

export async function createDebtAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const actor = await getUser(user.userId);

    const debtorId = formData.get('debtorId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const dueDate = formData.get('dueDate') as string;
    const description = formData.get('description') as string;
    const attachment = formData.get('attachment') as File;

    if (!debtorId || !amount || !dueDate) {
      return { error: 'Devedor, valor e data de vencimento são obrigatórios' };
    }

    if (amount <= 0) {
      return { error: 'O valor deve ser maior que zero' };
    }

    if (debtorId === user.userId) {
      return { error: 'Você não pode criar uma dívida para si mesmo' };
    }

    const debtData: any = {
      creditorId: user.userId,
      debtorId,
      amount,
      dueDate: new Date(dueDate),
      status: 'OPEN' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Só adiciona description se não estiver vazio
    if (description && description.trim() !== '') {
      debtData.description = description.trim();
    }

    // Processar anexo se fornecido
    if (attachment && attachment.size > 0) {
      // Validar tipo de arquivo
      if (!attachment.type.startsWith('image/')) {
        return { error: 'Apenas arquivos de imagem são permitidos' };
      }

      // Validar tamanho (máximo 5MB)
      if (attachment.size > 5 * 1024 * 1024) {
        return { error: 'A imagem deve ter no máximo 5MB' };
      }

      try {
        const uploadFormData = new FormData();
        uploadFormData.append('photo', attachment);
        
        const uploadResult = await uploadPhotoAction(uploadFormData);
        
        if (uploadResult.error) {
          return { error: uploadResult.error };
        }
        
        if (uploadResult.success && uploadResult.photoURL) {
          debtData.attachment = uploadResult.photoURL;
        }
      } catch (error) {
        console.error('Erro no upload do anexo:', error);
        return { error: 'Erro ao fazer upload do anexo' };
      }
    }

    const debtId = await createDebt(debtData);

    const debtor = await getUser(debtorId);

    if (debtor) {
      await createNotification({
        userId: debtor.id,
        type: 'debt_created',
        title: 'Nova dívida criada',
        message: `${actor?.username ?? 'Um usuário'} registrou uma dívida de R$ ${amount.toFixed(
          2,
        )} para você.`,
        read: false,
        createdAt: new Date(),
      });
    }

    return {
      success: true,
      debtId,
      message: 'Dívida criada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao criar dívida:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function updateDebtAction(debtId: string, formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const actor = await getUser(user.userId);

    const debt = await getDebt(debtId);

    if (!debt) {
      return { error: 'Dívida não encontrada' };
    }

    // Verificar permissões (apenas dono ou admin pode alterar)
    const canEdit = debt.creditorId === user.userId || user.role === 'admin';

    if (!canEdit) {
      return { error: 'Você não tem permissão para alterar esta dívida' };
    }

    const status = formData.get('status') as string;
    const amount = formData.get('amount') ? parseFloat(formData.get('amount') as string) : undefined;
    const dueDate = formData.get('dueDate') as string;
    const description = formData.get('description') as string;

    const updateData: any = {};
    if (status !== undefined && status !== '') updateData.status = status;
    if (amount !== undefined) updateData.amount = amount;
    if (dueDate !== undefined && dueDate !== '') updateData.dueDate = new Date(dueDate);
    if (description !== undefined && description.trim() !== '') {
      updateData.description = description.trim();
    }

    await updateDebt(debtId, updateData);

    const updatedAmount = typeof updateData.amount === 'number' ? updateData.amount : debt.amount;
    const recipients = [debt.creditorId, debt.debtorId].filter((id) => id !== user.userId);
    await Promise.all(
      recipients.map(async (recipientId) => {
        const recipient = await getUser(recipientId);
        if (!recipient) return;
        await createNotification({
          userId: recipient.id,
          type: 'debt_updated',
          title: 'Dívida atualizada',
          message: `${actor?.username ?? 'Um usuário'} atualizou a dívida. Valor atual: R$ ${updatedAmount.toFixed(
            2,
          )}.`,
          read: false,
          createdAt: new Date(),
        });
      }),
    );

    return {
      success: true,
      message: 'Dívida atualizada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao atualizar dívida:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function markDebtAsPaidAction(debtId: string) {
  try {
    const user = await getAuthenticatedUser();
    const actor = await getUser(user.userId);

    const debt = await getDebt(debtId);

    if (!debt) {
      return { error: 'Dívida não encontrada' };
    }

    // Verificar permissões (apenas dono ou admin pode alterar)
    const canEdit = debt.creditorId === user.userId || user.role === 'admin';

    if (!canEdit) {
      return { error: 'Você não tem permissão para alterar esta dívida' };
    }

    await updateDebt(debtId, { status: 'PAID' });

    const recipients = [debt.creditorId, debt.debtorId].filter((id) => id !== user.userId);
    await Promise.all(
      recipients.map(async (recipientId) => {
        const recipient = await getUser(recipientId);
        if (!recipient) return;
        await createNotification({
          userId: recipient.id,
          type: 'debt_paid',
          title: 'Dívida marcada como paga',
          message: `${actor?.username ?? 'Um usuário'} marcou a dívida de R$ ${debt.amount.toFixed(
            2,
          )} como paga.`,
          read: false,
          createdAt: new Date(),
        });
      }),
    );

    return {
      success: true,
      message: 'Dívida marcada como paga',
    };
  } catch (error) {
    console.error('Erro ao marcar dívida como paga:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function deleteDebtAction(debtId: string) {
  try {
    const user = await getAuthenticatedUser();
    const actor = await getUser(user.userId);

    const debt = await getDebt(debtId);

    if (!debt) {
      return { error: 'Dívida não encontrada' };
    }

    // Verificar permissões (apenas dono ou admin pode deletar)
    const canDelete = debt.creditorId === user.userId || user.role === 'admin';

    if (!canDelete) {
      return { error: 'Você não tem permissão para deletar esta dívida' };
    }

    await deleteDebt(debtId);

    const recipients = [debt.creditorId, debt.debtorId].filter((id) => id !== user.userId);
    await Promise.all(
      recipients.map(async (recipientId) => {
        const recipient = await getUser(recipientId);
        if (!recipient) return;
        await createNotification({
          userId: recipient.id,
          type: 'debt_deleted',
          title: 'Dívida removida',
          message: `${actor?.username ?? 'Um usuário'} removeu uma dívida de R$ ${debt.amount.toFixed(
            2,
          )}.`,
          read: false,
          createdAt: new Date(),
        });
      }),
    );

    return {
      success: true,
      message: 'Dívida deletada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao deletar dívida:', error);
    return { error: 'Erro interno do servidor' };
  }
}
