'use client';

import React from 'react';

interface UserLinkProps {
  username: string;
  name?: string;
  userId?: string;
  className?: string;
  onClick?: () => void;
}

export const UserLink: React.FC<UserLinkProps> = ({ 
  username, 
  name, 
  userId,
  className = '',
  onClick
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick();
      return;
    }

    // Disparar evento para abrir perfil
    window.dispatchEvent(new CustomEvent('profile:open', { 
      detail: { username, userId } 
    }));
  };

  const displayName = name || username;

  return (
    <button
      onClick={handleClick}
      className={`text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold hover:underline transition-colors ${className}`}
      title={`Ver perfil de ${displayName}`}
    >
      {displayName}
    </button>
  );
};

