'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Debt, User } from '@/types';
import { calculateMeinhaScore, ScoreDetails, ScoreEvent, MeinhaScoreRules, DEFAULT_RULES } from '@/lib/score-engine';
import { getScoreRulesAction } from '@/lib/actions/settings';

interface ScoreReportDashboardProps {
    debts: Debt[];
    users: User[];
}

export const ScoreReportDashboard: React.FC<ScoreReportDashboardProps> = ({ debts, users }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [rules, setRules] = useState<MeinhaScoreRules>(DEFAULT_RULES);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    useEffect(() => {
        async function loadRules() {
            const response = await getScoreRulesAction();
            if (response.success && response.rules) {
                setRules(response.rules);
            }
        }
        loadRules();
    }, []);

    const userScores = useMemo(() => {
        return users.map(user => {
            const details = calculateMeinhaScore(user.id, debts, rules);
            return {
                user,
                details
            };
        }).sort((a, b) => b.details.score - a.details.score);
    }, [debts, users, rules]);

    const filteredScores = useMemo(() => {
        return userScores.filter(item =>
            (item.user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.user.username || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [userScores, searchTerm]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const getScoreColor = (classification: ScoreDetails['classification']) => {
        switch (classification) {
            case 'Elite': return 'text-purple-600 dark:text-purple-400';
            case 'Confiável': return 'text-green-600 dark:text-green-400';
            case 'Ok': return 'text-blue-600 dark:text-blue-400';
            case 'Instável': return 'text-yellow-600 dark:text-yellow-400';
            case 'Perigo': return 'text-orange-600 dark:text-orange-400';
            case 'Caloteiro': return 'text-red-600 dark:text-red-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl border-4 border-black dark:border-gray-700">
                <h2 className="text-4xl font-black mb-2">📊 Relatório de Score</h2>
                <p className="text-xl text-indigo-100">
                    Entenda exatamente por que sua reputação está no lixo ou na elite.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-black dark:border-gray-700">
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Buscar usuário..."
                        className="w-full p-4 rounded-xl border-4 border-black dark:border-gray-600 dark:bg-gray-700 dark:text-white font-bold focus:ring-4 focus:ring-purple-500 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="space-y-4">
                    {filteredScores.map(({ user, details }) => (
                        <div
                            key={user.id}
                            className={`rounded-2xl border-4 border-black dark:border-gray-700 overflow-hidden transition-all ${expandedUser === user.id ? 'ring-4 ring-purple-400' : ''}`}
                        >
                            <button
                                onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.username} className="w-12 h-12 rounded-full border-2 border-black object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full border-2 border-black bg-purple-100 flex items-center justify-center text-2xl">
                                            👤
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <h3 className="text-xl font-black text-gray-800 dark:text-white leading-tight">
                                            {user.name || user.username}
                                        </h3>
                                        <p className={`font-bold ${getScoreColor(details.classification)}`}>
                                            {details.classification} • {details.score} pts
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="hidden sm:flex space-x-2">
                                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-black border-2 border-green-200 dark:border-green-800">
                                            +{details.breakdown.earned}
                                        </span>
                                        <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-xs font-black border-2 border-red-200 dark:border-red-800">
                                            {details.breakdown.lost}
                                        </span>
                                    </div>
                                    <span className={`text-2xl transition-transform ${expandedUser === user.id ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </div>
                            </button>

                            {expandedUser === user.id && (
                                <div className="p-6 bg-white dark:bg-gray-800 border-t-4 border-black dark:border-gray-700 space-y-6 animate-in slide-in-from-top-4 duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Pontuação Base</p>
                                            <p className="text-2xl font-black text-gray-800 dark:text-white">{details.breakdown.base}</p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border-2 border-dashed border-green-300 dark:border-green-800 text-center">
                                            <p className="text-sm font-bold text-green-600 dark:text-green-400 mb-1">Total Ganhos</p>
                                            <p className="text-2xl font-black text-green-600 dark:text-green-400">+{details.breakdown.earned}</p>
                                        </div>
                                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border-2 border-dashed border-red-300 dark:border-red-800 text-center">
                                            <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">Total Perdas</p>
                                            <p className="text-2xl font-black text-red-600 dark:text-red-400">{details.breakdown.lost}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-black mb-4 flex items-center">
                                            📜 Histórico de Pontuação
                                        </h4>
                                        <div className="space-y-3">
                                            {details.history.length > 0 ? (
                                                details.history.map((event, idx) => {
                                                    const eventDebt = debts.find(d => d.id === event.debtId);
                                                    let otherParty = null;
                                                    if (eventDebt) {
                                                        const otherId = eventDebt.creditorId === user.id ? eventDebt.debtorId : eventDebt.creditorId;
                                                        otherParty = users.find(u => u.id === otherId);
                                                    }

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`flex items-center justify-between p-4 rounded-xl border-2 ${event.type === 'earned'
                                                                    ? 'bg-green-50/50 dark:bg-green-900/5 border-green-200 dark:border-green-900'
                                                                    : 'bg-red-50/50 dark:bg-red-900/5 border-red-200 dark:border-red-900'
                                                                }`}
                                                        >
                                                            <div className="flex flex-col flex-1 mr-4">
                                                                <span className="font-bold text-gray-800 dark:text-white">
                                                                    {event.reason}
                                                                </span>

                                                                {eventDebt && (
                                                                    <div className="mt-1 p-2 bg-white/50 dark:bg-black/20 rounded-lg border border-black/5 text-sm">
                                                                        <p className="font-black text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">Dívida Relacionada:</p>
                                                                        <div className="flex flex-wrap items-center gap-x-2">
                                                                            <span className="font-black text-purple-600 dark:text-purple-400">
                                                                                {formatCurrency(eventDebt.originalAmount || eventDebt.amount)}
                                                                            </span>
                                                                            {otherParty && (
                                                                                <>
                                                                                    <span className="text-gray-400">|</span>
                                                                                    <span className="font-bold">Com: {otherParty.name || otherParty.username}</span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        {eventDebt.description && (
                                                                            <p className="italic text-gray-600 dark:text-gray-300 mt-1">"{eventDebt.description}"</p>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <div className="flex space-x-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mt-2">
                                                                    <span>{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                                                                </div>
                                                            </div>
                                                            <span className={`text-xl font-black shrink-0 ${event.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                                                                {event.points > 0 ? '+' : ''}{event.points.toFixed(1)}
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                                                    <p className="font-bold text-gray-500">Nenhum evento registrado ainda.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredScores.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-2xl font-black text-gray-400">Nenhum caloteiro (ou elite) encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
