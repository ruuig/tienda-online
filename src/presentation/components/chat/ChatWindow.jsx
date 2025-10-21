import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import Message from './Message';
import ChatInput from './ChatInput';

const ChatWindow = ({ conversationId, onClose }) => {
  const { user, getToken } = useAppContext();
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected] = useState(true);
  const [token, setToken] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estado para controlar si el usuario está viendo el final (como WhatsApp)
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Preguntas frecuentes predefinidas
  const frequentQuestions = [
    "¿Qué productos tienen disponibles?",
    "¿Cuáles son sus métodos de pago?",
    "¿Tienen envío gratis?",
    "¿Cuál es la política de devoluciones?",
    "¿Cómo puedo rastrear mi pedido?"
  ];

  // Obtener token cuando el componente se monta
  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log('ChatWindow: Obteniendo token para usuario:', user?.id);
        if (user) {
          const userToken = await getToken();
          console.log('ChatWindow: Token obtenido:', !!userToken);
          setToken(userToken);
        } else {
          console.log('ChatWindow: Usuario no autenticado');
        }
      } catch (error) {
        console.error('ChatWindow: Error obteniendo token:', error);
      }
    };
    fetchToken();
  }, [user, getToken]);

  // Detectar cuando el usuario hace scroll hacia arriba
  const handleScroll = () => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px de tolerancia
      setIsAtBottom(isNearBottom);
    }
  };

  // Scroll automático solo si el usuario está viendo el final
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // Cargar mensajes iniciales
  useEffect(() => {
    console.log('ChatWindow: Cargando mensajes para conversación:', conversationId);
    if (conversationId) {
      // Mensajes de ejemplo iniciales
      const demoMessages = [
        {
          _id: 'msg-1',
          conversationId,
          content: '¡Hola! ¿En qué puedo ayudarte hoy?',
          sender: 'bot',
          type: 'text',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          _id: 'msg-2',
          conversationId,
          content: 'Tengo una pregunta sobre productos',
          sender: 'user',
          type: 'text',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          _id: 'msg-3',
          conversationId,
          content: 'Claro, estaré encantado de ayudarte con información sobre nuestros productos.',
          sender: 'bot',
          type: 'text',
          createdAt: new Date(Date.now() - 900000).toISOString(),
        }
      ];
      setMessages(demoMessages);
    }
  }, [conversationId]);

  // Función para enviar pregunta frecuente
  const handleQuickQuestion = (question) => {
    setInputValue(question);
    // Enviar automáticamente después de un breve delay
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  // Manejar envío de mensaje con OpenAI
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !conversationId) {
      return;
    }

    setIsProcessing(true);

    // Crear mensaje del usuario localmente primero (NO como temporal para evitar duplicación)
    const userMessage = {
      _id: `msg-${Date.now()}`,
      conversationId,
      content: inputValue.trim(),
      sender: 'user',
      type: 'text',
      createdAt: new Date().toISOString(),
    };

    // Agregar mensaje del usuario inmediatamente (no desaparecerá)
    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputValue.trim();
    setInputValue('');

    // Ajustar altura del textarea después de limpiar usando la referencia
    if (chatInputRef.current) {
      chatInputRef.current.adjustHeight();
    }

    try {
      // Si el usuario está autenticado, intentar usar OpenAI
      if (user) {
        console.log('Procesando con OpenAI...');

        const response = await fetch('/api/chat/process-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            conversationId,
            message: messageContent,
            userInfo: {
              id: user?.id,
              name: user?.name,
              email: user?.email
            }
          })
        });

        console.log('Estado de respuesta:', response.status, response.statusText);
        console.log('Headers de respuesta:', Object.fromEntries(response.headers.entries()));

        const data = await response.json();
        console.log('Respuesta de API:', data);

        if (response.ok && data.success) {
          // Agregar respuesta del bot directamente (sin reemplazar nada)
          if (data.message && data.message.sender === 'bot') {
            setMessages(prev => [...prev, data.message]);
          }
        } else {
          console.error('Error en API:', data);
          // Mostrar error pero mantener el mensaje del usuario
          const errorMessage = {
            _id: `error-${Date.now()}`,
            conversationId,
            content: `Error: ${data.message || 'Problema con IA'}`,
            sender: 'bot',
            type: 'text',
            createdAt: new Date().toISOString(),
            isError: true
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        // Usuario no autenticado - usar respuestas simuladas
        console.log('Usuario no autenticado, usando respuestas simuladas');

        // Simular respuesta del bot después de 1 segundo
        setTimeout(() => {
          const botResponse = {
            _id: `msg-${Date.now() + 1}`,
            conversationId,
            content: 'Gracias por tu mensaje. Un agente te responderá pronto.',
            sender: 'bot',
            type: 'text',
            createdAt: new Date().toISOString(),
          };
          setMessages(prev => [...prev, botResponse]);
        }, 1000);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      const errorMessage = {
        _id: `error-${Date.now()}`,
        conversationId,
        content: `Error de conexión: ${error.message}`,
        sender: 'bot',
        type: 'text',
        createdAt: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar cambios en el input
  const handleInputChange = (value) => {
    setInputValue(value);
  };

  // Manejar envío con Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-[#343b65] hover:bg-[#2a2f52] text-white p-3 rounded-full shadow-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#343b65] text-white rounded-t-lg shadow-sm">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#69c2d0]' : 'bg-[#c92141]'}`} />
          <div>
            <h3 className="font-semibold text-lg">Chat con IA</h3>
            <p className="text-xs text-gray-200">Soporte inteligente 24/7</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 text-white hover:bg-[#2a2f52] rounded-lg transition-colors"
            title="Minimizar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-[#c92141] rounded-lg transition-colors"
            title="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Área de mensajes */}
      <div
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-600 mt-8">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-[#69c2d0] rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">¡Bienvenido al Chat de Soporte!</h2>
              <p className="text-sm text-gray-600 mb-6">¿En qué puedo ayudarte hoy?</p>
            </div>

            {/* Preguntas frecuentes principales - Solo visibles cuando no hay mensajes */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Preguntas Frecuentes</h3>
              <p className="text-sm text-gray-600 mb-4 text-center">Haz clic en cualquier pregunta para enviarla automáticamente:</p>

              <div className="space-y-2">
                {frequentQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-[#69c2d0] hover:text-white rounded-lg border border-gray-200 hover:border-[#69c2d0] transition-all duration-200 group"
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-[#343b65] rounded-full mr-3 group-hover:bg-white transition-colors"></div>
                      <span className="flex-1">{question}</span>
                      <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preguntas frecuentes adicionales (más pequeñas) - Solo visibles cuando no hay mensajes */}
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Otras preguntas rápidas:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {frequentQuestions.slice(0, 3).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="px-2 py-1 text-xs bg-white hover:bg-[#c92141] hover:text-white rounded-full border border-gray-200 hover:border-[#c92141] transition-all duration-200"
                  >
                    {question.length > 15 ? question.substring(0, 15) + '...' : question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message._id}
              message={message}
              isOwn={message.sender === 'user'}
              onMarkAsRead={() => console.log('Marcar como leído:', message._id)}
            />
          ))
        )}

        {/* Indicador de procesamiento */}
        {isProcessing && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-[#69c2d0] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#69c2d0] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-[#69c2d0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm">Procesando con IA...</span>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* Preguntas frecuentes sugeridas después del primer intercambio */}
        {messages.length > 2 && messages.length < 6 && (
          <div className="bg-gray-50 rounded-lg p-3 mt-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-2 text-center">¿Necesitas ayuda con algo más?</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {frequentQuestions.slice(0, 2).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="px-2 py-1 text-xs bg-white hover:bg-[#69c2d0] hover:text-white rounded-md border border-gray-200 hover:border-[#69c2d0] transition-all duration-200"
                >
                  {question.length > 12 ? question.substring(0, 12) + '...' : question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input de mensaje */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <ChatInput
              ref={chatInputRef}
              value={inputValue}
              onChange={handleInputChange}
              onSend={handleSendMessage}
              onKeyDown={handleKeyDown}
              disabled={!isConnected || !user || isProcessing}
              placeholder={
                !user
                  ? "Obteniendo autenticación..."
                  : isProcessing
                    ? "Procesando..."
                    : isConnected
                      ? "Escribe tu mensaje..."
                      : "Conectando..."
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
