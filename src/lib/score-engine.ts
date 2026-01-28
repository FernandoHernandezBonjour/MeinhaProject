import { Debt } from '@/types';

export interface ScoreDetails {
    score: number;
    classification: 'Elite' | 'Confiável' | 'Ok' | 'Instável' | 'Perigo' | 'Caloteiro';
    breakdown: {
        base: number;
        earned: number;
        lost: number;
    };
}

export interface MeinhaScoreRules {
    initialScore: number;
    maxScore: number;
    minScore: number;
    creditorCreation: number;
    paymentBonus: {
        early: number;
        onTime: number;
        lateTolerance: number;
    };
    debtorBonus: {
        early: number;
        onTime: number;
        lateTolerance: number;
    };
    penalties: {
        late1to2: number;
        late3to7: number;
        late8to30: number;
        late30plus: number;
        overdueWeekly: number;
        overdueMax: number;
        default: number;
    };
}

export const DEFAULT_RULES: MeinhaScoreRules = {
    initialScore: 500,
    maxScore: 1000,
    minScore: 0,
    creditorCreation: 2,
    paymentBonus: {
        early: 4,
        onTime: 3,
        lateTolerance: 1,
    },
    debtorBonus: {
        early: 10,
        onTime: 7,
        lateTolerance: 3,
    },
    penalties: {
        late1to2: -10,
        late3to7: -25,
        late8to30: -70,
        late30plus: -140,
        overdueWeekly: -10,
        overdueMax: -80,
        default: -300,
    }
};

export interface ScoreDetails {
    score: number;
    classification: 'Elite' | 'Confiável' | 'Ok' | 'Instável' | 'Perigo' | 'Caloteiro';
    breakdown: {
        base: number;
        earned: number;
        lost: number;
    };
}

export function calculateMeinhaScore(userId: string, allDebts: Debt[], rules: MeinhaScoreRules = DEFAULT_RULES): ScoreDetails {
    // Debug log to track which rules are being used
    if (userId === 'matheus_id_here') { // Replace with actual Matheus ID for testing
        console.log('[Score Debug] Calculating score for Matheus with rules:', {
            creditorCreation: rules.creditorCreation,
            debtorBonusOnTime: rules.debtorBonus.onTime,
            paymentBonusOnTime: rules.paymentBonus.onTime
        });
    }

    let score = rules.initialScore;
    let earned = 0;
    let lost = 0;

    // Filtrar dívidas relevantes para o usuário (credor ou devedor)
    // Ignorar pagamentos parciais (wasPartialPayment: true) conforme regra
    const userDebts = allDebts.filter(
        (d) => (d.creditorId === userId || d.debtorId === userId) && !d.wasPartialPayment
    );

    // Agrupamento para regra de repetição (mesmo par no mesmo mês)
    const pairMonthCounts: Record<string, number> = {};

    userDebts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (const debt of userDebts) {
        let debtPoints = 0;

        const isCreditor = debt.creditorId === userId;
        const isDebtor = debt.debtorId === userId;

        if (!isCreditor && !isDebtor) continue;

        const otherId = isCreditor ? debt.debtorId : debt.creditorId;
        const dbDate = new Date(debt.createdAt);
        const monthKey = `${isCreditor ? userId : otherId}-${isCreditor ? otherId : userId}-${dbDate.getFullYear()}-${dbDate.getMonth()}`;

        if (!pairMonthCounts[monthKey]) pairMonthCounts[monthKey] = 0;
        pairMonthCounts[monthKey]++;

        const isSpam = pairMonthCounts[monthKey] >= 4;

        // --- PONTOS DO CREDOR ---
        if (isCreditor) {
            let creationPoints = rules.creditorCreation;

            if (isSpam) creationPoints *= 0.5;
            creationPoints = applyValueWeight(creationPoints, debt.originalAmount || debt.amount);
            debtPoints += creationPoints;

            if (debt.status === 'PAID' && debt.updatedAt) {
                let paymentBonus = 0;

                // Check for manual override first
                if (debt.paymentOverride) {
                    // Use override flag instead of calculating from dates
                    if (debt.paymentOverride.wasOnTime) {
                        paymentBonus = rules.paymentBonus.onTime;
                    }
                    // If marked as late, creditor gets no bonus (0 points)
                } else {
                    // Normal calculation based on actual dates
                    const payDate = new Date(debt.updatedAt);
                    const dueDate = new Date(debt.dueDate);
                    const normPay = normalizeDate(payDate);
                    const normDue = normalizeDate(dueDate);
                    const dayDiff = Math.floor((normPay.getTime() - normDue.getTime()) / (1000 * 3600 * 24));

                    if (dayDiff < 0) paymentBonus = rules.paymentBonus.early;
                    else if (dayDiff === 0) paymentBonus = rules.paymentBonus.onTime;
                    else if (dayDiff <= 2) paymentBonus = rules.paymentBonus.lateTolerance;
                }

                if (isSpam) paymentBonus *= 0.5;
                paymentBonus = applyValueWeight(paymentBonus, debt.originalAmount || debt.amount);

                debtPoints += paymentBonus;
            }
        }

        // --- PONTOS DO DEVEDOR ---
        if (isDebtor) {
            const amount = debt.originalAmount || debt.amount;

            if (debt.status === 'PAID' && debt.updatedAt) {
                let flowPoints = 0;

                // Check for manual override first
                if (debt.paymentOverride) {
                    // Use override flag instead of calculating from dates
                    if (debt.paymentOverride.wasOnTime) {
                        flowPoints = rules.debtorBonus.onTime;
                    } else {
                        // If marked as late by override, apply maximum penalty
                        flowPoints = rules.penalties.late30plus;
                    }
                } else {
                    // Normal calculation based on actual dates
                    const payDate = new Date(debt.updatedAt);
                    const dueDate = new Date(debt.dueDate);
                    const normPay = normalizeDate(payDate);
                    const normDue = normalizeDate(dueDate);
                    const dayDiff = Math.floor((normPay.getTime() - normDue.getTime()) / (1000 * 3600 * 24));

                    // Quitação (Positivo) - Usando valores da config
                    if (dayDiff < 0) flowPoints = rules.debtorBonus.early;
                    else if (dayDiff === 0) flowPoints = rules.debtorBonus.onTime;

                    // Atraso (Negativo)
                    else if (dayDiff >= 1 && dayDiff <= 2) flowPoints = rules.penalties.late1to2;
                    else if (dayDiff <= 7) flowPoints = rules.penalties.late3to7;
                    else if (dayDiff <= 30) flowPoints = rules.penalties.late8to30;
                    else flowPoints = rules.penalties.late30plus;
                }

                flowPoints = applyValueWeight(flowPoints, amount);

                if (flowPoints > 0 && isSpam) flowPoints *= 0.5;

                debtPoints += flowPoints;

            } else if (debt.status === 'OPEN') {
                const dueDate = new Date(debt.dueDate);
                const now = new Date();
                const normDue = normalizeDate(dueDate);
                const normNow = normalizeDate(now);

                if (normNow > normDue) {
                    const dayDiff = Math.floor((normNow.getTime() - normDue.getTime()) / (1000 * 3600 * 24));

                    const weeks = Math.floor(dayDiff / 7);
                    let overduePenalty = 0;
                    if (weeks > 0) {
                        overduePenalty = weeks * rules.penalties.overdueWeekly;
                    }

                    if (overduePenalty < rules.penalties.overdueMax) overduePenalty = rules.penalties.overdueMax;

                    if (dayDiff > 60) {
                        overduePenalty = rules.penalties.default;
                    }

                    overduePenalty = applyValueWeight(overduePenalty, amount);

                    debtPoints += overduePenalty;
                }
            }
        }

        if (debtPoints > 20) debtPoints = 20;

        if (debtPoints > 0) earned += debtPoints;
        else lost += debtPoints;
    }

    score += (earned + lost);

    if (score > rules.maxScore) score = rules.maxScore;
    if (score < rules.minScore) score = rules.minScore;

    return {
        score: Math.round(score),
        classification: getClassification(score),
        breakdown: { base: rules.initialScore, earned: Math.round(earned), lost: Math.round(lost) }
    };
}

function normalizeDate(d: Date): Date {
    const n = new Date(d);
    n.setHours(0, 0, 0, 0);
    return n;
}

function applyValueWeight(points: number, amount: number): number {
    if (amount < 10) return points * 0.20;
    if (amount < 50) return points * 0.60;
    return points;
}

function getClassification(score: number): ScoreDetails['classification'] {
    if (score >= 900) return 'Elite';
    if (score >= 700) return 'Confiável';
    if (score >= 400) return 'Ok';
    if (score >= 200) return 'Instável';
    return 'Perigo';
}

function getDaysDiff(d1: Date, d2: Date): number {
    const start = normalizeDate(d1);
    const end = normalizeDate(d2);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
}
