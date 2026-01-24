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
    phone: user?.phone || '',
    steamProfile: user?.steamProfile || '',
    birthDate: user?.birthDate || '',
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
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('steamProfile', formData.steamProfile);
      formDataToSend.append('birthDate', formData.birthDate);

      // Se há um arquivo selecionado, adicionar ao FormData
      if (selectedFile) {
        formDataToSend.append('photo', selectedFile);
      }

      const result: any = await updateUserProfileAction(formDataToSend);

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
    <div className="w-full">
      <h2 className="text-2xl font-black text-blue-600 mb-6 text-center">👤 EDITAR PERFIL 👤</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Foto e Info Básica */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="flex-shrink-0">
            <div
              className="w-24 h-24 border-2 border-dashed border-gray-400 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center relative group"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewURL ? (
                <>
                  <img
                    src={previewURL}
                    alt="Preview"
                    className="w-full h-full rounded-lg object-cover border border-black"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <span className="text-white text-xs font-bold">Alterar</span>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="text-2xl">📷</div>
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
                className="mt-1 w-full text-red-600 hover:text-red-800 text-xs font-bold"
              >
                Remover
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Nome de usuário
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-bold text-sm">
              @{user?.username}
            </div>
            <p className="mt-1 text-[10px] text-gray-500">
              Não pode ser alterado.
            </p>
          </div>
        </div>

        {/* Campos em Grid Compacto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="pixKey" className="block text-sm font-bold text-gray-700 mb-1">
              Chave PIX
            </label>
            <input
              type="text"
              id="pixKey"
              name="pixKey"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={formData.pixKey}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="+55..."
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="steamProfile" className="block text-sm font-bold text-gray-700 mb-1">
              Steam Profile URL
            </label>
            <input
              type="url"
              id="steamProfile"
              name="steamProfile"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={formData.steamProfile}
              onChange={handleChange}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="birthDate" className="block text-sm font-bold text-gray-700 mb-1">
              Data de nascimento
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎂</span>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={formData.birthDate}
                onChange={handleChange}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Para aparecer na lista de aniversariantes.</p>
          </div>
        </div>

        {/* Mensagens de Erro/Sucesso */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-3 py-2 rounded-lg text-center font-medium">
            {success}
          </div>
        )}

        {/* Botões */}
        <div className="flex space-x-3 pt-4 border-t border-gray-100 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm shadow-sm hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm transition-colors border border-gray-200"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
