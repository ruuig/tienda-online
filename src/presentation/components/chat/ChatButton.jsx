// Botón flotante para abrir el chat de soporte con integración OpenAI
'use client';
import React, { useState } from 'react';
import ChatWindow from './ChatWindow';

const ChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenChat = () => {
    setIsLoading(true);
    setCurrentConversation('demo-chat');
    setIsChatOpen(true);
    setIsLoading(false);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={handleOpenChat}
        disabled={isLoading}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group ${
          isLoading
            ? 'bg-gray-500 cursor-not-allowed'
            : 'bg-[#343b65] hover:bg-[#2a2f52] cursor-pointer'
        }`}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}

        <span className="absolute -top-1 -right-1 bg-[#c92141] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          1
        </span>

        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {isLoading ? 'Cargando...' : 'Chat con IA'}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      </button>

      {isChatOpen && (
        <ChatWindow
          conversationId={currentConversation || 'demo-chat'}
          onClose={handleCloseChat}
        />
      )}
    </>
  );
};

export default ChatButton;
