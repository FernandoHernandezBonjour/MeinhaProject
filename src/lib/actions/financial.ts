'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '../auth-server';
import {
  createBankAccount,
  getBankAccountsByUser,
  getBankAccount,
  updateBankAccount,
  deleteBankAccount,
  createCreditCard,
  getCreditCardsByUser,
  getCreditCard,
  updateCreditCard,
  deleteCreditCard,
  createTransaction,
  getTransactionsByUser,
  getTransaction,
  deleteTransaction,
  createInvoice,
  getInvoice,
  getInvoicesByCard,
  updateInvoice,
  updateTransaction,
  getUser,
} from '../firestore-server';
import {
  BankAccount,
  CreditCard,
  Transaction,
  Invoice,
  TransactionType,
  PaymentMethod,
  TransactionStatus
} from '@/types/financial';
import { revalidatePath } from 'next/cache';
import { getInvoicePeriod } from '../financial-utils';
import { randomUUID } from 'crypto';

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

// Bank Accounts
export async function getBankAccountsAction() {
  try {
    const user = await getAuthenticatedUser();
    const accounts = await getBankAccountsByUser(user.userId);
    return { success: true, accounts };
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    return { success: false, error: 'Erro ao buscar contas bancárias' };
  }
}

export async function createBankAccountAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const accounts = await getBankAccountsByUser(user.userId);

    if (accounts.length >= 3) {
      return { success: false, error: 'Limite de 3 contas bancárias atingido.' };
    }

    const name = formData.get('name') as string;
    const initialBalance = parseFloat(formData.get('initialBalance') as string || '0');

    if (!name) {
      return { success: false, error: 'Nome da conta é obrigatório.' };
    }

    const accountData: Omit<BankAccount, 'id'> = {
      userId: user.userId,
      name,
      initialBalance,
      currentBalance: initialBalance,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await createBankAccount(accountData);
    revalidatePath('/financial');
    return { success: true, id };
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return { success: false, error: 'Erro ao criar conta bancária' };
  }
}

export async function deleteBankAccountAction(id: string) {
  try {
    await getAuthenticatedUser();
    // No futuro, poderíamos checar se há transações vinculadas
    await deleteBankAccount(id);
    revalidatePath('/financial');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    return { success: false, error: 'Erro ao deletar conta bancária' };
  }
}

export async function recalibrateAccountBalanceAction(accountId: string) {
  try {
    const user = await getAuthenticatedUser();
    const account = await getBankAccount(accountId);
    if (!account) return { success: false, error: 'Conta não encontrada' };
    if (account.userId !== user.userId) return { success: false, error: 'Não autorizado' };

    const transactions = await getTransactionsByUser(user.userId);

    // Filtra transações dessa conta que estão PAGAS
    const accountTransactions = transactions.filter(t =>
      t.bankAccountId === accountId &&
      t.status === 'PAID' &&
      t.paymentMethod === 'BANK_ACCOUNT'
    );

    const totalIncome = accountTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = accountTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const correctBalance = account.initialBalance + totalIncome - totalExpense;

    await updateBankAccount(accountId, { currentBalance: correctBalance });
    revalidatePath('/financial');
    return { success: true, newBalance: correctBalance };
  } catch (error) {
    console.error('Erro ao recalibrar conta:', error);
    return { success: false, error: 'Erro ao recalibrar saldo da conta' };
  }
}

export async function updateBankAccountAction(id: string, formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const name = formData.get('name') as string;
    const initialBalance = parseFloat(formData.get('initialBalance') as string || '0');

    if (!name) {
      return { success: false, error: 'Nome da conta é obrigatório.' };
    }

    await updateBankAccount(id, { name, initialBalance });

    // Auto-recalibrate to ensure consistency with new initial balance
    await recalibrateAccountBalanceAction(id);

    revalidatePath('/financial');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    return { success: false, error: 'Erro ao atualizar conta bancária' };
  }
}

// Credit Cards
export async function getCreditCardsAction() {
  try {
    const user = await getAuthenticatedUser();
    const cards = await getCreditCardsByUser(user.userId);
    return { success: true, cards };
  } catch (error) {
    console.error('Erro ao buscar cartões:', error);
    return { success: false, error: 'Erro ao buscar cartões de crédito' };
  }
}

export async function getTransactionsAction(filters?: any) {
  try {
    const user = await getAuthenticatedUser();
    const transactions = await getTransactionsByUser(user.userId, filters);
    return { success: true, transactions };
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return { success: false, error: 'Erro ao buscar transações' };
  }
}

export async function getInvoicesAction() {
  try {
    const user = await getAuthenticatedUser();
    const cards = await getCreditCardsByUser(user.userId);
    let allInvoices: Invoice[] = [];

    for (const card of cards) {
      const cardInvoices = await getInvoicesByCard(card.id);
      allInvoices = [...allInvoices, ...cardInvoices];
    }

    return { success: true, invoices: allInvoices };
  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    return { success: false, error: 'Erro ao buscar faturas' };
  }
}

export async function createCreditCardAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const cards = await getCreditCardsByUser(user.userId);

    if (cards.length >= 5) {
      return { success: false, error: 'Limite de 5 cartões de crédito atingido.' };
    }

    const name = formData.get('name') as string;
    const limit = parseFloat(formData.get('limit') as string || '0');
    const closingDay = parseInt(formData.get('closingDay') as string || '1');
    const dueDay = parseInt(formData.get('dueDay') as string || '1');

    if (!name || !limit) {
      return { success: false, error: 'Nome e limite são obrigatórios.' };
    }

    const cardData: Omit<CreditCard, 'id'> = {
      userId: user.userId,
      name,
      limit,
      availableLimit: limit,
      closingDay,
      dueDay,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await createCreditCard(cardData);
    revalidatePath('/financial');
    return { success: true, id };
  } catch (error) {
    console.error('Erro ao criar cartão:', error);
    return { success: false, error: 'Erro ao criar cartão de crédito' };
  }
}

export async function deleteCreditCardAction(id: string) {
  try {
    await getAuthenticatedUser();
    // No futuro, poderíamos checar se há transações/faturas abertas
    await deleteCreditCard(id);
    revalidatePath('/financial');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar cartão:', error);
    return { success: false, error: 'Erro ao deletar cartão de crédito' };
  }
}

export async function recalibrateCreditCardLimitAction(cardId: string) {
  try {
    const user = await getAuthenticatedUser();
    const card = await getCreditCard(cardId);
    if (!card) return { success: false, error: 'Cartão não encontrado' };

    const transactions = await getTransactionsByUser(user.userId);

    // O limite usado é a soma de todas as transações de cartão que ainda estão PENDENTES
    // (Pois quando a fatura é paga, as transações mudam para PAID e o limite é liberado)
    const usedAmount = transactions
      .filter(t => t.creditCardId === cardId && t.paymentMethod === 'CREDIT_CARD' && t.status === 'PENDING')
      .reduce((sum, t) => sum + t.amount, 0);

    const correctAvailableLimit = card.limit - usedAmount;

    await updateCreditCard(cardId, { availableLimit: correctAvailableLimit });
    revalidatePath('/financial');
    return { success: true };
  } catch (error) {
    console.error('Erro ao recalibrar cartão:', error);
    return { success: false, error: 'Erro ao recalibrar limite do cartão' };
  }
}

// Transactions
export async function createTransactionAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    const description = formData.get('description') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const dateStr = formData.get('date') as string;
    const type = formData.get('type') as TransactionType;
    const category = formData.get('category') as string;
    const paymentMethod = formData.get('paymentMethod') as PaymentMethod;
    const bankAccountId = formData.get('bankAccountId') as string;
    const creditCardId = formData.get('creditCardId') as string;
    const status = formData.get('status') as TransactionStatus || (paymentMethod === 'CREDIT_CARD' ? 'PENDING' : 'PAID');

    // Novas opções
    const isRecurring = formData.get('isRecurring') === 'true';
    const numInstallments = parseInt(formData.get('installments') as string || '1');

    if (!description || !amount || !dateStr || !type || !category || !paymentMethod) {
      return { success: false, error: 'Todos os campos obrigatórios devem ser preenchidos.' };
    }

    // Fix Date: Criar data ao meio-dia para evitar problemas de fuso horário
    const [y, m, d] = dateStr.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d, 12, 0, 0);
    const groupId = (numInstallments > 1 || isRecurring) ? randomUUID() : undefined;

    // Se for fixo (recurring) e não for cartão, podemos criar apenas a primeira 
    // ou as próximas 12. Para simplificar e manter controle real, vamos criar as próximas 12.
    // Se for parcelado, criamos as N parcelas.
    const occurrences = isRecurring ? 12 : numInstallments;

    for (let i = 0; i < occurrences; i++) {
      const transactionDate = new Date(baseDate);
      transactionDate.setMonth(baseDate.getMonth() + i);

      const installmentAmount = numInstallments > 1 ? amount / numInstallments : amount;

      const transactionData: Omit<Transaction, 'id'> = {
        userId: user.userId,
        description: numInstallments > 1 ? `${description} (${i + 1}/${numInstallments})` : description,
        amount: installmentAmount,
        date: transactionDate,
        type,
        category,
        paymentMethod,
        status: i === 0 ? status : 'PENDING',
        isRecurring: isRecurring,
        groupId: groupId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (numInstallments > 1) {
        transactionData.installments = {
          current: i + 1,
          total: numInstallments,
          groupId: groupId!,
        };
      }

      if (paymentMethod === 'BANK_ACCOUNT') {
        if (!bankAccountId) return { success: false, error: 'Conta bancária é obrigatória.' };
        transactionData.bankAccountId = bankAccountId;

        // Apenas atualiza o saldo da conta se a transação for para a data atual (ou passada) e estiver PAGA
        if (i === 0 && transactionData.status === 'PAID') {
          const account = await getBankAccount(bankAccountId);
          if (account) {
            const newBalance = type === 'INCOME'
              ? account.currentBalance + installmentAmount
              : account.currentBalance - installmentAmount;
            await updateBankAccount(bankAccountId, { currentBalance: newBalance });
          }
        }
      } else if (paymentMethod === 'CREDIT_CARD') {
        if (!creditCardId) return { success: false, error: 'Cartão de crédito é obrigatório.' };
        transactionData.creditCardId = creditCardId;

        const card = await getCreditCard(creditCardId);
        if (card && type === 'EXPENSE') {
          // Lógica de Fatura para cada parcela
          const { month, year, dueDate, closingDate } = getInvoicePeriod(transactionDate, card.closingDay, card.dueDay);

          const invoices = await getInvoicesByCard(creditCardId);
          let invoice = invoices.find(inv => inv.month === month && inv.year === year);

          if (!invoice) {
            const invoiceId = await createInvoice({
              userId: user.userId,
              creditCardId,
              month,
              year,
              totalAmount: installmentAmount,
              status: 'OPEN',
              dueDate,
              closingDate,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            transactionData.invoiceId = invoiceId;
          } else {
            await updateInvoice(invoice.id, { totalAmount: invoice.totalAmount + installmentAmount });
            transactionData.invoiceId = invoice.id;
          }

          // Reduzir limite apenas na criação (o total da compra reduz o limite livre)
          if (i === 0) {
            await updateCreditCard(creditCardId, { availableLimit: card.availableLimit - amount });
          }
        }
      }

      await createTransaction(transactionData);
    }

    revalidatePath('/financial');
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return { success: false, error: 'Erro ao registrar transação' };
  }
}

export async function updateTransactionAction(id: string, formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const transaction = await getTransaction(id);

    if (!transaction) return { success: false, error: 'Transação não encontrada.' };
    if (transaction.userId !== user.userId) return { success: false, error: 'Não autorizado.' };

    const description = formData.get('description') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const dateStr = formData.get('date') as string;
    const type = formData.get('type') as TransactionType;
    const category = formData.get('category') as string;
    const status = formData.get('status') as TransactionStatus;

    // Para simplificar, não vamos permitir mudar conta/cartão na edição por enquanto
    // pois envolveria estornar saldos antigos e aplicar novos.

    if (!description || !amount || !dateStr || !type || !category || !status) {
      return { success: false, error: 'Todos os campos obrigatórios devem ser preenchidos.' };
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const newDate = new Date(y, m - 1, d, 12, 0, 0);

    // Se houve mudança de status, precisamos ajustar o saldo (para contas bancárias)
    // Se era PENDING e virou PAID -> Aplica o valor
    // Se era PAID e virou PENDING -> Estorna o valor
    if (transaction.paymentMethod === 'BANK_ACCOUNT' && transaction.bankAccountId) {
      const account = await getBankAccount(transaction.bankAccountId);
      if (account) {
        let balanceChange = 0;

        // Caso 1: Mudou de PENDING para PAID
        if (transaction.status === 'PENDING' && status === 'PAID') {
          balanceChange = type === 'INCOME' ? amount : -amount;
        }
        // Caso 2: Mudou de PAID para PENDING
        else if (transaction.status === 'PAID' && status === 'PENDING') {
          balanceChange = type === 'INCOME' ? -transaction.amount : transaction.amount; // Nota: usa transaction.amount original para estorno exato
        }
        // Caso 3: Já era PAID e mudou o valor (amount)
        else if (transaction.status === 'PAID' && status === 'PAID' && amount !== transaction.amount) {
          const oldImpact = transaction.type === 'INCOME' ? transaction.amount : -transaction.amount;
          const newImpact = type === 'INCOME' ? amount : -amount;
          balanceChange = newImpact - oldImpact;
        }

        if (balanceChange !== 0) {
          await updateBankAccount(transaction.bankAccountId, {
            currentBalance: account.currentBalance + balanceChange
          });
        }
      }
    }

    // Atualiza a transação
    await updateTransaction(id, {
      description,
      amount,
      date: newDate,
      type,
      category,
      status,
      updatedAt: new Date()
    });

    revalidatePath('/financial');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return { success: false, error: 'Erro ao atualizar transação' };
  }
}

export async function deleteTransactionAction(id: string, deleteAllInGroup: boolean = false) {
  try {
    const user = await getAuthenticatedUser();
    const transaction = await getTransaction(id);

    if (!transaction) return { success: false, error: 'Transação não encontrada' };

    const transactionsToDelete = [];

    if (deleteAllInGroup && transaction.groupId) {
      const allTransactions = await getTransactionsByUser(user.userId);
      transactionsToDelete.push(...allTransactions.filter(t => t.groupId === transaction.groupId));
    } else {
      transactionsToDelete.push(transaction);
    }

    for (const t of transactionsToDelete) {
      // Estornar impacto financeiro se estiver PAGA (para pagamentos diretos em conta)
      if (t.status === 'PAID' && t.paymentMethod === 'BANK_ACCOUNT' && t.bankAccountId) {
        const account = await getBankAccount(t.bankAccountId);
        if (account) {
          const newBalance = t.type === 'INCOME'
            ? account.currentBalance - t.amount
            : account.currentBalance + t.amount;
          await updateBankAccount(t.bankAccountId, { currentBalance: newBalance });
        }
      }

      // Estornar impacto no cartão se for despesa no cartão
      if (t.paymentMethod === 'CREDIT_CARD' && t.creditCardId) {
        const card = await getCreditCard(t.creditCardId);

        let shouldRefundLimit = true;
        if (t.invoiceId) {
          const invoice = await getInvoice(t.invoiceId);
          if (invoice && invoice.status === 'PAID') {
            shouldRefundLimit = false;
          }
        }

        if (card && shouldRefundLimit) {
          await updateCreditCard(t.creditCardId, {
            availableLimit: Math.min(card.limit, card.availableLimit + t.amount)
          });
        }

        if (t.invoiceId && shouldRefundLimit) {
          const invoice = await getInvoice(t.invoiceId);
          if (invoice) {
            await updateInvoice(t.invoiceId, {
              totalAmount: Math.max(0, invoice.totalAmount - t.amount)
            });
          }
        }
      }

      await deleteTransaction(t.id);
    }

    revalidatePath('/financial');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    return { success: false, error: 'Erro ao deletar transação' };
  }
}

// Invoice Payment
export async function payInvoiceAction(invoiceId: string, bankAccountId: string) {
  try {
    const user = await getAuthenticatedUser();

    if (!bankAccountId) {
      return { success: false, error: 'Uma conta bancária deve ser selecionada para pagar a fatura.' };
    }

    const invoice = await getInvoice(invoiceId);
    if (!invoice || invoice.status === 'PAID') {
      return { success: false, error: 'Fatura não encontrada ou já paga.' };
    }

    const account = await getBankAccount(bankAccountId);
    if (!account) {
      return { success: false, error: 'Conta bancária não encontrada.' };
    }

    const card = await getCreditCard(invoice.creditCardId);
    if (!card) {
      return { success: false, error: 'Cartão de crédito não encontrado.' };
    }

    // 1. Descontar do saldo bancário
    await updateBankAccount(bankAccountId, {
      currentBalance: account.currentBalance - invoice.totalAmount
    });

    // 2. Liberar limite do cartão
    await updateCreditCard(card.id, {
      availableLimit: card.availableLimit + invoice.totalAmount
    });

    // 3. Atualizar status da fatura
    await updateInvoice(invoiceId, {
      status: 'PAID',
      paidAt: new Date(),
      paidFromBankAccountId: bankAccountId
    });

    // 4. Atualizar status de todas as transações vinculadas a esta fatura
    const transactions = await getTransactionsByUser(user.userId);
    const invoiceTransactions = transactions.filter(t => t.invoiceId === invoiceId);

    for (const t of invoiceTransactions) {
      // Usando uma função interna ou updateTransaction se existir. 
      // Como não criei updateTransaction ainda, vou adicionar no firestore-server
      await updateTransaction(t.id, { status: 'PAID' });
    }

    // 5. Criar transação de pagamento de fatura
    await createTransaction({
      userId: user.userId,
      description: `Pagamento Fatura - ${card.name}`,
      amount: invoice.totalAmount,
      date: new Date(),
      type: 'EXPENSE',
      category: 'Cartão de Crédito',
      paymentMethod: 'BANK_ACCOUNT',
      bankAccountId,
      status: 'PAID',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath('/financial');
    return { success: true };
  } catch (error) {
    console.error('Erro ao pagar fatura:', error);
    return { success: false, error: 'Erro ao processar pagamento da fatura' };
  }
}
