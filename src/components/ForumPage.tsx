'use client';

import React, { useState, useEffect } from 'react';
import { ForumPost, ForumPostFormData } from '@/types';

export const ForumPage: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Mock data para demonstração
  useEffect(() => {
    const mockPosts: ForumPost[] = [
      {
        id: '1',
        title: 'Quem foi o maior caloteiro do mês?',
        content: 'Galera, vamos votar no maior caloteiro de dezembro. Eu já sei quem vai ganhar...',
        authorId: '1',
        category: 'votacao',
        poll: {
          id: '1',
          question: 'Quem foi o maior caloteiro do mês?',
          options: [
            { id: '1', text: 'Luis - R$ 1.250,50', votes: 8, voters: ['1', '2', '3', '4', '5', '6', '7', '8'] },
            { id: '2', text: 'Diego - R$ 890,00', votes: 3, voters: ['9', '10', '11'] },
            { id: '3', text: 'Fernando - R$ 650,75', votes: 1, voters: ['12'] }
          ],
          createdAt: new Date()
        },
        comments: [
          {
            id: '1',
            postId: '1',
            authorId: '2',
            content: 'Luis nem precisa votar, já ganhou por W.O.',
            createdAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        title: 'Qual foi o pior churrasco da história?',
        content: 'Lembram do churrasco que o Diego esqueceu o carvão? Ou daquele que o Luis não levou nada?',
        authorId: '2',
        category: 'zoeira',
        comments: [
          {
            id: '2',
            postId: '2',
            authorId: '3',
            content: 'O do carvão foi épico! Ficamos 2 horas esperando ele voltar da loja',
            createdAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        title: 'Qual dívida merece perdão (mas não vai ter)?',
        content: 'Discussão séria: qual dívida vocês acham que deveria ser perdoada? (Spoiler: nenhuma)',
        authorId: '3',
        category: 'debate',
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    setPosts(mockPosts);
    setLoading(false);
  }, []);

  const categories = [
    { id: 'all', name: 'Todos', icon: '🏠' },
    { id: 'debate', name: 'Debate', icon: '💬' },
    { id: 'votacao', name: 'Votação', icon: '🗳️' },
    { id: 'zoeira', name: 'Zoeira', icon: '😂' },
    { id: 'geral', name: 'Geral', icon: '📝' }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  const handleCreatePost = (formData: ForumPostFormData) => {
    // Aqui seria a lógica para criar um post
    console.log('Criando post:', formData);
    setShowForm(false);
  };

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
          Espaço de debates, votações e zoeira sem limites!
        </p>
      </div>

      {/* Categorias */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-4 border-black">
        <h3 className="text-xl font-bold mb-4">Categorias</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-bold transition-colors border-2 ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white border-indigo-800'
                  : 'bg-gray-200 text-gray-700 border-gray-400 hover:bg-gray-300'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Botão de Criar Post */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-gray-800">Posts Recentes</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors border-2 border-black shadow-lg"
        >
          ✍️ Novo Post
        </button>
      </div>

      {/* Lista de Posts */}
      <div className="space-y-6">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-2xl p-6 shadow-lg border-4 border-black hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">
                    {categories.find(c => c.id === post.category)?.icon}
                  </span>
                  <h4 className="text-xl font-bold text-gray-800">{post.title}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    post.category === 'votacao' ? 'bg-blue-100 text-blue-800' :
                    post.category === 'zoeira' ? 'bg-yellow-100 text-yellow-800' :
                    post.category === 'debate' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {categories.find(c => c.id === post.category)?.name}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{post.content}</p>
              </div>
            </div>

            {/* Enquete */}
            {post.poll && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <h5 className="font-bold text-blue-800 mb-3">{post.poll.question}</h5>
                <div className="space-y-2">
                  {post.poll.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-3">
                      <button className="flex-1 p-3 bg-white rounded-lg border-2 border-blue-300 hover:border-blue-500 transition-colors text-left">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{option.text}</span>
                          <span className="text-sm text-blue-600 font-bold">
                            {option.votes} votos
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(option.votes / Math.max(...post.poll!.options.map(o => o.votes))) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  Total de votos: {post.poll.options.reduce((sum, opt) => sum + opt.votes, 0)}
                </p>
              </div>
            )}

            {/* Comentários */}
            {post.comments.length > 0 && (
              <div className="mb-4">
                <h5 className="font-bold text-gray-800 mb-3">
                  Comentários ({post.comments.length})
                </h5>
                <div className="space-y-3">
                  {post.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          U
                        </span>
                        <span className="font-bold text-gray-800">Usuário</span>
                        <span className="text-sm text-gray-500">
                          {comment.createdAt.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors border-2 border-black">
                <span>💬</span>
                <span>Comentar</span>
              </button>
              {post.poll && (
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors border-2 border-black">
                  <span>🗳️</span>
                  <span>Votar</span>
                </button>
              )}
              <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors border-2 border-black">
                <span>❤️</span>
                <span>Curtir</span>
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Postado em {post.createdAt.toLocaleString('pt-BR')}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criar Post (simplificado) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 border-4 border-black">
            <h3 className="text-2xl font-bold mb-4">Criar Novo Post</h3>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Título do post"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
              />
              
              <select className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none">
                <option value="">Selecione uma categoria</option>
                {categories.slice(1).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              
              <textarea
                placeholder="Conteúdo do post"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none h-32"
              />
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                >
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

