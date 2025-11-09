'use client';

import React, { useMemo, useState } from 'react';
import { MediaItem } from '@/types';
import { addMediaCommentAction, toggleMediaReactionAction } from '@/lib/actions/media';
import { useAuth } from '@/contexts/AuthContext';

const reactionOptions = ['😂', '🔥', '🤮', '👏', '💀'];

interface MediaViewerModalProps {
  media: MediaItem | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({ media, onClose, onUpdated }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [reacting, setReacting] = useState<string | null>(null);

  const reactionSummary = useMemo(() => {
    if (!media) return {};
    return media.reactions.reduce(
      (acc, reaction) => ({
        ...acc,
        [reaction.reaction]: (acc[reaction.reaction] ?? 0) + 1,
      }),
      {} as Record<string, number>,
    );
  }, [media]);

  if (!media) {
    return null;
  }

  const handleComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await addMediaCommentAction(media.id, comment);
      if (result.error) {
        setError(result.error);
      } else {
        setComment('');
        onUpdated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao comentar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    setReacting(emoji);
    setError('');
    try {
      const result = await toggleMediaReactionAction(media.id, emoji);
      if (result.error) {
        setError(result.error);
      } else {
        onUpdated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reagir');
    } finally {
      setReacting(null);
    }
  };

  const canComment = Boolean(user);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full bg-white rounded-2xl border-4 border-black shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white text-2xl font-black bg-black/60 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black transition-colors z-10"
          aria-label="Fechar visualização da mídia"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="bg-black flex items-center justify-center">
            {media.type === 'photo' ? (
              <img
                src={media.url}
                alt="Mídia ampliada"
                className="w-full max-h-[80vh] object-contain"
              />
            ) : (
              <video
                src={media.url}
                controls
                className="w-full max-h-[80vh] bg-black"
              />
            )}
          </div>

          <div className="flex flex-col max-h-[80vh] overflow-hidden bg-white">
            <div className="p-5 border-b-2 border-gray-200 space-y-2">
              <p className="text-sm text-gray-500 font-bold">
                {media.eventTitle
                  ? `Rolê: ${media.eventTitle}`
                  : 'Solta da galera sem rolê específico'}
              </p>
              <p className="text-xs text-gray-500">
                {media.createdAt.toLocaleString('pt-BR')}
                {media.uploadedByUsername ? ` • Por ${media.uploadedByUsername}` : ''}
              </p>
              {media.description && (
                <p className="text-sm text-gray-700 italic">
                  "{media.description}"
                </p>
              )}
            </div>

            <div className="p-5 border-b-2 border-gray-200">
              <h4 className="text-sm font-black text-gray-800 uppercase mb-2">Reações humilhantes</h4>
              <div className="flex flex-wrap gap-2">
                {reactionOptions.map((emoji) => {
                  const count = reactionSummary[emoji] ?? 0;
                  const isCurrentUser = media.reactions.some(
                    (reaction) => reaction.userId === user?.id && reaction.reaction === emoji,
                  );
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      disabled={!user || reacting === emoji}
                      className={`px-3 py-1 rounded-full border-2 font-bold text-sm transition-all ${
                        isCurrentUser
                          ? 'bg-red-600 text-white border-black'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      } disabled:opacity-60`}
                    >
                      {emoji} {count > 0 && <span className="ml-1">({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {media.comments.length === 0 ? (
                <p className="text-sm text-gray-500 font-semibold">
                  Ninguém teve coragem de comentar essa vergonha ainda. Seja o primeiro a humilhar.
                </p>
              ) : (
                media.comments.map((commentItem) => (
                  <div
                    key={commentItem.id}
                    className="bg-gray-100 border-2 border-gray-300 rounded-xl p-3"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-black text-red-600">
                        {commentItem.username ?? 'Anônimo degenerado'}
                      </p>
                      <span className="text-xs text-gray-500 font-semibold">
                        {commentItem.createdAt.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 font-semibold mt-2">
                      {commentItem.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 border-t-2 border-gray-200">
              {error && (
                <div className="mb-3 text-sm font-bold text-red-700 bg-red-100 border-2 border-red-300 rounded-lg px-3 py-2">
                  ❌ {error}
                </div>
              )}
              <form onSubmit={handleComment} className="flex space-x-3">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Solta o deboche, expõe a vergonha..."
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 font-bold"
                  disabled={!canComment || submitting}
                />
                <button
                  type="submit"
                  disabled={!canComment || submitting || !comment.trim()}
                  className="px-4 py-3 bg-purple-600 text-white font-black rounded-lg border-2 border-black hover:bg-purple-700 transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Humilhando...' : 'Enviar'}
                </button>
              </form>
              {!canComment && (
                <p className="text-xs text-gray-500 font-semibold mt-2">
                  Faça login para poder humilhar os outros com comentários.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


