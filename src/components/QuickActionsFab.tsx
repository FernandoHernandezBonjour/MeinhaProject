'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DebtFormServer } from './DebtFormServer';
import { EventFormModal } from './EventFormModal';
import { MediaUploadModal } from './MediaUploadModal';

type ActionType = 'debt' | 'event' | 'media';

export const QuickActionsFab: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const closeDebtModal = useCallback(() => setShowDebtModal(false), []);
  const closeEventModal = useCallback(() => setShowEventModal(false), []);
  const closeMediaModal = useCallback(() => setShowMediaModal(false), []);

  const handleAction = useCallback(
    (action: ActionType) => {
      setOpen(false);

      if (action === 'debt') {
        setShowDebtModal(true);
        return;
      }

      if (action === 'event') {
        setShowEventModal(true);
        window.dispatchEvent(new CustomEvent('hub-set-tab', { detail: { tab: 'events' } }));
        return;
      }

      setShowMediaModal(true);
      window.dispatchEvent(new CustomEvent('hub-set-tab', { detail: { tab: 'media' } }));
    },
    [],
  );

  const actionButtons = useMemo(
    () => [
      {
        key: 'debt' as ActionType,
        label: 'Criar dívida',
        icon: '💰',
        className: 'bg-red-600 hover:bg-red-700',
      },
      {
        key: 'event' as ActionType,
        label: 'Registrar rolê',
        icon: '🎉',
        className: 'bg-blue-600 hover:bg-blue-700',
      },
      {
        key: 'media' as ActionType,
        label: 'Adicionar mídia',
        icon: '📸',
        className: 'bg-purple-600 hover:bg-purple-700',
      },
    ],
    [],
  );

  useEffect(() => {
    const handleOpenDebt = () => {
      setOpen(false);
      setShowDebtModal(true);
    };
    const handleOpenEvent = () => {
      setOpen(false);
      setShowEventModal(true);
    };
    const handleOpenMedia = () => {
      setOpen(false);
      setShowMediaModal(true);
    };

    window.addEventListener('actions:open-debt-modal', handleOpenDebt);
    window.addEventListener('actions:open-event-modal', handleOpenEvent);
    window.addEventListener('actions:open-media-modal', handleOpenMedia);

    return () => {
      window.removeEventListener('actions:open-debt-modal', handleOpenDebt);
      window.removeEventListener('actions:open-event-modal', handleOpenEvent);
      window.removeEventListener('actions:open-media-modal', handleOpenMedia);
    };
  }, []);

  return (
    <>
      <div
        className="fixed bottom-8 right-8 z-40 flex flex-col items-end space-y-3"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div
          className={`flex flex-col items-end space-y-3 mb-2 transition-all duration-200 ${
            open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          {actionButtons.map((action) => (
            <button
              key={action.key}
              onClick={() => handleAction(action.key)}
              className={`flex items-center space-x-2 px-4 py-2 text-white font-black rounded-full shadow-xl border-2 border-black transition-colors ${action.className}`}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setOpen((prev) => !prev)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-orange-500 text-white text-3xl font-black shadow-2xl border-4 border-black flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Ações rápidas"
        >
          ⚡
        </button>
      </div>

      {showDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <DebtFormServer
            onSuccess={() => {
              closeDebtModal();
              window.dispatchEvent(new Event('debts:reload'));
            }}
            onCancel={closeDebtModal}
          />
        </div>
      )}

      <EventFormModal
        open={showEventModal}
        onClose={closeEventModal}
        onCreated={() => {
          closeEventModal();
        }}
      />
      <MediaUploadModal
        open={showMediaModal}
        onClose={closeMediaModal}
        onUploaded={() => {
          closeMediaModal();
        }}
      />
    </>
  );
};


