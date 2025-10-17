'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfileAction } from '@/lib/actions/users';

interface ProfileEditFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ onSuccess, onCancel }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    pixKey: user?.pixKey || '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(user?.photoURL || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('pixKey', formData.pixKey);
      
      // Se há um arquivo selecionado, adicionar ao FormData
      if (selectedFile) {
        formDataToSend.append('photo', selectedFile);
      }
      
      const result = await updateUserProfileAction(formDataToSend);
      
      if (result.error) {
        setError(result.error);
      } else if (result.success && result.user) {
        updateUser(result.user);
        setSuccess('Perfil atualizado com sucesso! 🎉');
        setTimeout(() => {
          onSuccess?.();
        }, 2000); // Fechar modal após 2 segundos
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB');
        return;
      }
      
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewURL(url);
      setError('');
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewURL(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-4 border-black">
      <h2 className="text-3xl font-black text-blue-600 mb-8 text-center">👤 EDITAR PERFIL 👤</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Foto no canto superior esquerdo */}
        <div className="flex items-start space-x-6 mb-8">
          {/* Área da Foto */}
          <div className="flex-shrink-0">
            <div 
              className="w-32 h-32 border-4 border-dashed border-gray-400 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewURL ? (
                <img 
                  src={previewURL} 
                  alt="Preview da foto" 
                  className="w-full h-full rounded-lg object-cover border-2 border-black shadow-lg"
                />
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-xs font-bold text-gray-800">CLIQUE AQUI</p>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {previewURL && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="mt-2 w-full bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 font-bold text-sm"
              >
                ❌ REMOVER
              </button>
            )}
          </div>

          {/* Informações básicas ao lado da foto */}
          <div className="flex-1">
            <div className="mb-4">
              <label htmlFor="username" className="block text-lg font-bold text-gray-800 mb-2">
                👤 Nome de usuário (não pode ser alterado):
              </label>
              <input
                type="text"
                id="username"
                value={user?.username || ''}
                disabled
                className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold bg-gray-100 cursor-not-allowed"
              />
              <p className="mt-2 text-sm text-gray-600 font-bold">
                O nome de usuário não pode ser alterado por segurança.
              </p>
            </div>
          </div>
        </div>

        {/* Campos em duas colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna da Esquerda */}
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-lg font-bold text-gray-800 mb-2">
                📝 Seu nome completo:
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                placeholder="Digite seu nome completo..."
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-lg font-bold text-gray-800 mb-2">
                📧 Seu email (opcional):
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                placeholder="Digite seu email..."
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Coluna da Direita */}
          <div className="space-y-6">
            <div>
              <label htmlFor="pixKey" className="block text-lg font-bold text-gray-800 mb-2">
                💳 Sua chave PIX (opcional):
              </label>
              <input
                type="text"
                id="pixKey"
                name="pixKey"
                className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                placeholder="Digite sua chave PIX (CPF, email, telefone, etc.)..."
                value={formData.pixKey}
                onChange={handleChange}
              />
              <p className="mt-2 text-sm text-gray-600 font-bold">
                Pode ser CPF, email, telefone ou chave aleatória
              </p>
            </div>
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
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-xl font-black border-2 border-black shadow-lg"
          >
            {loading ? 'Salvando...' : '💾 SALVAR PERFIL'}
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
