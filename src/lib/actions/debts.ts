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
import { randomUUID } from 'crypto';

const randomFromArray = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const formatCurrencyBRL = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const fillTemplate = (template: string, replacements: Record<string, string>): string =>
  template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? '');

const DEBT_CREATION_INSULTS = [
  'para de enrolar e paga essa merda logo.',
  'mais uma vergonha pra sua conta, chinelagem.',
  'isso aqui não é fiado infinito, caloteiro.',
  'espero que dessa vez você tenha vergonha na cara.',
  'se enrolar de novo, a gente publica no grupo, chinelagem.',
];

const PARTIAL_PAYMENT_INSULTS = [
  'a chinelagem pagou só um pedaço e acha que tá bonito.',
  'largou umas moedas e saiu correndo.',
  'deu só uma lasquinha desse débito miserável.',
  'soltou um fiapo de grana pra ver se engana.',
  'pagou de migalhas, mas ainda tá devendo pra caramba.',
];

const FULL_PAYMENT_INSULTS = [
  'até que enfim quitou essa merda, demorou mas veio.',
  'milagre: o caloteiro pagou tudo.',
  'pagou o valor inteiro, tá liberado de meia vergonha (por enquanto).',
  'finalmente acertou a conta completa, era hora.',
  'agora sim, sem resto pendurado. Por enquanto...',
];

const REMAINING_DEBT_INSULTS = [
  'ainda restam {valor}, não some não, chinelagem.',
  'sobra {valor} pra você pagar, trata de agilizar.',
  '{valor} continuam pendurados no seu nome, vergonha.',
  'não inventa moda: falta {valor}, vai pagando.',
  'se finge de morto não, falta {valor} e todo mundo tá vendo.',
];

const PARTIAL_PAYMENT_CREDITOR_NOTES = [
  '{nomeDevedor} deixou {valor} cair na sua conta, mas ainda falta {restante}.',
  '{nomeDevedor} pagou {valor}, guarda esse recibo porque sobra {restante}.',
  '{valor} pingou do(a) {nomeDevedor}, mas a novela continua com {restante} pendente.',
  '{nomeDevedor} soltou {valor}, cobra o resto ({restante}) sem dó.',
  '{nomeDevedor} pagou {valor}, falta arrancar {restante}.',
];

const FULL_PAYMENT_CREDITOR_NOTES = [
  '{nomeDevedor} pagou {valor} inteiro. Finalmente.',
  '{valor} caiu do bolso do(a) {nomeDevedor}. Fim da novela.',
  'Caloteiro nenhum: {nomeDevedor} quitou {valor}.',
  '{nomeDevedor} acertou {valor}. Pode respirar até a próxima chinelagem.',
];

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

    const chainId = randomUUID();

    const debtData: any = {
      creditorId: user.userId,
      debtorId,
      amount,
      dueDate: new Date(dueDate),
      status: 'OPEN' as const,
      originalAmount: amount,
      paidAmount: 0,
      remainingAmount: amount,
      totalPaidInChain: 0,
      chainId,
      wasPartialPayment: false,
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
      const actorName = actor?.username ?? actor?.name ?? 'Um usuário';
      const debtorDisplayName = debtor.name || debtor.username || 'caloteiro';
      const insult = randomFromArray(DEBT_CREATION_INSULTS);
      const formattedAmount = formatCurrencyBRL(amount);

      await createNotification({
        userId: debtor.id,
        type: 'debt_created',
        title: 'Nova dívida na sua lomba',
        message: `${actorName} registrou uma dívida de ${formattedAmount} pra você, ${debtorDisplayName}. ${insult}`,
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

export async function markDebtAsPaidAction(debtId: string, paymentValue?: number) {
  try {
    const user = await getAuthenticatedUser();
    const actor = await getUser(user.userId);

    const debt = await getDebt(debtId);

    if (!debt) {
      return { error: 'Dívida não encontrada' };
    }

    if (debt.status === 'PAID') {
      return { error: 'Essa dívida já foi finalizada' };
    }

    // Verificar permissões (apenas dono ou admin pode alterar)
    const canEdit = debt.creditorId === user.userId || user.role === 'admin';

    if (!canEdit) {
      return { error: 'Você não tem permissão para alterar esta dívida' };
    }

    const remainingAmount = Math.round(Number(debt.amount ?? 0) * 100) / 100;
    const requestedPayment = paymentValue ?? remainingAmount;
    const paymentAmount = Math.round(Number(requestedPayment) * 100) / 100;

    if (!Number.isFinite(paymentAmount) || Number.isNaN(paymentAmount)) {
      return { error: 'Valor de pagamento inválido' };
    }

    if (paymentAmount <= 0) {
      return { error: 'O valor pago deve ser maior que zero' };
    }

    if (paymentAmount > remainingAmount) {
      return { error: 'O valor pago não pode ser maior do que o que falta' };
    }

    const isPartialPayment = paymentAmount < remainingAmount;
    const chainId = debt.chainId ?? randomUUID();
    const originalAmount = Math.round(
      Number((debt.originalAmount ?? remainingAmount) as number) * 100,
    ) / 100;
    const previousTotalPaid = Math.round(Number(debt.totalPaidInChain ?? 0) * 100) / 100;
    const newTotalPaid = Math.round((previousTotalPaid + paymentAmount) * 100) / 100;
    const remainingAfterPayment = Math.max(
      0,
      Math.round((originalAmount - newTotalPaid) * 100) / 100,
    );

    await updateDebt(debtId, {
      status: 'PAID',
      amount: paymentAmount,
      paidAmount: paymentAmount,
      originalAmount,
      remainingAmount: remainingAfterPayment,
      totalPaidInChain: newTotalPaid,
      chainId,
      wasPartialPayment: isPartialPayment,
    });

    const debtor = await getUser(debt.debtorId);
    const creditor = await getUser(debt.creditorId);

    const formattedPaid = formatCurrencyBRL(paymentAmount);
    const formattedRemaining = formatCurrencyBRL(remainingAfterPayment);
    const actorName = actor?.username ?? actor?.name ?? 'Alguém';
    const debtorName = debtor?.name || debtor?.username || 'caloteiro';

    const debtorInsult = randomFromArray(isPartialPayment ? PARTIAL_PAYMENT_INSULTS : FULL_PAYMENT_INSULTS);
    const debtorNotificationMessage = isPartialPayment
      ? `${actorName} marcou ${formattedPaid} como pago. ${debtorInsult} Ainda falta ${formattedRemaining}.`
      : `${actorName} marcou ${formattedPaid} como pago. ${debtorInsult}`;

    if (debtor) {
      await createNotification({
        userId: debtor.id,
        type: 'debt_paid',
        title: isPartialPayment ? 'Pagamento parcial registrado' : 'Dívida quitada',
        message: debtorNotificationMessage,
        read: false,
        createdAt: new Date(),
      });
    }

    if (creditor && creditor.id !== user.userId) {
      const creditorTemplate = randomFromArray(
        isPartialPayment ? PARTIAL_PAYMENT_CREDITOR_NOTES : FULL_PAYMENT_CREDITOR_NOTES,
      );

      const creditorMessage = fillTemplate(creditorTemplate, {
        valor: formattedPaid,
        restante: formattedRemaining,
        nomeDevedor: debtorName,
      });

      await createNotification({
        userId: creditor.id,
        type: 'debt_paid',
        title: isPartialPayment ? 'Entrou um troco' : 'Dívida liquidada',
        message: creditorMessage,
        read: false,
        createdAt: new Date(),
      });
    }

    let newDebtId: string | null = null;

    if (isPartialPayment && remainingAfterPayment > 0) {
      const newDebtData: Omit<Debt, 'id'> = {
        creditorId: debt.creditorId,
        debtorId: debt.debtorId,
        amount: remainingAfterPayment,
        dueDate: debt.dueDate,
        status: 'OPEN' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        originalAmount,
        paidAmount: 0,
        remainingAmount: remainingAfterPayment,
        totalPaidInChain: newTotalPaid,
        chainId,
        parentDebtId: debt.id,
        wasPartialPayment: false,
        ...(debt.attachment ? { attachment: debt.attachment } : {}),
        ...(debt.description ? { description: debt.description } : {}),
      };

      newDebtId = await createDebt(newDebtData);

      if (debtor) {
        const remainderTemplate = randomFromArray(REMAINING_DEBT_INSULTS);
        const remainderMessage = fillTemplate(remainderTemplate, {
          valor: formattedRemaining,
          nome: debtorName,
        });

        await createNotification({
          userId: debtor.id,
          type: 'debt_created',
          title: 'Restinho dessa dívida',
          message: remainderMessage,
          read: false,
          createdAt: new Date(),
        });
      }
    }

    return {
      success: true,
      message: isPartialPayment
        ? 'Pagamento parcial registrado. O resto virou nova dívida.'
        : 'Dívida marcada como paga',
      newDebtId,
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
