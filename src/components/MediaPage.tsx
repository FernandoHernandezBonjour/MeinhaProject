'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MediaItem } from '@/types';
import {
  getMediaContextAction,
  deleteMediaAction,
  addMediaCommentAction,
  toggleMediaReactionAction,
} from '@/lib/actions/media';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { MediaViewerModal } from './MediaViewerModal';

const VideoThumbnail: React.FC<{ src: string; className?: string; alt?: string }> = ({ src, className = '', alt = 'Vídeo' }) => {
  const [thumb, setThumb] = React.useState<string | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const capture = async () => {
      try {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'auto';
        video.src = src;
        video.muted = true;
        video.playsInline = true as any;

        await new Promise<void>((resolve, reject) => {
          const onLoaded = () => resolve();
          const onError = () => reject(new Error('Falha ao carregar vídeo'));
          video.addEventListener('loadeddata', onLoaded, { once: true });
          video.addEventListener('error', onError, { once: true });
        });

        // Garante dimensões
        const width = video.videoWidth || 320;
        const height = video.videoHeight || 180;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas não suportado');
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        if (!cancelled) setThumb(dataUrl);
      } catch (e) {
        if (!cancelled) setError(true);
      }
    };

    capture();
    return () => { cancelled = true; };
  }, [src]);

  if (error) {
    return (
      <div className={`bg-gray-900 flex items-center justify-center ${className}`}>
        <span className="text-white text-4xl">🎬</span>
      </div>
    );
  }

  if (!thumb) {
    return (
      <div className={`bg-gray-900 animate-pulse ${className}`} />
    );
  }

  return <img src={thumb} alt={alt} className={className} />;
};

const reactionOptions = ['😂', '🔥', '🤮', '👏', '💀'];

type ViewMode = 'grid' | 'slideshow';

interface MediaEventOption {
  id: string;
  title: string;
  date?: Date;
  time?: string;
}

export const MediaPage: React.FC = () => {
  const { user } = useAuth();
  const { isXvideosMode } = useTheme();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [events, setEvents] = useState<MediaEventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingCommentId, setSubmittingCommentId] = useState<string | null>(null);
  const [reactionPendingId, setReactionPendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMediaContextAction();

      if (!response.success) {
        setError(response.error ?? 'Erro ao carregar mídia');
        return;
      }

      const parsedMedia = (response.media ?? []).map((item) => ({
        ...item,
        createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
        updatedAt: item.updatedAt ? (item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt)) : undefined,
      }));

      const parsedEvents = (response.events ?? []).map((event) => ({
        ...event,
        date: event.date instanceof Date ? event.date : event.date ? new Date(event.date) : undefined,
      }));

      setMediaItems(parsedMedia);
      setEvents(parsedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mídia');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  useEffect(() => {
    const handler = () => loadMedia();
    window.addEventListener('media:reload', handler);
    return () => window.removeEventListener('media:reload', handler);
  }, [loadMedia]);

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Tem certeza de que deseja remover esta mídia?')) {
      return;
    }
    try {
      setDeletingId(mediaId);
      const result = await deleteMediaAction(mediaId);
      if (result.error) {
        alert(result.error);
        return;
      }
      await loadMedia();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover mídia');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCommentChange = (mediaId: string, value: string) => {
    setCommentInputs((prev) => ({
      ...prev,
      [mediaId]: value,
    }));
  };

  const handleAddComment = async (mediaId: string) => {
    const content = commentInputs[mediaId]?.trim();
    if (!content) return;
    setSubmittingCommentId(mediaId);
    setError('');
    try {
      const result = await addMediaCommentAction(mediaId, content);
      if (result.error) {
        setError(result.error);
      } else {
        setCommentInputs((prev) => ({ ...prev, [mediaId]: '' }));
        await loadMedia();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao comentar mídia');
    } finally {
      setSubmittingCommentId(null);
    }
  };

  const handleReaction = async (mediaId: string, emoji: string) => {
    setReactionPendingId(`${mediaId}:${emoji}`);
    setError('');
    try {
      const result = await toggleMediaReactionAction(mediaId, emoji);
      if (result.error) {
        setError(result.error);
      } else {
        await loadMedia();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reagir mídia');
    } finally {
      setReactionPendingId(null);
    }
  };

  const filteredMedia = useMemo(() => {
    if (selectedEvent === 'all') {
      return mediaItems;
    }
    return mediaItems.filter((item) => item.eventId === selectedEvent);
  }, [mediaItems, selectedEvent]);

  const stats = useMemo(() => {
    const photos = mediaItems.filter((item) => item.type === 'photo').length;
    const videos = mediaItems.filter((item) => item.type === 'video').length;
    const uniqueEvents = new Set(mediaItems.map((item) => item.eventId).filter(Boolean));
    return {
      total: mediaItems.length,
      photos,
      videos,
      events: uniqueEvents.size,
    };
  }, [mediaItems]);

  const eventOptions = useMemo(
    () => [
      { id: 'all', title: 'Todos os eventos' },
      ...events.map((event) => ({
        id: event.id,
        title: event.title,
      })),
    ],
    [events],
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 min-h-[75vh]">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl border-4 border-black">
        <h2 className="text-4xl font-black mb-4">📸 Galeria Meinha</h2>
        <p className="text-xl text-purple-200">
          Centralize as fotos e vídeos dos rolês e humilhações públicas.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border-4 border-black">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <label className="font-bold text-gray-800">Filtrar por evento:</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none font-bold"
            >
              {eventOptions.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="font-bold text-gray-800">Modo:</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg font-bold transition-colors border-2 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white border-blue-800'
                    : 'bg-gray-200 text-gray-700 border-gray-400'
                }`}
              >
                📱 Grade
              </button>
              <button
                onClick={() => setViewMode('slideshow')}
                className={`px-4 py-2 rounded-lg font-bold transition-colors border-2 ${
                  viewMode === 'slideshow'
                    ? 'bg-blue-600 text-white border-blue-800'
                    : 'bg-gray-200 text-gray-700 border-gray-400'
                }`}
              >
                🎬 Slideshow
              </button>
            </div>
          </div>

          <button
            onClick={() => window.dispatchEvent(new Event('actions:open-media-modal'))}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors border-2 border-black shadow-lg"
          >
            📤 Upload
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-100 border-2 border-red-400 p-4">
          <div className="text-lg text-red-800 font-bold text-center">❌ {error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-black text-center">
          <div className="text-3xl font-black text-blue-600">{stats.total}</div>
          <div className="text-sm font-bold text-gray-800">Total de mídias</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-black text-center">
          <div className="text-3xl font-black text-green-600">{stats.photos}</div>
          <div className="text-sm font-bold text-gray-800">Fotos</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-black text-center">
          <div className="text-3xl font-black text-purple-600">{stats.videos}</div>
          <div className="text-sm font-bold text-gray-800">Vídeos</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-black text-center">
          <div className="text-3xl font-black text-orange-600">{stats.events}</div>
          <div className="text-sm font-bold text-gray-800">Rolês registrados</div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className={isXvideosMode ? 'xvideos-grid' : 'grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'}>
          {filteredMedia.map((item) => {
            const canDelete = user && (user.role === 'admin' || user.id === item.uploadedBy);
            const reactionSummary = item.reactions.reduce<Record<string, number>>((acc, reaction) => {
              acc[reaction.reaction] = (acc[reaction.reaction] ?? 0) + 1;
              return acc;
            }, {});
            const userReactions = item.reactions.filter((reaction) => reaction.userId === user?.id);
            return (
              <div
                key={item.id}
                className={isXvideosMode ? 
                  'xvideos-card rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer flex flex-col h-full' :
                  'bg-white rounded-2xl p-4 shadow-lg border-4 border-black hover:shadow-xl transition-shadow group cursor-pointer flex flex-col h-full'
                }
                onClick={() => setPreviewItem(item)}
              >
                <div className={isXvideosMode ? 'xvideos-thumbnail' : 'relative overflow-hidden rounded-xl mb-4'}>
                  {item.type === 'photo' ? (
                    <img
                      src={item.url}
                      alt="Mídia do evento"
                      className={isXvideosMode ? 'w-full aspect-video object-cover' : 'w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300'}
                    />
                  ) : (
                    <VideoThumbnail
                      src={item.url}
                      alt="Vídeo do evento"
                      className={isXvideosMode ? 'w-full aspect-video object-cover' : 'w-full h-48 object-cover'}
                    />
                  )}

                  {!isXvideosMode && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-center text-white">
                        <p className="font-bold text-lg">{item.type === 'photo' ? '📸' : '🎬'}</p>
                        <p className="text-sm">Clique para ver</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className={isXvideosMode ? 'xvideos-content flex-1' : 'space-y-1 text-sm text-gray-700 flex-1'}>
                  <p className={isXvideosMode ? 'xvideos-title xvideos-text-primary' : 'font-bold text-gray-800'}>
                    {item.eventTitle || events.find((event) => event.id === item.eventId)?.title || 'Sem evento'}
                  </p>
                  <p className={isXvideosMode ? 'xvideos-meta' : 'text-xs text-gray-500'}>
                    {item.createdAt.toLocaleString('pt-BR')}
                    {item.uploadedByUsername ? ` • por ${item.uploadedByUsername}` : ''}
                  </p>
                  {!isXvideosMode && item.description && (
                    <p className="text-xs text-gray-600 italic">"{item.description}"</p>
                  )}
                </div>

                {!isXvideosMode && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-gray-500 uppercase">Reações</p>
                    <p className="text-xs text-gray-500 font-semibold cursor-pointer hover:text-gray-700" onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}>
                      Abrir modal →
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                    {reactionOptions.map((emoji) => {
                      const count = reactionSummary[emoji] ?? 0;
                      const isSelected = userReactions.some((reaction) => reaction.reaction === emoji);
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(item.id, emoji)}
                          disabled={!user || reactionPendingId === `${item.id}:${emoji}`}
                          className={`px-3 py-1 rounded-full border-2 font-bold text-xs transition-all ${
                            isSelected
                              ? 'bg-red-600 text-white border-black'
                              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                          } disabled:opacity-60`}
                        >
                          {emoji} {count > 0 && <span className="ml-1">({count})</span>}
                        </button>
                      );
                    })}
                    {item.reactions.length === 0 && (
                      <span className="text-xs text-gray-500 font-semibold italic">
                        Ninguém reagiu. Seja o primeiro a humilhar.
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-black text-gray-500 uppercase">Comentários</p>
                    {item.comments.length === 0 ? (
                      <p className="text-xs text-gray-500 font-semibold italic">
                        Nenhum comentário ainda. Clique pra soltar o deboche.
                      </p>
                    ) : (
                      item.comments.slice(0, 3).map((commentItem) => (
                        <div
                          key={commentItem.id}
                          className="bg-gray-100 border border-gray-200 rounded-lg p-2"
                        >
                          <p className="text-xs font-black text-red-600">{commentItem.username ?? 'Anônimo degenerado'}</p>
                          <p className="text-xs text-gray-700 font-semibold">
                            {commentItem.content}
                          </p>
                        </div>
                      ))
                    )}
                    {item.comments.length > 3 && (
                      <p className="text-xs text-gray-500 font-semibold">
                        +{item.comments.length - 3} humilhações escondidas
                      </p>
                    )}
                    <div className="flex items-center space-x-2 pt-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={commentInputs[item.id] ?? ''}
                        onChange={(e) => handleCommentChange(item.id, e.target.value)}
                        placeholder={user ? 'Escreva sua humilhação...' : 'Entre para humilhar também'}
                        className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 text-xs font-bold"
                        disabled={!user || submittingCommentId === item.id}
                      />
                      <button
                        onClick={() => handleAddComment(item.id)}
                        disabled={!user || submittingCommentId === item.id || !(commentInputs[item.id]?.trim())}
                        className="px-3 py-2 bg-purple-600 text-white text-xs font-black rounded-lg border-2 border-black hover:bg-purple-700 transition-colors disabled:opacity-60"
                      >
                        {submittingCommentId === item.id ? 'Mandando...' : 'Mandar'}
                      </button>
                    </div>
                    {!user && (
                      <p className="text-[10px] text-gray-500 font-semibold">
                        Faça login para humilhar os amigos em público.
                      </p>
                    )}
                  </div>
                </div>
                )}

                {/* Footer de ações com altura fixa para manter cartões iguais */}
                <div className={isXvideosMode ? 'px-3 pb-3 pt-2' : ''}>
                  {canDelete ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMedia(item.id);
                      }}
                      disabled={deletingId === item.id}
                      className={isXvideosMode
                        ? 'w-full h-10 bg-red-600/90 hover:bg-red-700 text-white rounded-md font-bold border border-gray-700 transition-colors text-sm'
                        : 'w-full h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold border-2 border-black transition-colors'
                      }
                    >
                      {deletingId === item.id ? 'Removendo...' : '🗑️ Remover'}
                    </button>
                  ) : (
                    <div className="h-10" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 shadow-lg border-4 border-black">
          <h3 className="text-2xl font-bold text-center mb-6">🎬 Slideshow das vergonhas</h3>
          <div className="relative">
            <div className="w-full h-96 bg-gray-900 rounded-xl flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-8xl mb-4">🎉</div>
                <p className="text-2xl font-bold">Modo Festa Ativado!</p>
                <p className="text-lg">Exibindo fotos aleatórias em tela cheia</p>
                <p className="text-sm text-gray-400 mt-2">(Implementação em breve)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <MediaViewerModal
        media={previewItem}
        onClose={() => setPreviewItem(null)}
        onUpdated={loadMedia}
      />
    </div>
  );
};





