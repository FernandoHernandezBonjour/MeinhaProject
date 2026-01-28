'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Debt, User } from '@/types';
import { getAllDebtsAdminAction, deleteDebtAdminAction } from '@/lib/actions/admin';

export const AdminDebtsPanel: React.FC = () => {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'PAID'>('ALL');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchDebts = async () => {
        try {
            setLoading(true);
            const response = await getAllDebtsAdminAction();
            if (response.success) {
                setDebts(response.debts);
                setUsers(response.users);
            } else {
                setError(response.error || 'Erro ao carregar dívidas');
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDebts();
    }, []);

    const getUserName = (id: string) => {
        const user = users.find(u => u.id === id);
        return user ? (user.name || user.username) : 'Desconhecido';
    };

    const handleDelete = async (debtId: string) => {
        if (!window.confirm('TEM CERTEZA? Essa ação é permanente e vai foder o score de quem estiver envolvido!')) {
            return;
        }

        try {
            setDeletingId(debtId);
            const response = await deleteDebtAdminAction(debtId);
            if (response.success) {
                setDebts(prev => prev.filter(d => d.id !== debtId));
            } else {
                alert(response.error);
            }
        } catch (err) {
            alert('Erro ao excluir dívida');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredDebts = useMemo(() => {
        return debts.filter(debt => {
            const creditorName = getUserName(debt.creditorId).toLowerCase();
            const debtorName = getUserName(debt.debtorId).toLowerCase();
            const description = (debt.description || '').toLowerCase();
            const matchesSearch =
                creditorName.includes(searchTerm.toLowerCase()) ||
                debtorName.includes(searchTerm.toLowerCase()) ||
                description.includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || debt.status === statusFilter;

            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [debts, searchTerm, statusFilter, users]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatDate = (date: string) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Buscar por credor, devedor ou descrição..."
                        className="w-full p-4 rounded-xl border-4 border-black dark:border-gray-600 dark:bg-gray-700 dark:text-white font-bold outline-none focus:ring-4 focus:ring-red-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl border-4 border-black">
                    {(['ALL', 'OPEN', 'PAID'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg font-black transition-all ${statusFilter === status
                                    ? 'bg-black text-white'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
                                }`}
                        >
                            {status === 'ALL' ? 'Todas' : status === 'OPEN' ? 'Abertas' : 'Pagas'}
                        </button>
                    ))}
                </div>
            </div>

            {error ? (
                <div className="bg-red-100 border-4 border-red-500 p-4 rounded-xl text-red-700 font-bold">
                    {error}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border-4 border-black dark:border-gray-700">
                    <table className="w-full text-left bg-white dark:bg-gray-800">
                        <thead className="bg-gray-100 dark:bg-gray-700 border-b-4 border-black">
                            <tr>
                                <th className="p-4 font-black uppercase text-xs">Criada em</th>
                                <th className="p-4 font-black uppercase text-xs">Credor</th>
                                <th className="p-4 font-black uppercase text-xs">Devedor</th>
                                <th className="p-4 font-black uppercase text-xs">Valor</th>
                                <th className="p-4 font-black uppercase text-xs">Status</th>
                                <th className="p-4 font-black uppercase text-xs">Descrição</th>
                                <th className="p-4 font-black uppercase text-xs text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-gray-200 dark:divide-gray-700">
                            {filteredDebts.map((debt) => (
                                <tr key={debt.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                    <td className="p-4 text-sm font-bold whitespace-nowrap">
                                        {formatDate(debt.createdAt as any)}
                                    </td>
                                    <td className="p-4 font-bold text-green-600 dark:text-green-400">
                                        {getUserName(debt.creditorId)}
                                    </td>
                                    <td className="p-4 font-bold text-red-600 dark:text-red-400">
                                        {getUserName(debt.debtorId)}
                                    </td>
                                    <td className="p-4 font-black text-lg">
                                        {formatCurrency(debt.amount)}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-black border-2 ${debt.status === 'OPEN'
                                                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                : 'bg-green-100 text-green-700 border-green-200'
                                            }`}>
                                            {debt.status === 'OPEN' ? 'EM ABERTO' : 'PAGA'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm max-w-xs truncate font-medium">
                                        {debt.description || '-'}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleDelete(debt.id)}
                                            disabled={deletingId === debt.id}
                                            className="bg-red-600 hover:bg-black text-white p-2 rounded-lg border-2 border-black transition-all disabled:opacity-50 disabled:cursor-wait"
                                            title="Excluir Dívida"
                                        >
                                            {deletingId === debt.id ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                                            ) : (
                                                '🗑️'
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDebts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-gray-500 font-bold">
                                        Nenhuma dívida encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
