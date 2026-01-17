'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChangelogItem } from '@/types';
import { getChangelogAction, createChangelogAction, deleteChangelogAction } from '@/lib/actions/changelog';

export const ChangelogPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ChangelogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const isAdmin = user?.role === 'admin';

  const fetchData = async () => {
    setLoading(true);
    const res = await getChangelogAction();
    if (res.success) {
      setItems(res.items || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que quer apagar essa atualização?')) {
      const res = await deleteChangelogAction(id);
      if (res.success) {
        fetchData();
      }
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-green-100 text-green-700 border-green-300';
      case 'fix': return 'bg-red-100 text-red-700 border-red-300';
      case 'improvement': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return '🚀';
      case 'fix': return '🔧';
      case 'improvement': return '📈';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-900 dark:to-indigo-900 rounded-2xl p-8 text-white shadow-2xl border-4 border-black dark:border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black mb-2">📜 Changelog</h2>
          <p className="text-xl text-purple-100 font-bold">Acompanhe as novidades e melhorias do site</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-purple-600 px-6 py-3 rounded-xl font-black border-2 border-black hover:bg-purple-50 transition-all shadow-lg hover:scale-105"
          >
            ➕ Lançar Update
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border-4 border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-2xl font-bold text-gray-500">Nenhuma atualização registrada ainda.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-black dark:border-gray-700 relative group transition-all hover:translate-x-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border-2 ${getTypeStyle(item.type)}`}>
                    {getTypeIcon(item.type)} {item.type}
                  </span>
                  {item.version && (
                    <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-black border-2 border-black">
                      v{item.version}
                    </span>
                  )}
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-bold ml-auto">
                    {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="text-2xl font-black mb-3 dark:text-white">{item.title}</h3>
                <div className="text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-bold italic">
                    Lançado por @{item.authorUsername || 'admin'}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 font-black text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      🗑️ APAGAR
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg w-full border-4 border-black shadow-2xl">
            <h2 className="text-3xl font-black mb-6 dark:text-white">🚀 Novo Update</h2>
            <form action={async (formData) => {
              const res = await createChangelogAction(formData);
              if (res.success) {
                setShowModal(false);
                fetchData();
              } else {
                alert(res.error);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-gray-300">Título</label>
                <input name="title" required className="w-full p-3 rounded-xl border-2 border-black dark:bg-gray-700 dark:text-white" placeholder="O que mudou?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-gray-300">Tipo</label>
                  <select name="type" required className="w-full p-3 rounded-xl border-2 border-black dark:bg-gray-700 dark:text-white font-bold">
                    <option value="feature">🚀 Nova Feature</option>
                    <option value="fix">🔧 Correção/Bug</option>
                    <option value="improvement">📈 Melhoria</option>
                    <option value="other">📝 Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-gray-300">Versão (opcional)</label>
                  <input name="version" className="w-full p-3 rounded-xl border-2 border-black dark:bg-gray-700 dark:text-white" placeholder="1.0.0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-gray-300">Conteúdo (Markdown-like)</label>
                <textarea name="content" required rows={6} className="w-full p-3 rounded-xl border-2 border-black dark:bg-gray-700 dark:text-white font-medium" placeholder="Explique as mudanças em detalhes..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-purple-600 text-white py-4 rounded-xl font-black border-2 border-black hover:bg-purple-700 shadow-lg">LANÇAR AGORA</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-500 text-white py-4 rounded-xl font-black border-2 border-black hover:bg-gray-600">CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
