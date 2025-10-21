// Hook personalizado para manejar conexión del chat (versión simplificada con polling)
import { useState, useEffect, useRef, useCallback } from 'react';

export const useChatWebSocket = (userId, token) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [error, setError] = useState(null);

  const pollingIntervalRef = useRef(null);
  const currentConversationRef = useRef(null);

  // Función para hacer polling de mensajes
  const pollMessages = useCallback(async () => {
    if (!currentConversation || !token) return;

    try {
      const response = await fetch(`/api/chat/message?conversationId=${currentConversation}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
          setError(null);
        }
      }
    } catch (error) {
      console.error('Error polling messages:', error);
      setError('Error obteniendo mensajes');
    }
  }, [currentConversation, token]);

  // Función para enviar mensaje
  const sendMessage = useCallback(async (conversationId, content, type = 'text') => {
    console.log('sendMessage llamado con:', { conversationId, content: content.substring(0, 50) + '...', type, hasToken: !!token });

    if (!token) {
      console.log('Token no disponible');
      setError('No autenticado');
      return false;
    }

    try {
      console.log('Haciendo petición a /api/chat/message');
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId,
          content,
          type
        })
      });

      console.log('Respuesta recibida:', response.status, response.statusText);
      const data = await response.json();
      console.log('Datos de respuesta:', data);

      if (response.ok && data.success) {
        console.log('Mensaje enviado exitosamente');
        // Recargar mensajes después de enviar
        pollMessages();
        return true;
      } else {
        console.log('Error en respuesta:', data.message);
        setError(data.message || 'Error enviando mensaje');
        return false;
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      setError('Error enviando mensaje');
      return false;
    }
  }, [token, pollMessages]);

  // Función para unirse a conversación
  const joinConversation = useCallback(async (conversationId) => {
    if (!token) {
      setError('No autenticado');
      return false;
    }

    try {
      const response = await fetch(`/api/chat/message?conversationId=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentConversation(conversationId);
          currentConversationRef.current = conversationId;
          setMessages(data.messages || []);
          setError(null);

          // Iniciar polling cada 3 segundos
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }

          pollingIntervalRef.current = setInterval(pollMessages, 3000);
          return true;
        }
      }

      setError('Error al unir a conversación');
      return false;
    } catch (error) {
      console.error('Error joining conversation:', error);
      setError('Error al unir a conversación');
      return false;
    }
  }, [token, pollMessages]);

  // Función para indicar que está escribiendo (simulada)
  const sendTypingIndicator = useCallback((conversationId, isTyping) => {
    // En una implementación real, esto enviaría el indicador al servidor
    console.log('Typing indicator:', { conversationId, isTyping });
  }, []);

  // Función para marcar mensaje como leído
  const markMessageAsRead = useCallback(async (messageId) => {
    if (!token) return;

    try {
      await fetch(`/api/chat/message/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [token]);

  // Función para desconectar
  const disconnect = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsConnected(false);
    setCurrentConversation(null);
    currentConversationRef.current = null;
    setMessages([]);
  }, []);

  // Conectar automáticamente al montar
  useEffect(() => {
    if (userId && token) {
      setIsConnected(true);
      setError(null);
    } else {
      setIsConnected(false);
    }

    // Limpiar al desmontar
    return () => {
      disconnect();
    };
  }, [userId, token, disconnect]);

  return {
    isConnected,
    messages,
    conversations,
    currentConversation,
    typingUsers: Array.from(typingUsers),
    error,
    sendMessage,
    joinConversation,
    sendTypingIndicator,
    markMessageAsRead,
    disconnect,
    reconnect: () => setIsConnected(true)
  };
};
