import React, { useState, useEffect } from 'react';
import { Debt, User } from '@/types';
import { getRecentPaymentsAction, overridePaymentTimingAction, clearAllOverridesAction } from '@/lib/actions/admin';

export const TransactionsPanel: React.FC = () => {
    const [payments, setPayments] = useState<Debt[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [overrideModal, setOverrideModal] = useState<{ debt: Debt; currentStatus: string } | null>(null);
    const [overrideReason, setOverrideReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string>('');

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        setLoading(true);
        setError('');
        const res = await getRecentPaymentsAction();

        if (res.error) {
            setError(res.error);
        } else if (res.success) {
            setPayments(res.payments || []);
            setUsers(res.users || []);
        }
        setLoading(false);
    };

    const getUserById = (id: string) => users.find((u: User) => u.id === id);

    const getPaymentStatus = (debt: Debt) => {
        if (debt.paymentOverride) {
            return {
                text: debt.paymentOverride.wasOnTime ? 'Dentro do prazo (Ajustado)' : 'Fora do prazo (Ajustado)',
                color: debt.paymentOverride.wasOnTime ? 'text-yellow-600 bg-yellow-100' : 'text-orange-600 bg-orange-100',
                isOverridden: true
            };
        }

        const payDate = new Date(debt.updatedAt);
        const dueDate = new Date(debt.dueDate);
        const wasOnTime = payDate <= dueDate;

        return {
            text: wasOnTime ? 'Dentro do prazo' : 'Fora do prazo',
            color: wasOnTime ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100',
            isOverridden: false
        };
    };

    const handleOverride = async (wasOnTime: boolean) => {
        if (!overrideModal) return;

        setProcessing(true);
        const res = await overridePaymentTimingAction(
            overrideModal.debt.id,
            wasOnTime,
            overrideReason.trim() || undefined
        );

        if (res.error) {
            setError(res.error);
        } else if (res.success) {
            await loadPayments();
            setOverrideModal(null);
            setOverrideReason('');
        }
        setProcessing(false);
    };

    const handleClearAll = async () => {
        if (!confirm('Tem certeza que deseja remover TODOS os ajustes manuais? Os scores voltarão aos valores originais calculados pelas datas reais.')) {
            return;
        }

        setProcessing(true);
        setError('');
        setSuccessMessage('');

        const res = await clearAllOverridesAction();

        if (res.error) {
            setError(res.error);
        } else if (res.success) {
            setSuccessMessage(res.message || 'Overrides removidos com sucesso!');
            await loadPayments();
        }
        setProcessing(false);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR').format(new Date(date));

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4">
                    <p className="text-red-800 font-bold text-center">❌ {error}</p>
                </div>
            )}

            {successMessage && (
                <div className="bg-green-100 border-2 border-green-400 rounded-xl p-4">
                    <p className="text-green-800 font-bold text-center">✅ {successMessage}</p>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Transações Recentes (Últimos 30 dias)</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleClearAll}
                            disabled={processing}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                        >
                            🗑️ Limpar Todos Ajustes
                        </button>
                        <button
                            onClick={loadPayments}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                        >
                            🔄 Atualizar
                        </button>
                    </div>
                </div>

                {payments.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">Nenhuma transação nos últimos 30 dias</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-black">Credor</th>
                                    <th className="px-4 py-3 text-left text-sm font-black">Devedor</th>
                                    <th className="px-4 py-3 text-left text-sm font-black">Descrição</th>
                                    <th className="px-4 py-3 text-right text-sm font-black">Valor</th>
                                    <th className="px-4 py-3 text-center text-sm font-black">Vencimento</th>
                                    <th className="px-4 py-3 text-center text-sm font-black">Pagamento</th>
                                    <th className="px-4 py-3 text-center text-sm font-black">Status</th>
                                    <th className="px-4 py-3 text-center text-sm font-black">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {payments.map((debt: Debt) => {
                                    const creditor = getUserById(debt.creditorId);
                                    const debtor = getUserById(debt.debtorId);
                                    const status = getPaymentStatus(debt);

                                    return (
                                        <tr key={debt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 font-bold">
                                                {creditor?.name || creditor?.username || '—'}
                                            </td>
                                            <td className="px-4 py-3 font-bold">
                                                {debtor?.name || debtor?.username || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {debt.description || 'Sem descrição'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-green-600">
                                                {formatCurrency(debt.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm">
                                                {formatDate(debt.dueDate)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm">
                                                {formatDate(debt.updatedAt)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                                                    {status.text}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => setOverrideModal({ debt, currentStatus: status.text })}
                                                    className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
                                                >
                                                    ✏️ Ajustar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Override Modal */}
            {overrideModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border-4 border-purple-500 shadow-2xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-black text-purple-600">Ajustar Timing de Pagamento</h3>
                            <button
                                onClick={() => {
                                    setOverrideModal(null);
                                    setOverrideReason('');
                                }}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-black"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="text-sm font-bold mb-2">Status Atual:</p>
                                <p className="text-lg font-black">{overrideModal.currentStatus}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">Motivo do Ajuste (Opcional)</label>
                                <textarea
                                    value={overrideReason}
                                    onChange={e => setOverrideReason(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none"
                                    rows={3}
                                    placeholder="Ex: Credor demorou para registrar o pagamento"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleOverride(true)}
                                    disabled={processing}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white font-black rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    ✅ Marcar como Dentro do Prazo
                                </button>
                                <button
                                    onClick={() => handleOverride(false)}
                                    disabled={processing}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white font-black rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    ❌ Marcar como Fora do Prazo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
