// Componente individual de mensaje
import React from 'react';
import Image from 'next/image';
import { assets } from '@/src/assets/assets';

const Message = ({ message, isOwn, onMarkAsRead }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSenderIcon = (sender) => {
    switch (sender) {
      case 'user':
        return (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            U
          </div>
        );
      case 'bot':
        return (
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'admin':
        return (
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-xs ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Avatar del remitente */}
        {!isOwn && (
          <div className="flex-shrink-0">
            {getSenderIcon(message.sender)}
          </div>
        )}

        {/* Burbuja del mensaje */}
        <div
          className={`relative px-4 py-2 rounded-lg max-w-full ${
            isOwn
              ? 'bg-[#343b65] text-white'
              : message.sender === 'bot'
              ? 'bg-[#69c2d0] text-white'
              : message.sender === 'admin'
              ? 'bg-[#c92141] text-white'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {/* Contenido del mensaje */}
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Metadata del mensaje */}
          <div className={`flex items-center justify-between mt-2 text-xs ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span>{formatTime(message.createdAt)}</span>

            {/* Indicadores adicionales */}
            <div className="flex items-center space-x-1">
              {/* Estado de lectura (solo para mensajes propios) */}
              {isOwn && (
                <div className="flex items-center">
                  {message.readBy && message.readBy.length > 0 ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}

              {/* Tipo de mensaje */}
              {message.type !== 'text' && (
                <span className="capitalize bg-black bg-opacity-10 px-1 rounded">
                  {message.type}
                </span>
              )}
            </div>
          </div>

          {/* Fuentes para respuestas RAG */}
          {message.metadata?.sources && message.metadata.sources.length > 0 && (
            <div className={`mt-2 text-xs ${isOwn ? 'text-blue-200' : 'text-gray-600'}`}>
              <span className="font-medium">Fuentes: </span>
              {message.metadata.sources.slice(0, 2).map((source, index) => (
                <span key={index} className="mr-1">
                  {source}
                  {index < message.metadata.sources.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Botón para marcar como leído (solo mensajes de otros) */}
        {/* REMOVIDO: Botón marcar como leído eliminado según solicitud */}
      </div>
    </div>
  );
};

export default Message;
