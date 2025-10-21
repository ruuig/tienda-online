// Página dedicada para conversaciones de chat (versión simplificada)
'use client';
import React, { useState, useEffect } from 'react';
import Navbar from '@/src/presentation/components/Navbar';
import Footer from '@/src/presentation/components/Footer';
import { ChatWindow } from '@/src/presentation/components/chat';
import Loading from '@/src/presentation/components/Loading';

const ChatPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Datos de ejemplo para pruebas
  const [conversations] = useState([
    {
      id: 'demo-1',
      title: 'Consulta sobre productos',
      status: 'active',
      lastMessage: '¿Tienen el iPhone 15 en negro?',
      lastActivity: new Date().toISOString(),
      messageCount: 3
    },
    {
      id: 'demo-2',
      title: 'Problema con pedido',
      status: 'active',
      lastMessage: 'No he recibido mi pedido aún',
      lastActivity: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
      messageCount: 5
    }
  ]);

  const handleStartNewChat = () => {
    // Crear nueva conversación demo
    const newConversation = {
      id: `demo-${Date.now()}`,
      title: 'Nueva consulta',
      status: 'active',
      lastMessage: 'Hola, necesito ayuda',
      lastActivity: new Date().toISOString(),
      messageCount: 1
    };

    console.log('Nueva conversación creada:', newConversation.id);
    setSelectedConversation(newConversation.id);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 py-16 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Centro de Soporte</h1>
            <p className="text-gray-600">Gestiona tus conversaciones con nuestro equipo de soporte</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
            {/* Lista de conversaciones */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
                  <button
                    onClick={handleStartNewChat}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Nueva Consulta
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto h-[500px]">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm">No tienes conversaciones activas</p>
                    <button
                      onClick={handleStartNewChat}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Iniciar nueva consulta
                    </button>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => {
                        console.log('Seleccionando conversación:', conversation.id);
                        setSelectedConversation(conversation.id);
                      }}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          conversation.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {conversation.status === 'active' ? 'Activa' : 'Cerrada'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {conversation.messageCount} mensajes
                        </span>
                      </div>

                      <h3 className="font-medium text-gray-900 text-sm mb-1">{conversation.title}</h3>
                      <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(conversation.lastActivity).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Área de chat */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow">
              {selectedConversation ? (
                <ChatWindow
                  conversationId={selectedConversation}
                  onClose={() => setSelectedConversation(null)}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una conversación</h3>
                    <p className="text-gray-600">Elige una conversación de la lista para continuar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ChatPage;
