// Página de gestión de conversaciones
'use client';
import React, { useState, useEffect } from 'react';

const ConversationsManagement = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      // Aquí iría la llamada a la API de conversaciones
      // Por ahora simulamos datos
      setConversations([
        {
          id: '1',
          userId: 'user1',
          userName: 'Juan Pérez',
          title: 'Consulta sobre iPhone 15',
          status: 'active',
          priority: 'medium',
          lastMessage: '¿Está disponible en negro?',
          lastActivity: '2024-01-21T10:30:00Z',
          messageCount: 5,
          assignedTo: null
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'María González',
          title: 'Problema con pedido',
          status: 'escalated',
          priority: 'high',
          lastMessage: 'No he recibido mi pedido',
          lastActivity: '2024-01-21T09:15:00Z',
          messageCount: 8,
          assignedTo: 'admin1'
        }
      ]);
    } catch (error) {
      console.error('Error obteniendo conversaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'all') return true;
    return conv.status === filter;
  });

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);

    // Obtener mensajes de la conversación
    try {
      // Aquí iría la llamada a la API de mensajes
      setMessages([
        {
          id: '1',
          sender: 'user',
          content: 'Hola, quiero información sobre el iPhone 15',
          timestamp: '2024-01-21T10:00:00Z'
        },
        {
          id: '2',
          sender: 'bot',
          content: '¡Hola! Claro, el iPhone 15 está disponible. ¿Qué información necesitas específicamente?',
          timestamp: '2024-01-21T10:01:00Z'
        },
        {
          id: '3',
          sender: 'user',
          content: '¿Está disponible en negro?',
          timestamp: '2024-01-21T10:30:00Z'
        }
      ]);
    } catch (error) {
      console.error('Error obteniendo mensajes:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Lista de conversaciones */}
      <div className="w-1/3 border-r bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
          <div className="mt-2 flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Activas
            </button>
            <button
              onClick={() => setFilter('escalated')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'escalated'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Escaladas
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationSelect(conversation)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  conversation.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : conversation.status === 'escalated'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {conversation.status === 'active' ? 'Activa' :
                   conversation.status === 'escalated' ? 'Escalada' : 'Cerrada'}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  conversation.priority === 'high'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {conversation.priority}
                </span>
              </div>

              <h3 className="font-medium text-gray-900 text-sm">{conversation.userName}</h3>
              <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>{new Date(conversation.lastActivity).toLocaleTimeString()}</span>
                <span>{conversation.messageCount} mensajes</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel de conversación */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header de conversación */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedConversation.userName}</h3>
                  <p className="text-sm text-gray-600">{selectedConversation.title}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                    Asignar
                  </button>
                  <button className="px-3 py-1 text-sm bg-red-600 text-white rounded">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.sender === 'bot'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input para respuesta */}
            <div className="p-4 border-t bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Escribe tu respuesta..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Enviar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>Selecciona una conversación para ver los mensajes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsManagement;
