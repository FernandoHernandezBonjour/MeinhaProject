'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { verifyToken } from '../auth-server';
import { db } from '../firebase-server';
import { getUser, getPaidDebts, getAllUsers, getDebt, updateDebt, getAllDebts, deleteDebt as deleteDebtFirestore } from '../firestore-server';
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

export async function getRecentPaymentsAction() {
    try {
        const auth = await getAuthenticatedUser();
        const user = await getUser(auth.userId);

        if (user?.role !== 'admin') {
            return { error: 'Apenas administradores podem acessar transações' };
        }

        // Get paid debts from last 30 days
        const allPaidDebts = await getPaidDebts();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentPayments = allPaidDebts.filter((debt: Debt) => {
            const updatedAt = new Date(debt.updatedAt);
            return updatedAt >= thirtyDaysAgo;
        });

        // Get all users for mapping
        const users = await getAllUsers();

        // Serialize dates to strings for client components
        const serializedPayments = recentPayments.map((debt: Debt) => {
            const serialized: any = {
                ...debt,
                dueDate: debt.dueDate.toISOString(),
                createdAt: debt.createdAt.toISOString(),
                updatedAt: debt.updatedAt.toISOString()
            };

            // Only serialize paymentOverride if it exists and has valid data
            if (debt.paymentOverride && debt.paymentOverride.overriddenAt) {
                serialized.paymentOverride = {
                    ...debt.paymentOverride,
                    overriddenAt: debt.paymentOverride.overriddenAt instanceof Date
                        ? debt.paymentOverride.overriddenAt.toISOString()
                        : debt.paymentOverride.overriddenAt
                };
            }

            return serialized;
        });

        // Also serialize user dates
        const serializedUsers = users.map((user: User) => ({
            ...user,
            createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
            updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt
        }));

        // Use JSON serialization to ensure everything is plain objects
        const result = {
            success: true,
            payments: serializedPayments,
            users: serializedUsers
        };

        return JSON.parse(JSON.stringify(result));
    } catch (error) {
        console.error('Erro ao buscar pagamentos recentes:', error);
        return {
            success: false,
            error: 'Erro ao carregar transações',
            payments: [],
            users: []
        };
    }
}

export async function overridePaymentTimingAction(debtId: string, wasOnTime: boolean, reason?: string) {
    try {
        console.log('[Override] Starting override for debt:', debtId, 'wasOnTime:', wasOnTime);

        const auth = await getAuthenticatedUser();
        const user = await getUser(auth.userId);

        console.log('[Override] User:', user?.username, 'Role:', user?.role);

        if (user?.role !== 'admin') {
            return { error: 'Apenas administradores podem alterar transações' };
        }

        const debt = await getDebt(debtId);

        console.log('[Override] Debt found:', !!debt, 'Status:', debt?.status);

        if (!debt) {
            return { error: 'Dívida não encontrada' };
        }

        if (debt.status !== 'PAID') {
            return { error: 'Apenas dívidas pagas podem ter o timing alterado' };
        }

        const overrideData: any = {
            wasOnTime,
            overriddenBy: auth.userId,
            overriddenAt: new Date()
        };

        // Only add reason if it has a value (Firestore doesn't accept undefined)
        if (reason && reason.trim()) {
            overrideData.reason = reason.trim();
        }

        console.log('[Override] Updating debt with override data:', overrideData);

        await updateDebt(debtId, {
            paymentOverride: overrideData
        });

        console.log('[Override] Update successful');

        // Revalidate paths to refresh scores
        revalidatePath('/');
        revalidatePath('/financeiro');

        return {
            success: true,
            message: 'Timing de pagamento atualizado com sucesso'
        };
    } catch (error) {
        console.error('[Override] Erro ao alterar timing de pagamento:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return { error: `Erro ao atualizar transação: ${errorMessage}` };
    }
}

export async function clearAllOverridesAction() {
    try {
        console.log('[ClearOverrides] Starting to clear all overrides');

        const auth = await getAuthenticatedUser();
        const user = await getUser(auth.userId);

        if (user?.role !== 'admin') {
            return { error: 'Apenas administradores podem limpar overrides' };
        }

        // Get all paid debts
        const allPaidDebts = await getPaidDebts();

        // Filter only those with overrides
        const debtsWithOverrides = allPaidDebts.filter((debt: Debt) => debt.paymentOverride);

        console.log('[ClearOverrides] Found', debtsWithOverrides.length, 'debts with overrides');

        // Remove override from each debt
        for (const debt of debtsWithOverrides) {
            await db.collection('debts').doc(debt.id).update({
                paymentOverride: null
            });
        }

        console.log('[ClearOverrides] All overrides cleared');

        // Revalidate paths to refresh scores
        revalidatePath('/');
        revalidatePath('/financeiro');

        return {
            success: true,
            message: `${debtsWithOverrides.length} override(s) removido(s) com sucesso`,
            count: debtsWithOverrides.length
        };
    } catch (error) {
        console.error('[ClearOverrides] Erro ao limpar overrides:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return { error: `Erro ao limpar overrides: ${errorMessage}` };
    }
}

export async function getAllDebtsAdminAction() {
    try {
        const auth = await getAuthenticatedUser();
        const user = await getUser(auth.userId);

        if (user?.role !== 'admin') {
            return { error: 'Apenas administradores podem gerenciar dívidas' };
        }

        const allDebts = await getAllDebts();
        const allUsers = await getAllUsers();

        // Serialize dates
        const serializedDebts = allDebts.map((debt: Debt) => ({
            ...debt,
            dueDate: debt.dueDate.toISOString(),
            createdAt: debt.createdAt.toISOString(),
            updatedAt: debt.updatedAt.toISOString()
        }));

        const serializedUsers = allUsers.map((user: User) => ({
            ...user,
            createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
            updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt
        }));

        return {
            success: true,
            debts: JSON.parse(JSON.stringify(serializedDebts)),
            users: JSON.parse(JSON.stringify(serializedUsers))
        };
    } catch (error) {
        console.error('Erro ao buscar todas as dívidas:', error);
        return { error: 'Erro ao carregar lista de dívidas' };
    }
}

export async function deleteDebtAdminAction(debtId: string) {
    try {
        const auth = await getAuthenticatedUser();
        const user = await getUser(auth.userId);

        if (user?.role !== 'admin') {
            return { error: 'Apenas administradores podem excluir dívidas' };
        }

        await deleteDebtFirestore(debtId);

        revalidatePath('/');
        revalidatePath('/financeiro');

        return {
            success: true,
            message: 'Dívida excluída com sucesso'
        };
    } catch (error) {
        console.error('Erro ao excluir dívida:', error);
        return { error: 'Erro ao excluir dívida' };
    }
}
