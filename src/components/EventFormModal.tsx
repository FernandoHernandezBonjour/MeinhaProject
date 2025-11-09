'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createEventAction } from '@/lib/actions/events';

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

interface EventFormState {
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  photos: File[];
}

const defaultState: EventFormState = {
  title: '',
  description: '',
  location: '',
  date: '',
  time: '',
  photos: [],
};

export const EventFormModal: React.FC<EventFormModalProps> = ({ open, onClose, onCreated }) => {
  const [formState, setFormState] = useState<EventFormState>(defaultState);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormState(defaultState);
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  const hasPhotos = useMemo(() => formState.photos.length > 0, [formState.photos.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) {
      setFormState((prev) => ({
        ...prev,
        photos: [],
      }));
      return;
    }
    setFormState((prev) => ({
      ...prev,
      photos: Array.from(files),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', formState.title);
      formData.append('description', formState.description);
      formData.append('location', formState.location);
      formData.append('date', formState.date);
      formData.append('time', formState.time);
      formState.photos.forEach((photo) => formData.append('photos', photo));

      const result = await createEventAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      window.dispatchEvent(new Event('notifications:refresh'));
      window.dispatchEvent(new Event('events:reload'));
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar rolê');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full border-4 border-black shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-gray-800">Criar Novo Rolê</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-xl font-black"
            aria-label="Fechar modal de novo rolê"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-100 border-2 border-red-400 p-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            placeholder="Título do evento"
            value={formState.title}
            onChange={handleChange}
            required
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-bold"
          />
          <textarea
            name="description"
            placeholder="Descrição (opcional)"
            value={formState.description}
            onChange={handleChange}
            rows={3}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-bold"
          />
          <input
            type="text"
            name="location"
            placeholder="Local do rolê"
            value={formState.location}
            onChange={handleChange}
            required
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-bold"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              name="date"
              value={formState.date}
              onChange={handleChange}
              required
              className="p-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-bold"
            />
            <input
              type="time"
              name="time"
              value={formState.time}
              onChange={handleChange}
              required
              className="p-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Fotos (até 5 MB cada, opcional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
            />
            {hasPhotos && (
              <p className="text-xs text-gray-500 font-semibold mt-1">
                {formState.photos.length} foto(s) selecionada(s)
              </p>
            )}
          </div>

          <div className="flex space-x-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold hover:bg-gray-500 transition-colors border-2 border-black"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors border-2 border-black disabled:opacity-60"
            >
              {submitting ? 'Criando...' : 'Criar Rolê'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


