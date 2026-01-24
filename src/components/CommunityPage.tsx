'use client';

import React, { useState } from 'react';
import { ForumPage } from './ForumPage';
import { MediaPage } from './MediaPage';
import { EventsPage } from './EventsPage';
import { BirthdaysPage } from './BirthdaysPage';

type CommunityTab = 'forum' | 'media' | 'events' | 'birthdays';

export const CommunityPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<CommunityTab>('forum');

    const tabs: { id: CommunityTab; label: string; icon: string }[] = [
        { id: 'forum', label: 'Fórum', icon: '💬' },
        { id: 'media', label: 'Mídia', icon: '📸' },
        { id: 'events', label: 'Rolês', icon: '🎉' },
        { id: 'birthdays', label: 'Aniversários', icon: '🎂' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'forum':
                return <ForumPage />;
            case 'media':
                return <MediaPage />;
            case 'events':
                return <EventsPage />;
            case 'birthdays':
                return <BirthdaysPage />;
            default:
                return <ForumPage />;
        }
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="mb-6 overflow-x-auto">
                <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                flex items-center px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap
                ${activeTab === tab.id
                                    ? 'bg-white dark:bg-gray-800 border-x border-t border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 font-bold'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }
              `}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-[500px]">
                {renderContent()}
            </div>
        </div>
    );
};
