'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ForumPost, ForumComment, ForumReaction } from '@/types';
import { 
  getForumPostsAction, 
  createForumPostAction, 
  addForumCommentAction, 
  toggleForumReactionAction,
  deleteForumPostAction 
} from '@/lib/actions/forum';
import { useAuth } from '@/contexts/AuthContext';
import { UserLink } from './UserLink';

const REACTIONS = [
  { emoji: '👍', value: 'like', label: 'Curtir' },
  { emoji: '❤️', value: 'love', label: 'Amar' },
  { emoji: '😂', value: 'laugh', label: 'Rir' },
  { emoji: '😮', value: 'wow', label: 'Uau' },
  { emoji: '😢', value: 'sad', label: 'Triste' },
  { emoji: '😡', value: 'angry', label: 'Bravo' },
];

export const ForumPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const result = await getForumPostsAction();
      if (result.success && result.posts) {
        setPosts(result.posts);
      } else {
        setError(result.error || 'Erro ao carregar posts');
      }
    } catch (err) {
      setError('Erro ao carregar posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const imageFiles = formData.getAll('images') as File[];

    if (!title?.trim()) {
      setError('Título é obrigatório');
      setSubmitting(false);
      return;
    }

    if (!content?.trim()) {
      setError('Conteúdo é obrigatório');
      setSubmitting(false);
      return;
    }

    try {
      const submitFormData = new FormData();
      submitFormData.append('title', title);
      submitFormData.append('content', content);
      submitFormData.append('category', 'debate');
      imageFiles.forEach((file) => {
        if (file && file.size > 0) {
          submitFormData.append('images', file);
        }
      });

      const result = await createForumPostAction(submitFormData);
      
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        (e.target as HTMLFormElement).reset();
        fetchPosts();
      }
    } catch (err) {
      setError('Erro ao criar post');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('postId', postId);
      formData.append('content', content);

      const result = await addForumCommentAction(formData);
      
      if (result.error) {
        setError(result.error);
      } else {
        setCommentInputs({ ...commentInputs, [postId]: '' });
        fetchPosts();
      }
    } catch (err) {
      setError('Erro ao adicionar comentário');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleReaction = async (postId: string, reaction: string) => {
    if (!user) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('postId', postId);
      formData.append('reaction', reaction);

      const result = await toggleForumReactionAction(formData);
      
      if (result.error) {
        setError(result.error);
      } else {
        fetchPosts();
      }
    } catch (err) {
      setError('Erro ao reagir');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Tem certeza que deseja deletar este post?')) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('postId', postId);

      const result = await deleteForumPostAction(formData);
      
      if (result.error) {
        setError(result.error);
      } else {
        fetchPosts();
      }
    } catch (err) {
      setError('Erro ao deletar post');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getReactionCount = (post: ForumPost, reactionType: string) => {
    return post.reactions.filter(r => r.reaction === reactionType).length;
  };

  const hasUserReacted = (post: ForumPost, reactionType: string) => {
    if (!user) return false;
    return post.reactions.some(r => r.userId === user.id && r.reaction === reactionType);
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) {
      return posts;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return posts.filter(post => 
      post.title.toLowerCase().includes(query) || 
      post.content.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl border-4 border-black">
        <h2 className="text-4xl font-black mb-4">💬 Fórum Interno</h2>
        <p className="text-xl text-indigo-200">
          Espaço de debates sem limites!
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border-2 border-red-600 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Campo de Pesquisa */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-4 border-black">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar posts por título ou conteúdo..."
              className="w-full p-3 pl-10 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
              🔍
            </span>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg border-2 border-gray-400 transition-colors"
              title="Limpar pesquisa"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            {filteredPosts.length === 0 
              ? 'Nenhum post encontrado com essa pesquisa.'
              : `Encontrados ${filteredPosts.length} post(s) com "${searchQuery}"`
            }
          </p>
        )}
      </div>

      {/* Botão de Criar Post */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-gray-800">
          {searchQuery ? `Resultados da Pesquisa` : 'Posts Recentes'}
        </h3>
        {user && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors border-2 border-black shadow-lg"
          >
            ✍️ Novo Post
          </button>
        )}
      </div>

      {/* Lista de Posts */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border-4 border-black">
            <p className="text-gray-600 text-lg">Nenhum post encontrado nesta categoria.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl p-6 shadow-lg border-4 border-black hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">💬</span>
                    <h4 className="text-xl font-bold text-gray-800">{post.title}</h4>
                  </div>
                  <div className="flex items-center space-x-2 mb-2 text-sm text-gray-600">
                    <span>Por</span>
                    <UserLink userId={post.authorId} username={post.authorUsername || post.authorId} />
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>
                  
                  {/* Imagens */}
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {post.images.map((imageUrl, idx) => (
                        <img
                          key={idx}
                          src={imageUrl}
                          alt={`Imagem ${idx + 1} do post`}
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-300 cursor-pointer hover:opacity-90"
                          onClick={() => window.open(imageUrl, '_blank')}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {(user?.id === post.authorId || user?.role === 'admin') && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="ml-4 text-red-600 hover:text-red-800 font-bold"
                    title="Deletar post"
                  >
                    🗑️
                  </button>
                )}
              </div>

              {/* Reações */}
              <div className="flex items-center space-x-4 mb-4 pb-4 border-b-2 border-gray-200">
                {REACTIONS.map((reaction) => {
                  const count = getReactionCount(post, reaction.value);
                  const reacted = hasUserReacted(post, reaction.value);
                  if (count === 0 && !reacted) return null;
                  
                  return (
                    <button
                      key={reaction.value}
                      onClick={() => handleToggleReaction(post.id, reaction.value)}
                      disabled={submitting || !user}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg border-2 transition-colors ${
                        reacted
                          ? 'bg-blue-100 border-blue-400 text-blue-800'
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                      } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={reaction.label}
                    >
                      <span>{reaction.emoji}</span>
                      {count > 0 && <span className="font-bold">{count}</span>}
                    </button>
                  );
                })}
                {user && (
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="flex items-center space-x-1 px-3 py-1 rounded-lg border-2 border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <span>💬</span>
                    <span className="font-bold">{post.comments.length}</span>
                  </button>
                )}
              </div>

              {/* Comentários */}
              {expandedPost === post.id && (
                <div className="mt-4 space-y-3">
                  {post.comments.length > 0 && (
                    <div className="space-y-3">
                      {post.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200"
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <UserLink userId={comment.authorId} username={comment.username || comment.authorId} />
                            <span className="text-sm text-gray-500">
                              {new Date(comment.createdAt).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {user && (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }
                        }}
                        placeholder="Escreva um comentário..."
                        className="flex-1 p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
                        disabled={submitting}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={submitting || !commentInputs[post.id]?.trim()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
                      >
                        Enviar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de Criar Post */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 border-4 border-black max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Criar Novo Post</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setError('');
                }}
                className="text-gray-600 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Título do post"
                required
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
                disabled={submitting}
              />
              
              <textarea
                name="content"
                placeholder="Conteúdo do post"
                required
                rows={6}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none resize-none"
                disabled={submitting}
              />
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Imagens (opcional)
                </label>
                <input
                  type="file"
                  name="images"
                  multiple
                  accept="image/*"
                  className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Você pode selecionar múltiplas imagens. Máximo 5MB por imagem.
                </p>
              </div>
              
              {error && (
                <div className="bg-red-100 border-2 border-red-600 text-red-800 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError('');
                  }}
                  disabled={submitting}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
