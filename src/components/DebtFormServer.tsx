'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUsersAction, createDebtAction } from '@/lib/actions/debts';
import { User } from '@/types';

interface DebtFormServerProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface DebtorAmount {
  userId: string;
  amount: number;
}

export const DebtFormServer: React.FC<DebtFormServerProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');
  const [selectedDebtors, setSelectedDebtors] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [debtorAmounts, setDebtorAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getUsersAction();
        if (response.success) {
          // Filtrar o usuário atual da lista
          const otherUsers = response.users.filter((u: User) => u.id !== user?.id);
          setUsers(otherUsers);
          console.log('Usuários carregados:', otherUsers.length);
        } else {
          setError(response.error || 'Erro ao carregar usuários');
          console.error('Erro ao carregar usuários:', response.error);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        setError('Erro ao carregar lista de usuários');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  const handleDebtorToggle = (userId: string) => {
    setError('');
    if (selectedDebtors.includes(userId)) {
      const newSelected = selectedDebtors.filter((id: string) => id !== userId);
      setSelectedDebtors(newSelected);

      if (newSelected.length === 0) {
        // Se não há mais devedores, limpa tudo
        setTotalAmount('');
        setDebtorAmounts({});
      } else if (newSelected.length === 1) {
        // Se ficou apenas um, mantém o valor individual se existir
        const remainingAmount = debtorAmounts[newSelected[0]] || '';
        setDebtorAmounts({ [newSelected[0]]: remainingAmount });
        setTotalAmount(remainingAmount);
      } else if (newSelected.length > 1 && totalAmount) {
        // Recalcular valores quando remover um devedor
        const total = parseFloat(totalAmount);
        if (!isNaN(total) && total > 0) {
          const perPerson = total / newSelected.length;
          const updatedAmounts: Record<string, string> = {};
          newSelected.forEach(id => {
            updatedAmounts[id] = perPerson.toFixed(2);
          });
          setDebtorAmounts(updatedAmounts);
        }
      } else {
        // Se não tem totalAmount, apenas remove do objeto
        const newAmounts = { ...debtorAmounts };
        delete newAmounts[userId];
        setDebtorAmounts(newAmounts);
      }
    } else {
      const newSelected = [...selectedDebtors, userId];
      setSelectedDebtors(newSelected);

      if (newSelected.length === 1) {
        // Se for o primeiro, não precisa calcular ainda
        setDebtorAmounts({ [userId]: totalAmount || '' });
      } else if (newSelected.length > 1) {
        // Se já tem totalAmount, recalcula
        if (totalAmount) {
          const total = parseFloat(totalAmount);
          if (!isNaN(total) && total > 0) {
            const perPerson = total / newSelected.length;
            const updatedAmounts: Record<string, string> = {};
            newSelected.forEach(id => {
              updatedAmounts[id] = perPerson.toFixed(2);
            });
            setDebtorAmounts(updatedAmounts);
          } else {
            // Se não tem totalAmount válido, apenas adiciona vazio
            setDebtorAmounts({ ...debtorAmounts, [userId]: '' });
          }
        } else {
          // Se não tem totalAmount ainda, apenas adiciona vazio
          setDebtorAmounts({ ...debtorAmounts, [userId]: '' });
        }
      }
    }
  };

  const handleTotalAmountChange = (value: string) => {
    setTotalAmount(value);
    setError('');

    if (selectedDebtors.length > 1 && value) {
      const total = parseFloat(value);
      if (!isNaN(total) && total > 0) {
        const perPerson = total / selectedDebtors.length;
        const updatedAmounts: Record<string, string> = {};
        selectedDebtors.forEach(userId => {
          updatedAmounts[userId] = perPerson.toFixed(2);
        });
        setDebtorAmounts(updatedAmounts);
      }
    }
  };

  const handleDebtorAmountChange = (userId: string, value: string) => {
    setDebtorAmounts(prev => ({ ...prev, [userId]: value }));
    setError('');
  };

  const validateAmounts = (): boolean => {
    if (selectedDebtors.length === 0) {
      setError('Selecione pelo menos um devedor');
      return false;
    }

    if (selectedDebtors.length === 1) {
      const amount = debtorAmounts[selectedDebtors[0]] || totalAmount;
      if (!amount || parseFloat(amount) <= 0) {
        setError('O valor deve ser maior que zero');
        return false;
      }
      return true;
    }

    // Múltiplos devedores
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      setError('O valor total deve ser maior que zero');
      return false;
    }

    const total = parseFloat(totalAmount);
    let sum = 0;

    for (const userId of selectedDebtors) {
      const amountStr = debtorAmounts[userId] || '0';
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount < 0) {
        setError(`Valor inválido para ${users.find((u: User) => u.id === userId)?.name || users.find((u: User) => u.id === userId)?.username || 'usuário'}`);
        return false;
      }
      sum += amount;
    }

    const difference = Math.abs(sum - total);
    if (difference > 0.01) { // Tolerância de 1 centavo para erros de arredondamento
      setError(`A soma dos valores individuais (R$ ${sum.toFixed(2)}) deve ser igual ao valor total (R$ ${total.toFixed(2)})`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const dueDate = formData.get('dueDate') as string;
    const description = formData.get('description') as string;
    const attachment = formData.get('attachment') as File;

    if (!dueDate) {
      setError('Selecione a data de promessa de pagamento');
      setSubmitting(false);
      return;
    }

    if (!validateAmounts()) {
      setSubmitting(false);
      return;
    }

    try {
      // Criar um FormData para cada dívida
      const debtsToCreate: FormData[] = [];

      selectedDebtors.forEach(userId => {
        const debtFormData = new FormData();
        debtFormData.append('debtorId', userId);
        const amount = selectedDebtors.length === 1
          ? (debtorAmounts[userId] || totalAmount)
          : debtorAmounts[userId];
        debtFormData.append('amount', amount);
        debtFormData.append('dueDate', dueDate);
        if (description && description.trim()) {
          debtFormData.append('description', description.trim());
        }
        if (attachment && attachment.size > 0) {
          debtFormData.append('attachment', attachment);
        }
        debtsToCreate.push(debtFormData);
      });

      // Criar todas as dívidas
      const results = await Promise.all(debtsToCreate.map((debtFormData: FormData) => createDebtAction(debtFormData)));

      const hasError = results.some((result: any) => result.error);
      if (hasError) {
        const firstError = results.find((result: any) => result.error);
        setError(firstError?.error || 'Erro ao criar dívidas');
      } else {
        const count = results.length;
        setSuccess(`${count} dívida${count > 1 ? 's' : ''} criada${count > 1 ? 's' : ''} com sucesso! 💸`);
        window.dispatchEvent(new Event('notifications:refresh'));
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao cadastrar dívida');
    } finally {
      setSubmitting(false);
    }
  };

  const isMultipleDebtors = selectedDebtors.length > 1;
  const remainingAmount = isMultipleDebtors && totalAmount
    ? (parseFloat(totalAmount) - selectedDebtors.reduce((sum: number, userId: string) => {
      const amount = parseFloat(debtorAmounts[userId] || '0');
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0)).toFixed(2)
    : '0.00';

  return (
    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-4 border-black">
      <h2 className="text-3xl font-black text-red-600 mb-8 text-center">💸 CRIAR NOVA DÍVIDA 💸</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            {/* Lista de Usuários */}
            <div>
              <label className="block text-lg font-bold text-gray-800 mb-2">
                💸 Quem tá me devendo essa grana? *
              </label>
              <div className="mt-1 space-y-2 max-h-60 overflow-y-auto border-2 border-gray-400 rounded-xl p-4 bg-white">
                {loading ? (
                  <div className="text-center py-4 text-gray-600 font-bold">Carregando as vítimas...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-4 text-gray-600 font-bold">Nenhum usuário disponível</div>
                ) : (
                  users.map((userItem: User) => (
                    <label key={userItem.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedDebtors.includes(userItem.id)}
                        onChange={() => handleDebtorToggle(userItem.id)}
                        disabled={loading}
                        className="w-5 h-5 text-red-600 border-2 border-gray-400 rounded focus:ring-2 focus:ring-red-500"
                      />
                      <span className="text-lg font-bold text-gray-800">
                        {userItem.name || userItem.username} {userItem.name && `(${userItem.username})`}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Data */}
            <div>
              <label htmlFor="dueDate" className="block text-lg font-bold text-gray-800 mb-2">
                📅 Quando ele(a) prometeu pagar? *
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                required
                className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold"
              />
            </div>

            {/* Detalhes */}
            <div>
              <label htmlFor="description" className="block text-lg font-bold text-gray-800 mb-2">
                📝 Detalhes da dívida (opcional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold"
                placeholder="Conta o que rolou... (ex: Emprestou 50 reais pra pizza, mas não pagou...)"
              />
            </div>

            {/* Anexo */}
            <div>
              <label htmlFor="attachment" className="block text-lg font-bold text-gray-800 mb-2">
                📎 Anexar imagem (opcional)
              </label>
              <input
                type="file"
                id="attachment"
                name="attachment"
                accept="image/*"
                className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-red-100 file:text-red-700 hover:file:bg-red-200"
              />
              <p className="mt-2 text-sm text-gray-600 font-bold">
                📸 Pode ser print, foto do recibo, comprovante, etc. (PNG, JPG, GIF - máx. 5MB)
              </p>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            {selectedDebtors.length === 1 && (
              <div>
                <label htmlFor="amount" className="block text-lg font-bold text-gray-800 mb-2">
                  💰 Quanto ele(a) me deve? (R$) *
                </label>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0.01"
                  required
                  value={debtorAmounts[selectedDebtors[0]] || totalAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTotalAmount(value);
                    setDebtorAmounts({ [selectedDebtors[0]]: value });
                  }}
                  className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold"
                  placeholder="0,00"
                />
              </div>
            )}

            {isMultipleDebtors && (
              <>
                <div>
                  <label htmlFor="totalAmount" className="block text-lg font-bold text-gray-800 mb-2">
                    💰 Valor total da dívida (R$) *
                  </label>
                  <input
                    type="number"
                    id="totalAmount"
                    step="0.01"
                    min="0.01"
                    required
                    value={totalAmount}
                    onChange={(e) => handleTotalAmountChange(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold"
                    placeholder="0,00"
                  />
                  <p className="mt-2 text-sm text-gray-600 font-bold">
                    💡 O valor será dividido igualmente entre os devedores selecionados. Você pode ajustar individualmente abaixo.
                  </p>
                </div>

                <div className="border-2 border-gray-300 rounded-xl p-4 bg-gray-50">
                  <h3 className="text-lg font-black text-gray-800 mb-4">
                    💸 Ajustar valores individuais (opcional)
                  </h3>
                  <div className="space-y-3">
                    {selectedDebtors.map((userId: string) => {
                      const userItem = users.find((u: User) => u.id === userId);
                      const displayName = userItem?.name || userItem?.username || 'Usuário';
                      const individualAmount = debtorAmounts[userId] || '0.00';

                      return (
                        <div key={userId}>
                          <label htmlFor={`amount-${userId}`} className="block text-md font-bold text-gray-700 mb-1">
                            {displayName}
                          </label>
                          <input
                            type="number"
                            id={`amount-${userId}`}
                            step="0.01"
                            min="0"
                            value={individualAmount}
                            onChange={(e) => handleDebtorAmountChange(userId, e.target.value)}
                            className="block w-full px-3 py-2 border-2 border-gray-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-md font-bold"
                            placeholder="0,00"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {totalAmount && (
                    <div className="mt-4 p-3 rounded-lg bg-white border-2 border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-md font-bold text-gray-700">Soma dos valores:</span>
                        <span className={`text-lg font-black ${Math.abs(parseFloat(remainingAmount)) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {selectedDebtors.reduce((sum: number, userId: string) => {
                            const amount = parseFloat(debtorAmounts[userId] || '0');
                            return sum + (isNaN(amount) ? 0 : amount);
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-md font-bold text-gray-700">Valor total:</span>
                        <span className="text-lg font-black text-gray-800">R$ {parseFloat(totalAmount || '0').toFixed(2)}</span>
                      </div>
                      {Math.abs(parseFloat(remainingAmount)) >= 0.01 && (
                        <div className="mt-2 text-sm text-red-600 font-bold">
                          ⚠️ Diferença: R$ {remainingAmount}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-100 border-2 border-red-400 p-4">
            <div className="text-lg text-red-800 font-bold text-center">❌ {error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-green-100 border-2 border-green-400 p-4">
            <div className="text-lg text-green-800 font-bold text-center">✅ {success}</div>
          </div>
        )}

        <div className="flex space-x-4 pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-xl hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-xl font-black border-2 border-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '💸 CRIANDO DÍVIDA...' : '💸 CRIAR DÍVIDA'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gradient-to-r from-gray-400 to-gray-600 text-white px-6 py-4 rounded-xl hover:from-gray-500 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-xl font-black border-2 border-black shadow-lg"
            >
              ❌ CANCELAR
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
