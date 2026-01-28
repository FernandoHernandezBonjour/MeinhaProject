'use client';

import React, { useEffect, useState } from 'react';
import { getPublicUserListAction } from '@/lib/actions/users';

interface PublicUser {
    id: string;
    username: string;
    name?: string;
    photoURL?: string;
    birthDate?: string;
}

interface BirthdayDisplay extends PublicUser {
    ageTurning: number;
    daysUntil: number;
    nextBirthday: Date;
    formattedDate: string;
}

export const BirthdaysPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<BirthdayDisplay[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const result = await getPublicUserListAction();

            if (result.error) {
                setError(result.error);
                return;
            }

            if (result.users) {
                const processedUsers = processBirthdays(result.users);
                setUsers(processedUsers);
            }
        } catch (err) {
            console.error('Erro ao carregar aniversários:', err);
            setError('Falha ao carregar lista de aniversários.');
        } finally {
            setLoading(false);
        }
    };

    const processBirthdays = (rawUsers: PublicUser[]): BirthdayDisplay[] => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentYear = today.getFullYear();

        const withBirthdays = rawUsers.filter((u: PublicUser) => u.birthDate).map((user: PublicUser) => {
            // Parse birthdate (assuming YYYY-MM-DD)
            const [bYear, bMonth, bDay] = (user.birthDate || '').split('-').map(Number);

            // Calculate next birthday
            let nextBirthday = new Date(currentYear, bMonth - 1, bDay);
            if (nextBirthday < today) {
                nextBirthday = new Date(currentYear + 1, bMonth - 1, bDay);
            }

            // Calculate age turning
            const ageTurning = nextBirthday.getFullYear() - bYear;

            // Calculate days until
            const diffTime = Math.abs(nextBirthday.getTime() - today.getTime());
            const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Format date (DD/MM)
            const formattedDate = `${bDay.toString().padStart(2, '0')}/${bMonth.toString().padStart(2, '0')}`;

            return {
                ...user,
                ageTurning,
                daysUntil,
                nextBirthday,
                formattedDate
            };
        });

        // Sort by days until birthday
        return withBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                {error}
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500 text-lg">Nenhum aniversário encontrado.</p>
                <p className="text-gray-400 text-sm mt-2">Os usuários precisam cadastrar a data de nascimento no perfil.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                🎂 Próximos Aniversários
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user: BirthdayDisplay) => (
                    <div
                        key={user.id}
                        className={`
              relative overflow-hidden rounded-xl p-4 shadow-sm border transition-all hover:shadow-md
              ${user.daysUntil === 0
                                ? 'bg-yellow-50 border-yellow-300 transform scale-105 z-10'
                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                            }
            `}
                    >
                        {user.daysUntil === 0 && (
                            <div className="absolute top-0 left-0 w-full bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1">
                                🎉 É HOJE! 🎉
                            </div>
                        )}

                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex-shrink-0">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.username}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                                        🐷
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {user.formattedDate}
                                </p>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                    {user.name || user.username}
                                </h3>
                                <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                                    Vai fazer {user.ageTurning} anos
                                </p>
                            </div>
                        </div>

                        {user.daysUntil > 0 && user.daysUntil <= 30 && (
                            <div className="mt-3 text-xs text-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 py-1 rounded">
                                Faltam {user.daysUntil} dias
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
