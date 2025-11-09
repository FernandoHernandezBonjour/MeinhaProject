'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { uploadMediaAction } from '@/lib/actions/media';
import { getEventsSummaryAction } from '@/lib/actions/events';

interface MediaUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
}

interface EventOption {
  id: string;
  title: string;
  date?: Date;
  time?: string;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({ open, onClose, onUploaded }) => {
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState<string>('none');
  const [description, setDescription] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setEventId('none');
      setDescription('');
      setFile(null);
      setPreviewUrl('');
      setError('');
      setSubmitting(false);
      return;
    }

    const loadEvents = async () => {
      try {
        const response = await getEventsSummaryAction();
        if (response.success && response.events) {
          setEventOptions(
            response.events.map((event) => ({
              ...event,
              date:
                event.date instanceof Date
                  ? event.date
                  : event.date
                  ? new Date(event.date)
                  : undefined,
            })),
          );
        }
      } catch (err) {
        console.error('Erro ao carregar eventos para upload de mídia:', err);
      }
    };

    loadEvents();
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl('');
      return;
    }

    if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      setError('Apenas fotos (jpg, png) ou vídeos (mp4) são permitidos.');
      setFile(null);
      setPreviewUrl('');
      return;
    }

    setError('');
    setFile(selectedFile);
  };

  const fileTypeLabel = useMemo(() => {
    if (!file) return '';
    if (file.type.startsWith('image/')) return 'Foto';
    if (file.type.startsWith('video/')) return 'Vídeo';
    return 'Arquivo';
  }, [file]);

  const displayEvents = useMemo<EventOption[]>(
    () => [{ id: 'none', title: 'Sem evento' }, ...eventOptions],
    [eventOptions],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!file) {
      setError('Selecione um arquivo de mídia para enviar.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('description', description);
      if (eventId !== 'none') {
        formData.append('eventId', eventId);
      }

      const result = await uploadMediaAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      window.dispatchEvent(new Event('notifications:refresh'));
      window.dispatchEvent(new Event('media:reload'));
      onUploaded?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mídia');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full border-4 border-black shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-gray-800">📤 Upload de Mídia</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-xl font-black"
            aria-label="Fechar modal de upload de mídia"
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
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Evento (opcional)</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-bold"
            >
              {displayEvents.map((eventOption) => {
                const optionDate =
                  eventOption.date instanceof Date
                    ? eventOption.date
                    : eventOption.date
                    ? new Date(eventOption.date)
                    : undefined;
                return (
                  <option key={eventOption.id} value={eventOption.id}>
                    {eventOption.title}
                    {optionDate ? ` — ${optionDate.toLocaleDateString('pt-BR')}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-bold"
              placeholder="Conte como foi a cena vergonhosa registrada..."
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700">Arquivo de mídia</label>
            <div className="border-2 border-dashed border-gray-400 rounded-xl p-6 text-center bg-gray-50">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                id="media-upload-input"
              />
              <label
                htmlFor="media-upload-input"
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-black rounded-xl border-2 border-black cursor-pointer hover:bg-purple-700 transition-colors"
              >
                📁 Selecionar arquivo
              </label>
              <p className="mt-3 text-xs text-gray-600 font-semibold">
                Formatos aceitos: imagens (JPG, PNG, WEBP) até 5MB; vídeos (MP4) até 50MB.
              </p>
              {file && (
                <div className="mt-4 text-sm font-bold text-gray-800">
                  {fileTypeLabel}: {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                </div>
              )}
            </div>

            {previewUrl && file?.type.startsWith('image/') && (
              <div className="rounded-xl overflow-hidden border-2 border-gray-300">
                <img src={previewUrl} alt="Preview da mídia" className="w-full max-h-64 object-cover" />
              </div>
            )}
            {previewUrl && file?.type.startsWith('video/') && (
              <div className="rounded-xl overflow-hidden border-2 border-gray-300">
                <video src={previewUrl} controls className="w-full max-h-72 bg-black" />
              </div>
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
              disabled={submitting || !file}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors border-2 border-black disabled:opacity-60"
            >
              {submitting ? 'Enviando...' : 'Enviar Mídia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


