// Componente individual de mensaje
import React from 'react';
import Image from 'next/image';
import ChatProductCard from './ChatProductCard';

const Message = ({ message, isOwn, onMarkAsRead, onPurchaseOption, onAddToCart }) => {
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

          {/* Cards de productos si están disponibles */}
          {message.metadata?.products && message.metadata.products.length > 0 && !isOwn && (
            <div className="mt-3 space-y-3">
              <div className="text-xs text-gray-600 mb-2">
                📦 **Productos encontrados:**
              </div>
              <div className="space-y-2">
                {message.metadata.products.slice(0, 3).map((product, index) => (
                  <ChatProductCard
                    key={product._id || index}
                    product={product}
                    onAddToCart={onAddToCart || ((product) => onPurchaseOption && onPurchaseOption(`Agregar ${product.name} al carrito`))}
                  />
                ))}
              </div>
              {message.metadata.products.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  Y {message.metadata.products.length - 3} productos más...
                </div>
              )}
            </div>
          )}

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
                <span key={`source-${index}-${source.substring(0, 10)}`} className="mr-1">
                  {source}
                  {index < message.metadata.sources.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}

          {/* Opciones interactivas para flujo de compra */}
          {message.type === 'purchase_flow' && message.metadata?.nextSteps && !isOwn && (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-gray-600 mb-2">
                **Opciones disponibles:**
              </div>
              <div className="flex flex-wrap gap-1">
                {message.metadata.nextSteps.map((option, index) => (
                  <button
                    key={`option-${index}-${option.substring(0, 10)}`}
                    onClick={() => onPurchaseOption && onPurchaseOption(option)}
                    className="px-3 py-1 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full border border-white border-opacity-30 hover:border-opacity-50 transition-all duration-200 text-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Botones específicos para opciones Sí/No */}
          {message.type === 'purchase_flow' && message.metadata?.nextSteps &&
           message.metadata.nextSteps.some(option =>
             option.toLowerCase().includes('sí') ||
             option.toLowerCase().includes('no') ||
             option.toLowerCase().includes('agregar') ||
             option.toLowerCase().includes('cancelar') ||
             option.toLowerCase().includes('confirmar') ||
             option.toLowerCase().includes('proceder')
           ) && !isOwn && (
            <div className="mt-3">
              <div className="text-xs text-gray-600 mb-2">
                **¿Qué te gustaría hacer?**
              </div>
              <div className="flex gap-2">
                {message.metadata.nextSteps.map((option, index) => {
                  const isYes = option.toLowerCase().includes('sí') ||
                               option.toLowerCase().includes('agregar') ||
                               option.toLowerCase().includes('confirmar') ||
                               option.toLowerCase().includes('proceder');
                  const isNo = option.toLowerCase().includes('no') ||
                              option.toLowerCase().includes('cancelar');

                  return (
                    <button
                      key={`button-${index}-${option.substring(0, 8)}`}
                      onClick={() => onPurchaseOption && onPurchaseOption(option)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
                        isYes
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                          : isNo
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isYes ? '✅ ' : isNo ? '❌ ' : '🔘 '}
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Estado del carrito para mensajes de compra */}
          {message.metadata?.cartState && !isOwn && (
            <div className="mt-2 text-xs bg-white bg-opacity-10 rounded p-2">
              <div className="text-gray-200 font-medium">🛒 Estado del carrito:</div>
              <div className="text-gray-300">
                • {message.metadata.cartState.totalItems || 0} productos
                {message.metadata.cartState.totalAmount && (
                  <span className="ml-2">• Q{message.metadata.cartState.totalAmount}</span>
                )}
              </div>
            </div>
          )}

          {/* Botón de redirección para compras completadas */}
          {message.metadata?.purchaseAction === 'purchase_completed' && message.metadata?.redirectTo && !isOwn && (
            <div className="mt-3">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = message.metadata.redirectTo;
                  }
                }}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium text-sm"
              >
                🛒 Ir al Carrito para Completar el Pago
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
