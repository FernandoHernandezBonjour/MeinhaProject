import React, { useMemo, useState, useEffect } from 'react';
import { Debt, User } from '@/types';
import { calculateMeinhaScore, ScoreDetails, MeinhaScoreRules, DEFAULT_RULES } from '@/lib/score-engine';
import { useAuth } from '@/contexts/AuthContext';
import { getScoreRulesAction } from '@/lib/actions/settings';

interface MeinhaScoreDashboardProps {
    debts: Debt[];
    users: User[];
}

export const MeinhaScoreDashboard: React.FC<MeinhaScoreDashboardProps> = ({ debts, users }) => {
    const { user: currentUser } = useAuth();
    const [rules, setRules] = useState<MeinhaScoreRules>(DEFAULT_RULES);
    const [rulesLoading, setRulesLoading] = useState(true);

    useEffect(() => {
        const loadRules = async () => {
            const res = await getScoreRulesAction();
            if (res.success && res.rules) {
                setRules(res.rules);
            }
            setRulesLoading(false);
        };
        loadRules();
    }, []);

    const userScores = useMemo(() => {
        return users
            .filter(user => {
                const username = (user.username || '').toLowerCase();
                const name = (user.name || '').toLowerCase();

                // Filtros de contas de sistema/teste
                if (username === 'admin') return false;
                if (name.includes('administrador')) return false;
                if (username.includes('teste') || name.includes('teste')) return false;

                return true;
            })
            .map(user => {
                const scoreData = calculateMeinhaScore(user.id, debts, rules);
                // Calcular totais financeiros
                const totalDebt = debts
                    .filter(d => d.debtorId === user.id && d.status === 'OPEN')
                    .reduce((sum, d) => sum + d.amount, 0);

                const totalCredit = debts
                    .filter(d => d.creditorId === user.id && d.status === 'OPEN')
                    .reduce((sum, d) => sum + d.amount, 0);

                const overdueCount = debts.filter(d =>
                    d.debtorId === user.id && d.status === 'OPEN' && new Date(d.dueDate) < new Date()
                ).length;

                return {
                    user,
                    ...scoreData,
                    totalDebt,
                    totalCredit,
                    overdueCount
                };
            }).sort((a, b) => b.score - a.score); // Ordenar por score decrescente
    }, [debts, users, rules]);

    const currentScore = userScores.find(u => u.user.id === currentUser?.id);

    const getScoreColor = (classification: ScoreDetails['classification']) => {
        switch (classification) {
            case 'Elite': return 'text-purple-600 bg-purple-100 border-purple-300';
            case 'Confiável': return 'text-green-600 bg-green-100 border-green-300';
            case 'Ok': return 'text-blue-600 bg-blue-100 border-blue-300';
            case 'Instável': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
            case 'Perigo': return 'text-red-600 bg-red-100 border-red-300';
            case 'Caloteiro': return 'text-red-800 bg-red-200 border-red-500'; // Caso customizado se quisermos
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header MeinhaScore */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-8 text-white shadow-2xl border-4 border-black transition-all">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-4xl font-black mb-2 flex items-center gap-3">
                            <span>⭐</span> MeinhaScore
                        </h2>
                        <p className="text-indigo-200 text-lg">
                            O sistema definitivo de reputação financeira baseada em fatos.
                        </p>
                    </div>

                    {currentScore && (
                        <div className={`p-6 rounded-xl border-4 shadow-xl text-center transform hover:scale-105 transition-transform bg-white text-black`}>
                            <div className="text-sm font-bold uppercase tracking-wider mb-1 text-gray-500">Seu Score Atual</div>
                            <div className={`text-6xl font-black ${currentScore.score < 500 ? 'text-red-600' : 'text-green-600'}`}>
                                {currentScore.score}
                            </div>
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase mt-2 ${currentScore.classification === 'Perigo' ? 'bg-red-100 text-red-700' :
                                currentScore.classification === 'Elite' ? 'bg-purple-100 text-purple-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                {currentScore.classification}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Ranking Geral */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-black dark:border-gray-700">
                <div className="px-6 py-4 border-b-4 border-black bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-t-2xl mb-4">
                    <h3 className="text-2xl font-black text-gray-800 dark:text-white">
                        🏆 Ranking de Confiabilidade
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left">Pos</th>
                                <th className="px-4 py-3 text-left">Usuário</th>
                                <th className="px-4 py-3 text-center">Score</th>
                                <th className="px-4 py-3 text-center">Classificação</th>
                                <th className="px-4 py-3 text-right">Créditos</th>
                                <th className="px-4 py-3 text-right">Dívidas</th>
                                <th className="px-4 py-3 text-center">Vencidas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userScores.map((data, index) => {
                                const isCurrentUser = data.user.id === currentUser?.id;
                                const scoreStyle = getScoreColor(data.classification);

                                return (
                                    <tr
                                        key={data.user.id}
                                        className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                            }`}
                                    >
                                        <td className="px-4 py-4 font-black text-xl text-gray-400">
                                            #{index + 1}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {data.user.photoURL ? (
                                                    <img src={data.user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                                                        {data.user.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className={`font-bold ${isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                        {data.user.name || data.user.username}
                                                        {isCurrentUser && ' (Você)'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">@{data.user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="font-black text-2xl tracking-tighter">
                                                {data.score}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${scoreStyle}`}>
                                                {data.classification}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right font-bold text-green-600">
                                            {formatCurrency(data.totalCredit)}
                                        </td>
                                        <td className="px-4 py-4 text-right font-bold text-red-600">
                                            {formatCurrency(data.totalDebt)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {data.overdueCount > 0 ? (
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-black border-2 border-red-200 animate-pulse">
                                                    {data.overdueCount}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Explicação das Regras (Resumida) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl">
                    <strong className="block text-gray-900 dark:text-gray-200 mb-1">Como ganhar pontos?</strong>
                    Pague suas contas em dia ou antecipadamente. Cadastre dívidas válidas.
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl">
                    <strong className="block text-gray-900 dark:text-gray-200 mb-1">Como perder pontos?</strong>
                    Atrasos de pagamento, deixar dívidas vencerem e calotes (&gt;60 dias).
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl">
                    <strong className="block text-gray-900 dark:text-gray-200 mb-1">Limites</strong>
                    Dívidas pequenas (&lt; R$10) valem menos. Spam de dívidas (4+ no mês) vale metade.
                </div>
            </div>
        </div>
    );
};
