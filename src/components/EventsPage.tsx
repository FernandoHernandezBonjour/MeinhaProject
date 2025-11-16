'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Event as HubEvent, MediaItem } from '@/types';
import {
  getEventsAction,
  toggleEventReactionAction,
  addEventCommentAction,
  deleteEventAction,
} from '@/lib/actions/events';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getMediaContextAction } from '@/lib/actions/media';
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
    return <div className={`bg-gray-900 animate-pulse ${className}`} />;
  }

  return <img src={thumb} alt={alt} className={className} />;
};

const reactionOptions = ['🔥', '😂', '🍻', '🤮', '👍', '👎'];

export const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const { isXvideosMode } = useTheme();
  const [upcomingEvents, setUpcomingEvents] = useState<HubEvent[]>([]);
  const [flashbacks, setFlashbacks] = useState<HubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [eventMediaMap, setEventMediaMap] = useState<Record<string, MediaItem[]>>({});

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [eventsResponse, mediaResponse] = await Promise.all([
        getEventsAction(),
        getMediaContextAction(),
      ]);

      if (!eventsResponse.success) {
        setError(eventsResponse.error ?? 'Erro ao carregar eventos');
        return;
      }

      const parseEvent = (event: HubEvent): HubEvent => ({
        ...event,
        date: event.date instanceof Date ? event.date : new Date(event.date),
        createdAt: event.createdAt instanceof Date ? event.createdAt : new Date(event.createdAt),
        updatedAt: event.updatedAt instanceof Date ? event.updatedAt : new Date(event.updatedAt),
        comments: event.comments.map((comment) => ({
          ...comment,
          createdAt:
            comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt),
        })),
        reactions: event.reactions.map((reaction) => ({
          ...reaction,
          createdAt:
            reaction.createdAt instanceof Date ? reaction.createdAt : new Date(reaction.createdAt),
        })),
      });

      setUpcomingEvents((eventsResponse.upcoming ?? []).map(parseEvent));
      setFlashbacks((eventsResponse.flashbacks ?? []).map(parseEvent));

      if (mediaResponse.success && mediaResponse.media) {
        const map = mediaResponse.media.reduce<Record<string, MediaItem[]>>((acc, media) => {
          if (!media.eventId) return acc;
          if (!acc[media.eventId]) acc[media.eventId] = [];
          acc[media.eventId].push(media);
          return acc;
        }, {});
        setEventMediaMap(map);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const handler = () => loadEvents();
    window.addEventListener('events:reload', handler);
    window.addEventListener('media:reload', handler);
    return () => {
      window.removeEventListener('events:reload', handler);
      window.removeEventListener('media:reload', handler);
    };
  }, [loadEvents]);

  const handleToggleReaction = async (eventId: string, reaction: string) => {
    try {
      await toggleEventReactionAction(eventId, reaction);
      window.dispatchEvent(new Event('notifications:refresh'));
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reagir ao rolê');
    }
  };

  const handleCommentChange = (eventId: string, value: string) => {
    setCommentInputs((prev) => ({
      ...prev,
      [eventId]: value,
    }));
  };

  const handleAddComment = async (eventId: string) => {
    const content = commentInputs[eventId]?.trim();
    if (!content) {
      return;
    }
    try {
      const result = await addEventCommentAction(eventId, content);
      if (result.error) {
        setError(result.error);
        return;
      }
      window.dispatchEvent(new Event('notifications:refresh'));
      setCommentInputs((prev) => ({
        ...prev,
        [eventId]: '',
      }));
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao comentar no rolê');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que quer apagar esse rolê? Só os covardes fogem assim.')) {
      return;
    }

    try {
      const result = await deleteEventAction(eventId);
      if (result.error) {
        setError(result.error);
        return;
      }
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao apagar rolê');
    }
  };

  const reactionSummary = useMemo(() => {
    const summary: Record<string, Record<string, number>> = {};
    upcomingEvents.forEach((event) => {
      summary[event.id] = event.reactions.reduce((acc, item) => {
        acc[item.reaction] = (acc[item.reaction] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    });
    return summary;
  }, [upcomingEvents]);

  const fallbackCoverUrl = '/images/event-fallback.jpg';

  const getRandomPhotoUrl = (eventId: string): string | null => {
    const mediaItems = eventMediaMap[eventId] ?? [];
    const photoItems = mediaItems.filter((m) => m.type === 'photo');
    if (photoItems.length === 0) return null;
    const index = Math.floor(Math.random() * photoItems.length);
    return photoItems[index].url;
  };

  const getEventCoverUrl = (eventId: string): string => {
    return getRandomPhotoUrl(eventId) ?? fallbackCoverUrl;
  };

  const renderMediaSelector = (eventId: string) => {
    const mediaItems = eventMediaMap[eventId] ?? [];
    if (mediaItems.length === 0) return null;

    return (
      <div className="mt-2 overflow-x-auto">
        <div className="flex gap-2 pr-1">
          {mediaItems.map((mediaItem) => (
            <button
              key={mediaItem.id}
              onClick={() => setPreviewMedia(mediaItem)}
              className="relative w-20 h-12 rounded-md overflow-hidden flex-shrink-0 border border-gray-300 dark:border-gray-600 hover:opacity-90"
              title={mediaItem.type === 'photo' ? 'Ver foto' : 'Ver vídeo'}
            >
              {mediaItem.type === 'photo' ? (
                <img src={mediaItem.url} alt="Mídia" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <span className="text-white text-lg">🎬</span>
                </div>
              )}
              {mediaItem.type !== 'photo' && (
                <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1 rounded">vídeo</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${isXvideosMode ? '' : ''}`}>
      {!isXvideosMode && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 rounded-2xl p-8 text-white shadow-2xl border-4 border-black dark:border-gray-700 transition-colors duration-200">
          <h2 className="text-4xl font-black mb-4">🎉 Rolês do Meinha</h2>
          <p className="text-xl text-blue-200 dark:text-blue-100">
            Registre e reaja aos encontros épicos do grupo. Fotos, flashbacks e muita zoeira!
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-gray-800 dark:text-gray-200">Próximos Rolês</h3>
        <button
          onClick={() => window.dispatchEvent(new Event('actions:open-event-modal'))}
          className="bg-green-600 dark:bg-green-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 dark:hover:bg-green-600 transition-colors border-2 border-black dark:border-gray-600 shadow-lg"
        >
          ➕ Novo Rolê
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-700 p-4 transition-colors duration-200">
          <div className="text-lg text-red-800 dark:text-red-300 font-bold text-center">❌ {error}</div>
        </div>
      )}

      <div className={isXvideosMode ? 'xvideos-grid px-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'} style={isXvideosMode ? { minHeight: 'auto', overflow: 'visible' } : undefined}>
        {upcomingEvents.map((event) => {
          const eventReactionSummary = reactionSummary[event.id] ?? {};
          const userReactions = event.reactions.filter((reaction) => reaction.userId === user?.id);
          const pick = (obj: any, keys: string[]) => keys.map((k) => obj?.[k]).filter((v) => v != null);
          const creatorKeys = [
            'createdBy','created_by','createdById','created_by_id','creatorId','creator_id','ownerId','owner_id',
            'userId','user_id','authorId','author_id','createdByUsername','created_by_username','creatorUsername','creator_username'
          ];
          const userKeys = ['id','username','name','email'];
          const creatorValues = pick(event as any, creatorKeys);
          const userValues = pick(user as any, userKeys);
          const norm = (v: any) => String(v).trim().toLowerCase();
          const isCreator = creatorValues.some((cv) => userValues.some((uv) => norm(cv) === norm(uv)));

          const canDeleteEvent = Boolean(user && (user.role === 'admin' || isCreator));

          return (
            <div
              key={event.id}
              className={isXvideosMode ? 
                'xvideos-card transition-all duration-200 hover:opacity-90' :
                'bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-black dark:border-gray-700 hover:shadow-xl transition-all duration-200'
              }
              style={isXvideosMode ? { overflow: 'visible' } : undefined}
            >
              {/* Thumbnail - Modo XVIDEOS sempre mostra, modo normal só se tiver mídia */}
              {isXvideosMode ? (
                <div className="xvideos-thumbnail mb-3">
                  {(() => {
                    const items = eventMediaMap[event.id] ?? [];
                    const photos = items.filter(m => m.type === 'photo');
                    const videos = items.filter(m => m.type !== 'photo');
                    const coverUrl = photos.length > 0 ? getEventCoverUrl(event.id) : null;
                    const hasAny = items.length > 0;

                    if (coverUrl) {
                      return (
                        <div
                          className={`relative ${hasAny ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (hasAny) setPreviewMedia(items[0]);
                          }}
                        >
                          <img
                            src={coverUrl}
                            alt="Capa do rolê"
                            className="w-full aspect-video object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      );
                    }

                    // Sem fotos: usar placeholder/representação de vídeo
                    if (videos.length > 0) {
                      return (
                        <div
                          className="w-full aspect-video bg-black flex items-center justify-center cursor-pointer"
                          onClick={() => setPreviewMedia(videos[0])}
                        >
                          <span className="text-white text-5xl">🎬</span>
                        </div>
                      );
                    }

                    // Sem mídias: placeholder neutro
                    return (
                      <div className="w-full aspect-video bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                        <span className="text-4xl">🎞️</span>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                (eventMediaMap[event.id] ?? []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">Vergonhas registradas</p>
                    <div className="grid grid-cols-3 gap-2">
                      {eventMediaMap[event.id]
                        .slice(0, 6)
                        .map((mediaItem) => (
                          <div
                            key={mediaItem.id}
                            className="relative group"
                            onClick={() => setPreviewMedia(mediaItem)}
                          >
                            {mediaItem.type === 'photo' ? (
                              <img
                                src={mediaItem.url}
                                alt="Miniatura do rolê"
                                className="w-full h-20 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer group-hover:opacity-90 transition-opacity"
                              />
                            ) : (
                              <VideoThumbnail
                                src={mediaItem.url}
                                className="w-full h-20 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black rounded-lg">
                              Ver humilhação
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )
              )}

              {/* Conteúdo principal - sempre visível em ambos os modos */}
              <div className={isXvideosMode ? 'px-3 pt-3' : 'mb-4 space-y-3'}>
                <div className={isXvideosMode ? 'mb-3' : 'flex justify-between items-start'}>
                  <div>
                    <h4 className={isXvideosMode ? 'xvideos-title xvideos-text-primary mb-1' : 'text-xl font-bold text-gray-800 dark:text-gray-200'}>
                      {event.title}
                    </h4>
                    {!isXvideosMode && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Por {event.createdByUsername ?? event.createdBy}
                      </p>
                    )}
                  </div>
                  {!isXvideosMode && (
                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold border-2 border-blue-300 dark:border-blue-700 text-sm">
                      {event.date.toLocaleDateString('pt-BR')} às {event.time}
                    </span>
                  )}
                </div>
                {isXvideosMode && (
                  <div className="xvideos-meta mb-3">
                    {event.createdByUsername ?? event.createdBy} • {event.date.toLocaleDateString('pt-BR')} às {event.time}
                  </div>
                )}
                {event.description && (
                  <p className={isXvideosMode ? 'xvideos-text-secondary text-sm mb-2' : 'text-gray-700 dark:text-gray-300 font-semibold'}>
                    {event.description}
                  </p>
                )}
                <div className={isXvideosMode ? 'xvideos-text-secondary text-xs mb-3' : 'flex items-center text-gray-700 dark:text-gray-300 font-bold'}>
                  {isXvideosMode ? (
                    <>📍 {event.location}</>
                  ) : (
                    <>
                      <span className="mr-2">📍</span>
                      {event.location}
                    </>
                  )}
                </div>

                {/* Seletor de mídias do evento */}
                {renderMediaSelector(event.id)}
              </div>

              {/* Reações e Comentários - sempre visíveis */}
              <div className={isXvideosMode ? 'px-3 pt-2 space-y-3 pb-4' : 'space-y-3 mb-4'}>
                <div>
                  <h5 className={`${isXvideosMode ? 'xvideos-text-primary text-sm' : 'font-bold text-gray-800 dark:text-gray-200'} mb-2`}>
                    Reações
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {reactionOptions.map((reaction) => {
                      const count = eventReactionSummary[reaction] ?? 0;
                      const isActive = userReactions.some((item) => item.reaction === reaction);
                      return (
                        <button
                          key={reaction}
                          onClick={() => handleToggleReaction(event.id, reaction)}
                          className={`px-3 py-1 rounded-full border-2 font-bold text-sm transition-colors ${
                            isActive
                              ? 'bg-red-600 dark:bg-red-700 text-white border-black dark:border-gray-600'
                              : isXvideosMode
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {reaction} {count > 0 && <span className="ml-1">({count})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h5 className={`${isXvideosMode ? 'xvideos-text-primary text-sm' : 'font-bold text-gray-800 dark:text-gray-200'} mb-2`}>
                    Comentários
                  </h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {event.comments.length === 0 && (
                      <p className={`text-sm ${isXvideosMode ? 'xvideos-text-secondary' : 'text-gray-500 dark:text-gray-400'}`}>
                        Ninguém comentou ainda. Comece o deboche!
                      </p>
                    )}
                    {event.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3 rounded-lg border text-sm transition-colors duration-200 ${
                          isXvideosMode
                            ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <p className={`font-bold ${isXvideosMode ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          {comment.username ?? comment.userId}
                        </p>
                        <p className={isXvideosMode ? 'xvideos-text-primary text-sm' : 'text-gray-700 dark:text-gray-300 whitespace-pre-wrap'}>
                          {comment.content}
                        </p>
                        <p className={`text-xs mt-1 ${isXvideosMode ? 'xvideos-text-secondary' : 'text-gray-500 dark:text-gray-400'}`}>
                          {comment.createdAt.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex space-x-2">
                    <input
                      type="text"
                      placeholder="Solta o flashback desse rolê..."
                      value={commentInputs[event.id] ?? ''}
                      onChange={(e) => handleCommentChange(event.id, e.target.value)}
                      className={`flex-1 min-w-0 px-3 py-2 border-2 rounded-lg focus:outline-none transition-colors duration-200 ${
                        isXvideosMode
                          ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:border-orange-500 dark:focus:border-orange-600'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:border-red-500 dark:focus:border-red-600'
                      }`}
                    />
                    <button
                      onClick={() => handleAddComment(event.id)}
                      className={`shrink-0 px-4 py-2 text-white font-bold rounded-lg border-2 transition-colors duration-200 whitespace-nowrap ${
                        isXvideosMode
                          ? 'bg-orange-600 dark:bg-orange-700 border-gray-600 dark:border-gray-700 hover:bg-orange-700 dark:hover:bg-orange-600'
                          : 'bg-blue-600 dark:bg-blue-700 border-black dark:border-gray-600 hover:bg-blue-700 dark:hover:bg-blue-600'
                      }`}
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer do card */}
              <div className={isXvideosMode ? 'px-3 pb-4' : ''}>
                {!isXvideosMode && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right mb-2">
                    Atualizado em {event.updatedAt.toLocaleString('pt-BR')}
                  </div>
                )}

                {canDeleteEvent && (
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className={`w-full bg-red-600 dark:bg-red-700 text-white py-2 rounded-lg font-black border-2 transition-colors duration-200 ${
                      isXvideosMode
                        ? 'border-gray-600 dark:border-gray-700 hover:bg-red-700 dark:hover:bg-red-600 mt-2'
                        : 'border-black dark:border-gray-600 hover:bg-red-700 dark:hover:bg-red-600 mt-4'
                    }`}
                  >
                    🗑️ Apagar rolê
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={isXvideosMode ? 
        'mt-8' : 
        'bg-gradient-to-r from-yellow-400 to-orange-400 dark:from-yellow-600 dark:to-orange-600 rounded-2xl p-6 shadow-lg border-4 border-black dark:border-gray-700 space-y-4 transition-colors duration-200'
      }>
        <h3 className={`${isXvideosMode ? 'xvideos-text-primary text-2xl mb-4' : 'text-2xl font-black text-yellow-900 dark:text-yellow-100'}`}>
          🔥 Modo Flashback
        </h3>
        {flashbacks.length === 0 ? (
          <p className={isXvideosMode ? 'xvideos-text-secondary text-sm' : 'text-sm font-bold text-yellow-900 dark:text-yellow-100'}>
            Ainda não tem flashback. Bora registrar rolês para eternizar as vergonhas!
          </p>
        ) : (
          <div className={isXvideosMode ? 'xvideos-grid' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
            {flashbacks.slice(0, 6).map((event) => (
              <div
                key={event.id}
                className={isXvideosMode ?
                  'xvideos-card transition-all duration-200 hover:opacity-90' :
                  'bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border-2 border-yellow-600 dark:border-yellow-500 shadow transition-colors duration-200'
                }
              >
                {(() => {
                  // permission check same as upcoming events
                  const pick = (obj: any, keys: string[]) => keys.map((k) => obj?.[k]).filter((v) => v != null);
                  const creatorKeys = [
                    'createdBy','created_by','createdById','created_by_id','creatorId','creator_id','ownerId','owner_id',
                    'userId','user_id','authorId','author_id','createdByUsername','created_by_username','creatorUsername','creator_username'
                  ];
                  const userKeys = ['id','username','name','email'];
                  const creatorValues = pick(event as any, creatorKeys);
                  const userValues = pick(user as any, userKeys);
                  const norm = (v: any) => String(v).trim().toLowerCase();
                  const isCreator = creatorValues.some((cv) => userValues.some((uv) => norm(cv) === norm(uv)));
                  (event as any)._canDelete = Boolean(user && ((user as any).role === 'admin' || isCreator));
                  return null;
                })()}
                {isXvideosMode ? (
                  <div className="xvideos-thumbnail">
                    {(() => {
                      const items = eventMediaMap[event.id] ?? [];
                      const photos = items.filter(m => m.type === 'photo');
                      const videos = items.filter(m => m.type !== 'photo');
                      const coverUrl = photos.length > 0 ? getEventCoverUrl(event.id) : null;
                      const hasAny = items.length > 0;

                      if (coverUrl) {
                        return (
                          <div
                            className={`relative ${hasAny ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                              if (hasAny) setPreviewMedia(items[0]);
                            }}
                          >
                            <img src={coverUrl} alt="Capa do flashback" className="w-full aspect-video object-cover" />
                            {hasAny && (
                              <div className="xvideos-thumbnail-overlay">
                                {items.length > 1 && `+${items.length - 1} mais`}
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (videos.length > 0) {
                        return (
                          <div
                            className="w-full aspect-video bg-black flex items-center justify-center cursor-pointer"
                            onClick={() => setPreviewMedia(videos[0])}
                          >
                            <span className="text-white text-5xl">🎬</span>
                          </div>
                        );
                      }

                      return (
                        <div className="w-full aspect-video bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                          <span className="text-4xl">🎞️</span>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  (eventMediaMap[event.id] ?? []).length > 0 && (
                    <div className="mb-3">
                      <div className="grid grid-cols-3 gap-2">
                        {eventMediaMap[event.id].slice(0, 3).map((mediaItem) => (
                          <div key={mediaItem.id} className="relative group cursor-pointer" onClick={() => setPreviewMedia(mediaItem)}>
                            {mediaItem.type === 'photo' ? (
                              <img src={mediaItem.url} alt="Mídia do evento" className="w-full h-20 object-cover rounded-lg border border-yellow-400/60 group-hover:opacity-90" />
                            ) : (
                              <VideoThumbnail src={mediaItem.url} className="w-full h-20 object-cover rounded-lg border border-yellow-400/60" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}

                <div className={isXvideosMode ? 'xvideos-content px-3' : ''}>
                  <p className={isXvideosMode ? 'xvideos-title xvideos-text-primary mb-2' : 'text-lg font-black text-gray-800 dark:text-gray-200'}>
                    {event.title}
                  </p>
                  <p className={isXvideosMode ? 'xvideos-meta mb-2' : 'text-sm text-gray-600 dark:text-gray-300 font-semibold mt-1'}>
                    {event.date.toLocaleDateString('pt-BR')} • {event.location}
                  </p>
                  {event.description && (
                    <p className={isXvideosMode ? 'xvideos-text-secondary text-sm mb-2' : 'text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-3'}>
                      {event.description}
                    </p>
                  )}
                  <p className={isXvideosMode ? 'xvideos-text-secondary text-xs' : 'text-xs text-gray-500 dark:text-gray-400 mt-3'}>
                    Registrado em {event.createdAt.toLocaleDateString('pt-BR')}
                  </p>

                  {/* Seletor de mídias do flashback */}
                  {renderMediaSelector(event.id)}
                </div>

                {/* Delete button for flashback cards */}
                {(event as any)._canDelete && (
                  <div className={isXvideosMode ? 'px-3 pb-3 pt-2' : 'mt-3'}>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className={isXvideosMode
                        ? 'w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-bold border border-gray-700 transition-colors'
                        : 'w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold border-2 border-black transition-colors'}
                    >
                      🗑️ Apagar rolê
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <MediaViewerModal
        media={previewMedia}
        onClose={() => setPreviewMedia(null)}
        onUpdated={loadEvents}
      />
    </div>
  );
};

