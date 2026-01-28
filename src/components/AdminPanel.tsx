'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { User } from '@/types';
import { getUsersAction, resetUserPasswordAction, updateUserByAdminAction } from '@/lib/actions/users';
import { UserRegistration } from './UserRegistration';
import { ScoreConfigForm } from './ScoreConfigForm';

interface ManagedUser extends Pick<User, 'id' | 'username' | 'role' | 'email' | 'name' | 'pixKey' | 'phone' | 'steamProfile' | 'passwordChanged' | 'forcePasswordReset' | 'skipCurrentPassword' | 'updatedAt'> { }

interface ResetResult {
  username: string;
  temporaryPassword: string;
}

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'score'>('users');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editFormData, setEditFormData] = useState({
    username: '',
    name: '',
    email: '',
    pixKey: '',
    phone: '',
    steamProfile: '',
    role: 'user' as 'admin' | 'user',
  });
  const [saving, setSaving] = useState(false);

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

  const handleEditUser = (user: ManagedUser) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username || '',
      name: user.name || '',
      email: user.email || '',
      pixKey: user.pixKey || '',
      phone: user.phone || '',
      steamProfile: user.steamProfile || '',
      role: user.role || 'user',
    });
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({
      username: '',
      name: '',
      email: '',
      pixKey: '',
      phone: '',
      steamProfile: '',
      role: 'user',
    });
    setError('');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('userId', editingUser.id);
      formData.append('username', editFormData.username);
      formData.append('name', editFormData.name);
      formData.append('email', editFormData.email);
      formData.append('pixKey', editFormData.pixKey);
      formData.append('phone', editFormData.phone);
      formData.append('steamProfile', editFormData.steamProfile);
      formData.append('role', editFormData.role);

      const result = await updateUserByAdminAction(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setEditingUser(null);
        await fetchUsers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a: ManagedUser, b: ManagedUser) => a.username.localeCompare(b.username)),
    [users],
  );

  return (
    <div className="space-y-8">

      <div className="bg-white rounded-2xl border-4 border-black shadow-2xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-black text-red-600 flex items-center space-x-2">
              <span>🛡️ Painel do Administrador</span>
            </h2>
            <p className="text-sm text-gray-600 font-bold mt-2">
              Gerencie usuários, regras do sistema e mantenha a ordem.
            </p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${activeTab === 'users' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Usuários
            </button>
            <button
              onClick={() => setActiveTab('score')}
              className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${activeTab === 'score' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-purple-700'}`}
            >
              MeinhaScore
            </button>
          </div>

          {activeTab === 'users' && (
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
          )}
        </div>

        {activeTab === 'score' ? (
          <ScoreConfigForm />
        ) : (
          <>
            {/* Users List Content */}


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
                    <th className="px-4 py-3 text-left text-sm font-black text-gray-700 tracking-wider">Nome Completo</th>
                    <th className="px-4 py-3 text-left text-sm font-black text-gray-700 tracking-wider hidden lg:table-cell">E-mail</th>
                    <th className="px-4 py-3 text-left text-sm font-black text-gray-700 tracking-wider hidden lg:table-cell">Chave PIX</th>
                    <th className="px-4 py-3 text-left text-sm font-black text-gray-700 tracking-wider">Função</th>
                    <th className="px-4 py-3 text-left text-sm font-black text-gray-700 tracking-wider">Status da Senha</th>
                    <th className="px-4 py-3 text-left text-sm font-black text-gray-700 tracking-wider hidden md:table-cell">Atualizado em</th>
                    <th className="px-4 py-3 text-right text-sm font-black text-gray-700 tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center text-gray-500 font-bold">
                        Carregando usuários...
                      </td>
                    </tr>
                  ) : sortedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center text-gray-500 font-bold">
                        Nenhum usuário cadastrado ainda.
                      </td>
                    </tr>
                  ) : (
                    sortedUsers.map((managedUser) => {
                      const needsReset = !managedUser.passwordChanged || managedUser.forcePasswordReset;
                      return (
                        <tr key={managedUser.id}>
                          <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-800">
                            <div className="flex items-center gap-2">
                              <span>{managedUser.username}</span>
                              <button
                                onClick={() => handleEditUser(managedUser)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="Editar usuário"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                            {managedUser.name || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 hidden lg:table-cell">
                            {managedUser.email || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 hidden lg:table-cell">
                            {managedUser.phone || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 hidden lg:table-cell">
                            {managedUser.pixKey || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-black rounded-full border-2 border-black ${managedUser.role === 'admin'
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
                              className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-black rounded-lg border-2 border-black shadow-lg hover:from-purple-700 hover:to-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          </>
        )}
      </div>

      {/* Modal de edição de usuário */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border-4 border-black shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-red-600">
                Editar Usuário: {editingUser.username}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700 text-2xl font-black"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border-2 border-red-400 rounded-xl">
                <p className="text-red-800 font-bold text-center">❌ {error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Nome de Usuário *
                </label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-semibold"
                  placeholder="nome_usuario"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-semibold"
                  placeholder="Nome completo do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-semibold"
                  placeholder="usuario@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-semibold"
                  placeholder="+5511987654321"
                  pattern="\+[0-9]{11,15}"
                />
                <p className="text-xs text-gray-500 mt-1 font-semibold">
                  Formato: +5511987654321 (código do país + DDD + número)
                </p>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={editFormData.pixKey}
                  onChange={(e) => setEditFormData({ ...editFormData, pixKey: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-semibold"
                  placeholder="Chave PIX (CPF, e-mail, telefone ou chave aleatória)"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Biblioteca da Steam
                </label>
                <input
                  type="url"
                  value={editFormData.steamProfile}
                  onChange={(e) => setEditFormData({ ...editFormData, steamProfile: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-semibold"
                  placeholder="https://steamcommunity.com/id/seu-usuario"
                />
                <p className="text-xs text-gray-500 mt-1 font-semibold">
                  URL completa do perfil da Steam
                </p>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">
                  Papel do Usuário *
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'admin' | 'user' })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-semibold"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="text-xs text-gray-500 mt-1 font-semibold">
                  {editFormData.role === 'admin' ? '⚠️ Usuários administradores têm acesso total ao sistema' : 'Usuários têm acesso limitado'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-6 py-2 bg-gray-200 text-gray-800 font-black rounded-lg border-2 border-black hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editFormData.username.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-800 text-white font-black rounded-lg border-2 border-black shadow-lg hover:from-green-700 hover:to-green-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

