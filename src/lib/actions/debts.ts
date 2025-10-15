'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '../auth-server';
import { getOpenDebts, getAllUsers, createDebt, getDebt, updateDebt, deleteDebt } from '../firestore-server';
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

    const debtorId = formData.get('debtorId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const dueDate = formData.get('dueDate') as string;
    const description = formData.get('description') as string;

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

    const debtId = await createDebt(debtData);

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

    return {
      success: true,
      message: 'Dívida deletada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao deletar dívida:', error);
    return { error: 'Erro interno do servidor' };
  }
}
