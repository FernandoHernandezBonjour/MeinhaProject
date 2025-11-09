'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { User } from '@/types';
import { getUsersAction, resetUserPasswordAction } from '@/lib/actions/users';
import { UserRegistration } from './UserRegistration';

interface ManagedUser extends Pick<User, 'id' | 'username' | 'role' | 'email' | 'name' | 'passwordChanged' | 'forcePasswordReset' | 'skipCurrentPassword' | 'updatedAt'> {}

interface ResetResult {
  username: string;
  temporaryPassword: string;
}

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getUsersAction();

      if (result.error) {
        setError(result.error);
      } else if (result.success && result.users) {
        setUsers(result.users);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleResetPassword = async (userId: string) => {
    setError('');
    setResetResult(null);
    setResettingUserId(userId);

    try {
      const formData = new FormData();
      formData.append('userId', userId);

      const result = await resetUserPasswordAction(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.success && result.temporaryPassword && result.username) {
        setResetResult({
          username: result.username,
          temporaryPassword: result.temporaryPassword,
        });
        await fetchUsers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir a senha');
    } finally {
      setResettingUserId(null);
    }
  };

  const handleRegistrationSuccess = () => {
    setShowRegistration(false);
    fetchUsers();
  };

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => a.username.localeCompare(b.username)),
    [users],
  );

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border-4 border-black shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-red-600 flex items-center space-x-2">
              <span>🛡️ Painel do Administrador</span>
            </h2>
            <p className="text-sm text-gray-600 font-bold mt-2">
              Gerencie usuários, redefina senhas e mantenha o caos sob controle.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowRegistration((prev) => !prev)}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-800 text-white font-black rounded-lg border-2 border-black shadow-lg hover:from-green-700 hover:to-green-900 transition-colors"
            >
              {showRegistration ? 'Fechar cadastro' : 'Adicionar usuário'}
            </button>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-white text-red-600 font-black rounded-lg border-2 border-black hover:bg-red-100 transition-colors"
            >
              Atualizar lista
            </button>
          </div>
        </div>

        {showRegistration && (
          <div className="mb-8">
            <UserRegistration onSuccess={handleRegistrationSuccess} onCancel={() => setShowRegistration(false)} />
          </div>
        )}

        {resetResult && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-xl">
            <h3 className="text-xl font-black text-yellow-800 mb-2">Senha temporária gerada!</h3>
            <p className="text-sm font-bold text-gray-700">
              Usuário: <span className="text-red-600">{resetResult.username}</span>
            </p>
            <p className="text-lg font-black text-gray-900 mt-2">
              Nova senha: <span className="bg-white px-2 py-1 rounded border border-gray-300">{resetResult.temporaryPassword}</span>
            </p>
            <p className="text-xs text-gray-600 font-semibold mt-2">
              Compartilhe essa senha com o usuário. No próximo login ele será obrigado a trocar e não precisará informar a senha antiga.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-400 rounded-xl">
            <p className="text-red-800 font-bold text-center">❌ {error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white rounded-xl overflow-hidden border-2 border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-black text-gray-700 tracking-wider">Usuário</th>
                <th className="px-4 py-3 text-left text-sm font-black text-gray-700 tracking-wider">Função</th>
                <th className="px-4 py-3 text-left text-sm font-black text-gray-700 tracking-wider">Status da Senha</th>
                <th className="px-4 py-3 text-left text-sm font-black text-gray-700 tracking-wider hidden md:table-cell">Atualizado em</th>
                <th className="px-4 py-3 text-right text-sm font-black text-gray-700 tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500 font-bold">
                    Carregando usuários...
                  </td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500 font-bold">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              ) : (
                sortedUsers.map((managedUser) => {
                  const needsReset = !managedUser.passwordChanged || managedUser.forcePasswordReset;
                  return (
                    <tr key={managedUser.id}>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-800">
                        <div>{managedUser.username}</div>
                        {managedUser.name && (
                          <div className="text-xs text-gray-500">{managedUser.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-black rounded-full border-2 border-black ${
                            managedUser.role === 'admin'
                              ? 'bg-yellow-300 text-red-700'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {managedUser.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {needsReset ? (
                          <span className="font-bold text-red-600">
                            Senha precisa ser trocada
                          </span>
                        ) : (
                          <span className="font-semibold text-green-600">
                            Senha atualizada
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                        {managedUser.updatedAt
                          ? new Date(managedUser.updatedAt).toLocaleString('pt-BR')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleResetPassword(managedUser.id)}
                          disabled={resettingUserId === managedUser.id}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-black rounded-lg border-2 border-black shadow-lg hover:from-purple-700 hover:to-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {resettingUserId === managedUser.id ? 'Reiniciando...' : 'Reiniciar senha'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

