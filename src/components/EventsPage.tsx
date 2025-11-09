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
import { getMediaContextAction } from '@/lib/actions/media';
import { MediaViewerModal } from './MediaViewerModal';

const reactionOptions = ['🔥', '😂', '🍻', '🤮', '👍', '👎'];

export const EventsPage: React.FC = () => {
  const { user } = useAuth();
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
          if (media.type === 'photo') {
            acc[media.eventId].push(media);
          }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl border-4 border-black">
        <h2 className="text-4xl font-black mb-4">🎉 Rolês do Meinha</h2>
        <p className="text-xl text-blue-200">
          Registre e reaja aos encontros épicos do grupo. Fotos, flashbacks e muita zoeira!
        </p>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-gray-800">Próximos Rolês</h3>
        <button
          onClick={() => window.dispatchEvent(new Event('actions:open-event-modal'))}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors border-2 border-black shadow-lg"
        >
          ➕ Novo Rolê
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-100 border-2 border-red-400 p-4">
          <div className="text-lg text-red-800 font-bold text-center">❌ {error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingEvents.map((event) => {
          const eventReactionSummary = reactionSummary[event.id] ?? {};
          const userReactions = event.reactions.filter((reaction) => reaction.userId === user?.id);
          const canDeleteEvent = user && (user.role === 'admin' || user.id === event.createdBy);

          return (
            <div
              key={event.id}
              className="bg-white rounded-2xl p-6 shadow-lg border-4 border-black hover:shadow-xl transition-shadow"
            >
              <div className="mb-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">{event.title}</h4>
                    <p className="text-sm text-gray-500">
                      Por {event.createdByUsername ?? event.createdBy}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold border-2 border-blue-300 text-sm">
                    {event.date.toLocaleDateString('pt-BR')} às {event.time}
                  </span>
                </div>
                {event.description && (
                  <p className="text-gray-700 font-semibold">{event.description}</p>
                )}
                <div className="flex items-center text-gray-700 font-bold">
                  <span className="mr-2">📍</span>
                  {event.location}
                </div>
              </div>

              {(eventMediaMap[event.id] ?? []).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Vergonhas registradas</p>
                  <div className="grid grid-cols-3 gap-2">
                    {eventMediaMap[event.id]
                      .slice(0, 6)
                      .map((mediaItem) => (
                        <div
                          key={mediaItem.id}
                          className="relative group"
                          onClick={() => setPreviewMedia(mediaItem)}
                        >
                          <img
                            src={mediaItem.url}
                            alt="Miniatura do rolê"
                            className="w-full h-20 object-cover rounded-lg border-2 border-gray-300 cursor-pointer group-hover:opacity-90 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black rounded-lg">
                            Ver humilhação
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-4">
                <div>
                  <h5 className="font-bold text-gray-800 mb-2">Reações</h5>
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
                              ? 'bg-red-600 text-white border-black'
                              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {reaction} {count > 0 && <span className="ml-1">({count})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-gray-800 mb-2">Comentários</h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {event.comments.length === 0 && (
                      <p className="text-sm text-gray-500">Ninguém comentou ainda. Comece o deboche!</p>
                    )}
                    {event.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 bg-gray-100 rounded-lg border border-gray-200 text-sm"
                      >
                        <p className="font-bold text-blue-600">
                          {comment.username ?? comment.userId}
                        </p>
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
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
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                    />
                    <button
                      onClick={() => handleAddComment(event.id)}
                      className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg border-2 border-black hover:bg-blue-700 transition-colors"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-right">
                Atualizado em {event.updatedAt.toLocaleString('pt-BR')}
              </div>

              {canDeleteEvent && (
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="w-full bg-red-600 text-white py-2 mt-4 rounded-lg font-black border-2 border-black hover:bg-red-700 transition-colors"
                >
                  🗑️ Apagar rolê
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-6 shadow-lg border-4 border-black space-y-4">
        <h3 className="text-2xl font-black text-yellow-900">🔥 Modo Flashback</h3>
        {flashbacks.length === 0 ? (
          <p className="text-sm font-bold text-yellow-900">
            Ainda não tem flashback. Bora registrar rolês para eternizar as vergonhas!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashbacks.slice(0, 4).map((event) => (
              <div
                key={event.id}
                className="bg-white/80 rounded-xl p-4 border-2 border-yellow-600 shadow"
              >
                <p className="text-lg font-black text-gray-800">{event.title}</p>
                <p className="text-sm text-gray-600 font-semibold mt-1">
                  {event.date.toLocaleDateString('pt-BR')} • {event.location}
                </p>
                {event.description && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-3">{event.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-3">
                  Registrado em {event.createdAt.toLocaleDateString('pt-BR')}
                </p>
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

