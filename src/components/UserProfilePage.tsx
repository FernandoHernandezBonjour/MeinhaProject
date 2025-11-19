'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Debt, EventComment, EventReaction, MediaComment, MediaReaction } from '@/types';
import { getUserProfileAction, addProfileCommentAction, deleteProfileCommentAction } from '@/lib/actions/profile';
import { UserLink } from './UserLink';

interface ProfileComment {
  id: string;
  authorId: string;
  authorUsername?: string;
  authorName?: string;
  content: string;
  createdAt: Date; // Convertido de ISO string no useEffect
}

interface UserProfileData {
  user: User;
  debts: Debt[];
  eventComments: Array<EventComment & { eventId: string; eventTitle: string }>;
  eventReactions: Array<EventReaction & { eventId: string; eventTitle: string }>;
  mediaComments: Array<MediaComment & { mediaId: string; mediaUrl: string }>;
  mediaReactions: Array<MediaReaction & { mediaId: string; mediaUrl: string }>;
  profileComments: ProfileComment[];
}

export const UserProfilePage: React.FC<{ username?: string; userId?: string }> = ({ 
  username, 
  userId 
}) => {
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getUserProfileAction(username, userId);
        
        if (result.error) {
          setError(result.error);
        } else if (result.success && result.data) {
          // Converter strings ISO de volta para Date onde necessário
          const data = result.data;
          setProfileData({
            user: {
              ...data.user,
              createdAt: new Date(data.user.createdAt),
              updatedAt: new Date(data.user.updatedAt),
            },
            debts: data.debts.map(debt => ({
              ...debt,
              dueDate: new Date(debt.dueDate),
              createdAt: new Date(debt.createdAt),
              updatedAt: new Date(debt.updatedAt),
            })),
            eventComments: data.eventComments.map(c => ({
              ...c,
              createdAt: new Date(c.createdAt),
            })),
            eventReactions: data.eventReactions.map(r => ({
              ...r,
              createdAt: new Date(r.createdAt),
            })),
            mediaComments: data.mediaComments.map(c => ({
              ...c,
              createdAt: new Date(c.createdAt),
            })),
            mediaReactions: data.mediaReactions.map(r => ({
              ...r,
              createdAt: new Date(r.createdAt),
            })),
            profileComments: data.profileComments.map(c => ({
              ...c,
              createdAt: new Date(c.createdAt),
            })),
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username, userId]);

  const handleAddComment = async () => {
    console.log('handleAddComment chamado', { newComment, profileData: !!profileData, currentUser: !!currentUser });
    
    if (!newComment.trim()) {
      setError('Por favor, escreva algo antes de enviar');
      return;
    }
    
    if (!profileData) {
      setError('Dados do perfil não carregados');
      return;
    }
    
    if (!currentUser) {
      setError('Você precisa estar logado para adicionar comentários');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('Chamando addProfileCommentAction', { targetUserId: profileData.user.id, content: newComment.trim() });
      const result = await addProfileCommentAction(profileData.user.id, newComment.trim());
      console.log('Resultado do addProfileCommentAction:', result);
      
      if (result.error) {
        console.error('Erro ao adicionar comentário:', result.error);
        setError(result.error);
        setSubmitting(false);
        return;
      }
      
      if (!result.success) {
        console.error('Resultado inesperado:', result);
        setError('Erro desconhecido ao adicionar comentário');
        setSubmitting(false);
        return;
      }
      
      console.log('Comentário adicionado com sucesso, recarregando perfil...');
      setNewComment('');
      
      // Aguardar um pouco para garantir que o Firestore processou
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recarregar perfil com conversão de datas
      const refreshResult = await getUserProfileAction(username, userId);
      console.log('Resultado do refresh:', refreshResult);
      
      if (refreshResult.error) {
        console.error('Erro ao recarregar perfil:', refreshResult.error);
        setError(`Comentário adicionado, mas erro ao recarregar: ${refreshResult.error}`);
        setSubmitting(false);
        return;
      }
      
      if (refreshResult.success && refreshResult.data) {
        const data = refreshResult.data;
        console.log('Dados recebidos:', { 
          profileCommentsCount: data.profileComments.length,
          profileComments: data.profileComments 
        });
        
        setProfileData({
          user: {
            ...data.user,
            createdAt: new Date(data.user.createdAt),
            updatedAt: new Date(data.user.updatedAt),
          },
          debts: data.debts.map(debt => ({
            ...debt,
            dueDate: new Date(debt.dueDate),
            createdAt: new Date(debt.createdAt),
            updatedAt: new Date(debt.updatedAt),
          })),
          eventComments: data.eventComments.map(c => ({
            ...c,
            createdAt: new Date(c.createdAt),
          })),
          eventReactions: data.eventReactions.map(r => ({
            ...r,
            createdAt: new Date(r.createdAt),
          })),
          mediaComments: data.mediaComments.map(c => ({
            ...c,
            createdAt: new Date(c.createdAt),
          })),
          mediaReactions: data.mediaReactions.map(r => ({
            ...r,
            createdAt: new Date(r.createdAt),
          })),
          profileComments: data.profileComments.map(c => ({
            ...c,
            createdAt: new Date(c.createdAt),
          })),
        });
        console.log('Perfil atualizado com sucesso. Total de comentários:', data.profileComments.length);
        setError(''); // Limpar qualquer erro anterior
      } else {
        console.error('Dados não recebidos no refresh');
        setError('Comentário pode ter sido adicionado, mas não foi possível recarregar o perfil');
      }
    } catch (err) {
      console.error('Exceção ao adicionar comentário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar comentário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Tem certeza que deseja remover este comentário?')) {
      return;
    }

    setDeletingCommentId(commentId);
    setError('');

    try {
      const result = await deleteProfileCommentAction(commentId);
      
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // Recarregar perfil
        const refreshResult = await getUserProfileAction(username, userId);
        if (refreshResult.success && refreshResult.data) {
          const data = refreshResult.data;
          setProfileData({
            user: {
              ...data.user,
              createdAt: new Date(data.user.createdAt),
              updatedAt: new Date(data.user.updatedAt),
            },
            debts: data.debts.map(debt => ({
              ...debt,
              dueDate: new Date(debt.dueDate),
              createdAt: new Date(debt.createdAt),
              updatedAt: new Date(debt.updatedAt),
            })),
            eventComments: data.eventComments.map(c => ({
              ...c,
              createdAt: new Date(c.createdAt),
            })),
            eventReactions: data.eventReactions.map(r => ({
              ...r,
              createdAt: new Date(r.createdAt),
            })),
            mediaComments: data.mediaComments.map(c => ({
              ...c,
              createdAt: new Date(c.createdAt),
            })),
            mediaReactions: data.mediaReactions.map(r => ({
              ...r,
              createdAt: new Date(r.createdAt),
            })),
            profileComments: data.profileComments.map(c => ({
              ...c,
              createdAt: new Date(c.createdAt),
            })),
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover comentário');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const getUserInitials = (u?: { username?: string; name?: string }) => {
    const base = u?.name || u?.username || '';
    const parts = base.trim().split(/\s+/).slice(0, 2);
    if (parts.length === 0 || parts[0] === '') return '🐷';
    const initials = parts.map((p) => p[0]?.toUpperCase()).join('');
    return initials || '🐷';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-8 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-black text-red-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="bg-red-100 border-2 border-red-400 rounded-xl p-6 text-center">
        <p className="text-red-800 font-bold text-lg">❌ {error}</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="bg-gray-100 border-2 border-gray-400 rounded-xl p-6 text-center">
        <p className="text-gray-800 font-bold text-lg">Usuário não encontrado</p>
      </div>
    );
  }

  const { user, debts, eventComments, eventReactions, mediaComments, mediaReactions, profileComments } = profileData;
  const isOwnProfile = currentUser?.id === user.id;

  const totalDebt = debts.reduce((sum, debt) => {
    if (debt.debtorId === user.id && debt.status === 'OPEN') {
      return sum + (debt.remainingAmount || debt.amount);
    }
    return sum;
  }, 0);

  const totalCredits = debts.reduce((sum, debt) => {
    if (debt.creditorId === user.id && debt.status === 'OPEN') {
      return sum + (debt.remainingAmount || debt.amount);
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header do Perfil */}
      <div className="bg-white rounded-2xl border-4 border-black shadow-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-black bg-gray-200 flex items-center justify-center">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name || user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl font-extrabold text-gray-900">
                  {getUserInitials(user)}
                </span>
              )}
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="flex-1">
            <h1 className="text-4xl font-black text-red-600 mb-2">
              {user.name || user.username}
            </h1>
            <p className="text-xl text-gray-600 font-bold mb-4">@{user.username}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.email && (
                <div>
                  <span className="text-sm font-black text-gray-700">E-mail:</span>
                  <p className="text-gray-800 font-semibold">{user.email}</p>
                </div>
              )}
              {user.phone && (
                <div>
                  <span className="text-sm font-black text-gray-700">Telefone:</span>
                  <p className="text-gray-800 font-semibold">{user.phone}</p>
                </div>
              )}
              {user.pixKey && (
                <div>
                  <span className="text-sm font-black text-gray-700">Chave PIX:</span>
                  <p className="text-gray-800 font-semibold">{user.pixKey}</p>
                </div>
              )}
              {user.steamProfile && (
                <div>
                  <span className="text-sm font-black text-gray-700">Steam:</span>
                  <div className="mt-1">
                    <a
                      href={user.steamProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
                    >
                      <img
                        src="/images/steam.png"
                        alt="Steam"
                        className="w-6 h-6 object-contain flex-shrink-0"
                        style={{ 
                          display: 'inline-block', 
                          verticalAlign: 'middle',
                          minWidth: '24px',
                          minHeight: '24px'
                        }}
                        onError={(e) => {
                          console.error('Erro ao carregar logo da Steam de /images/steam.png');
                          console.error('Elemento img:', e.currentTarget);
                          console.error('src atual:', e.currentTarget.src);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={(e) => {
                          console.log('Logo da Steam carregado com sucesso!');
                          console.log('src:', e.currentTarget.src);
                        }}
                      />
                      <span>Steam</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-100 border-4 border-red-600 rounded-xl p-4">
          <h3 className="text-lg font-black text-red-800 mb-2">💰 Dívidas</h3>
          <p className="text-2xl font-black text-red-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDebt)}
          </p>
        </div>
        <div className="bg-green-100 border-4 border-green-600 rounded-xl p-4">
          <h3 className="text-lg font-black text-green-800 mb-2">💵 A Receber</h3>
          <p className="text-2xl font-black text-green-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCredits)}
          </p>
        </div>
      </div>

      {/* Estatísticas de Atividade */}
      <div className="bg-white rounded-2xl border-4 border-black shadow-2xl p-6">
        <h2 className="text-2xl font-black text-red-600 mb-4">📊 Atividade no Site</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-black text-gray-800">{eventComments.length}</p>
            <p className="text-sm font-bold text-gray-600">Comentários em Eventos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-gray-800">{eventReactions.length}</p>
            <p className="text-sm font-bold text-gray-600">Reações em Eventos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-gray-800">{mediaComments.length}</p>
            <p className="text-sm font-bold text-gray-600">Comentários em Mídia</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-gray-800">{mediaReactions.length}</p>
            <p className="text-sm font-bold text-gray-600">Reações em Mídia</p>
          </div>
        </div>
      </div>

      {/* Mural de Comentários */}
      <div className="bg-white rounded-2xl border-4 border-black shadow-2xl p-6">
        <h2 className="text-2xl font-black text-red-600 mb-4">💬 Mural</h2>
        
        {/* Mensagem de erro específica do mural */}
        {error && error.includes('comentário') && (
          <div className="mb-4 p-4 bg-red-100 border-2 border-red-400 rounded-xl">
            <p className="text-red-800 font-bold text-center">❌ {error}</p>
          </div>
        )}
        
        {/* Formulário de Novo Comentário */}
        {currentUser && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-300">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Escreva algo sobre ${user.name || user.username}...`}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-semibold mb-3"
              rows={3}
              disabled={submitting}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submitting}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black rounded-lg border-2 border-black shadow-lg hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Enviando...' : 'Enviar'}
              </button>
              {submitting && (
                <span className="text-sm text-gray-600 font-semibold">Aguarde...</span>
              )}
            </div>
          </div>
        )}

        {/* Lista de Comentários */}
        {profileComments.length === 0 ? (
          <p className="text-gray-500 font-semibold text-center py-8">
            Ninguém escreveu nada ainda. Seja o primeiro!
          </p>
        ) : (
          <div className="space-y-4">
            {profileComments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 bg-gray-50 rounded-xl border-2 border-gray-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <UserLink
                      username={comment.authorUsername || 'usuário'}
                      name={comment.authorName}
                      userId={comment.authorId}
                    />
                    <span className="text-gray-500 text-sm">
                      {new Date(comment.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deletingCommentId === comment.id}
                      className="px-3 py-1 bg-red-600 text-white text-xs font-black rounded-lg border-2 border-black hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Remover comentário (apenas admin)"
                    >
                      {deletingCommentId === comment.id ? 'Removendo...' : '🗑️ Remover'}
                    </button>
                  )}
                </div>
                <p className="text-gray-800 font-semibold whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comentários em Eventos */}
      {eventComments.length > 0 && (
        <div className="bg-white rounded-2xl border-4 border-black shadow-2xl p-6">
          <h2 className="text-2xl font-black text-red-600 mb-4">💬 Comentários em Eventos</h2>
          <div className="space-y-3">
            {eventComments.slice(0, 10).map((comment) => (
              <div key={comment.id} className="p-3 bg-gray-50 rounded-lg border border-gray-300">
                <p className="text-sm text-gray-600 mb-1">
                  No evento: <span className="font-bold">{comment.eventTitle}</span>
                </p>
                <p className="text-gray-800 font-semibold">{comment.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(comment.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reações em Eventos */}
      {eventReactions.length > 0 && (
        <div className="bg-white rounded-2xl border-4 border-black shadow-2xl p-6">
          <h2 className="text-2xl font-black text-red-600 mb-4">😄 Reações em Eventos</h2>
          <div className="flex flex-wrap gap-2">
            {eventReactions.map((reaction) => (
              <div
                key={reaction.id}
                className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300"
              >
                <span className="text-2xl">{reaction.reaction}</span>
                <span className="text-sm text-gray-600 ml-2">{reaction.eventTitle}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

