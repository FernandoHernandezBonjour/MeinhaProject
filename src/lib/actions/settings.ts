'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { verifyToken } from '../auth-server';
import { db } from '../firebase-server';
import { MeinhaScoreRules, DEFAULT_RULES } from '../score-engine';
import { getUser } from '../firestore-server';

const SETTINGS_COLLECTION = 'system_settings';
const SCORE_CONFIG_DOC = 'score_config';

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

export async function getScoreRulesAction() {
    try {
        await getAuthenticatedUser();

        const doc = await db.collection(SETTINGS_COLLECTION).doc(SCORE_CONFIG_DOC).get();

        if (doc.exists) {
            return {
                success: true,
                rules: doc.data() as MeinhaScoreRules
            };
        }

        return {
            success: true,
            rules: DEFAULT_RULES
        };
    } catch (error) {
        console.error('Erro ao buscar regras de score:', error);
        return {
            success: false,
            error: 'Erro ao carregar configurações',
            rules: DEFAULT_RULES
        };
    }
}

export async function updateScoreRulesAction(rules: MeinhaScoreRules) {
    try {
        const auth = await getAuthenticatedUser();
        const user = await getUser(auth.userId);

        if (user?.role !== 'admin') {
            return { error: 'Apenas administradores podem alterar as regras de score' };
        }

        await db.collection(SETTINGS_COLLECTION).doc(SCORE_CONFIG_DOC).set(rules);

        revalidatePath('/'); // Força atualização global, já que score aparece em todo lugar se tiver no header/sidebar
        revalidatePath('/financeiro'); // Página principal do score

        return {
            success: true,
            message: 'Regras de score atualizadas com sucesso'
        };
    } catch (error) {
        console.error('Erro ao atualizar regras de score:', error);
        return { error: 'Erro ao salvar configurações' };
    }
}
