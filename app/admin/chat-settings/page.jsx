'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

const ChatSettingsPage = () => {
  const { user } = useAppContext();
  const [settings, setSettings] = useState({
    maxResponseLength: 500,
    enableProductCards: true,
    enablePurchaseFlow: true,
    enableRAG: true,
    welcomeMessage: '¡Hola! ¿En qué puedo ayudarte hoy?',
    rejectionMessage: 'Lo siento, solo puedo ayudarte con preguntas relacionadas con nuestros productos y servicios de tecnología. 🛒✨\n\n¿En qué puedo ayudarte con tu compra o consulta sobre productos?',
    storeHours: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
    contactInfo: 'Tel: (502) 1234-5678 | Email: info@tienda.com',
    restrictedTopics: [
      'política', 'religión', 'deportes', 'entretenimiento',
      'ciencia general', 'historia', 'geografía', 'matemáticas'
    ],
    allowedTopics: [
      'productos', 'precios', 'compras', 'carrito', 'envío',
      'devoluciones', 'garantía', 'soporte técnico', 'tecnología'
    ]
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Verificar permisos de seller
  if (!user || user.email !== 'seller@tienda.com') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Acceso Denegado</h2>
          <p className="text-gray-600 mt-2">Solo el usuario seller puede acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/chat-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage('✅ Configuración guardada exitosamente');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error al guardar la configuración');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('❌ Error al guardar la configuración');
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  };

  const handleResetSettings = () => {
    setSettings({
      maxResponseLength: 500,
      enableProductCards: true,
      enablePurchaseFlow: true,
      enableRAG: true,
      welcomeMessage: '¡Hola! ¿En qué puedo ayudarte hoy?',
      rejectionMessage: 'Lo siento, solo puedo ayudarte con preguntas relacionadas con nuestros productos y servicios de tecnología. 🛒✨\n\n¿En qué puedo ayudarte con tu compra o consulta sobre productos?',
      storeHours: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
      contactInfo: 'Tel: (502) 1234-5678 | Email: info@tienda.com',
      restrictedTopics: [
        'política', 'religión', 'deportes', 'entretenimiento',
        'ciencia general', 'historia', 'geografía', 'matemáticas'
      ],
      allowedTopics: [
        'productos', 'precios', 'compras', 'carrito', 'envío',
        'devoluciones', 'garantía', 'soporte técnico', 'tecnología'
      ]
    });
    setMessage('🔄 Configuración restablecida');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración del Chat</h1>
            <p className="text-gray-600 mt-1">Configura el comportamiento y respuestas del asistente de chat</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Usuario: {user.name}
            </span>
          </div>
        </div>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">{message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración General */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración General</h2>

          <div className="space-y-4">
            {/* Longitud máxima de respuesta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitud máxima de respuesta
              </label>
              <input
                type="number"
                value={settings.maxResponseLength}
                onChange={(e) => setSettings({...settings, maxResponseLength: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="100"
                max="2000"
              />
              <p className="text-xs text-gray-500 mt-1">Caracteres máximo por respuesta</p>
            </div>

            {/* Mensaje de rechazo para consultas no relacionadas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje de rechazo
              </label>
              <textarea
                value={settings.rejectionMessage}
                onChange={(e) => setSettings({...settings, rejectionMessage: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength="300"
                placeholder="Mensaje que se muestra cuando el usuario pregunta sobre temas no relacionados con la tienda"
              />
              <p className="text-xs text-gray-500 mt-1">Mensaje personalizado para rechazar consultas fuera del alcance de la tienda</p>
            </div>

            {/* Horarios de atención */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horarios de atención
              </label>
              <input
                type="text"
                value={settings.storeHours}
                onChange={(e) => setSettings({...settings, storeHours: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength="100"
              />
            </div>

            {/* Información de contacto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Información de contacto
              </label>
              <input
                type="text"
                value={settings.contactInfo}
                onChange={(e) => setSettings({...settings, contactInfo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength="100"
              />
            </div>
          </div>
        </div>

        {/* Configuración de Funcionalidades */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Funcionalidades</h2>

          <div className="space-y-4">
            {/* Cards de productos */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Cards de productos</h3>
                <p className="text-xs text-gray-500">Mostrar cards visuales de productos</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableProductCards}
                  onChange={(e) => setSettings({...settings, enableProductCards: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Flujo de compra */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Flujo de compra conversacional</h3>
                <p className="text-xs text-gray-500">Permitir compras a través del chat</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enablePurchaseFlow}
                  onChange={(e) => setSettings({...settings, enablePurchaseFlow: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* RAG */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Respuestas basadas en documentos</h3>
                <p className="text-xs text-gray-500">Usar documentos PDF para respuestas</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableRAG}
                  onChange={(e) => setSettings({...settings, enableRAG: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Temas Restringidos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Temas Restringidos</h2>
          <p className="text-sm text-gray-600 mb-4">El chat no responderá preguntas sobre estos temas</p>

          <div className="grid grid-cols-2 gap-2">
            {settings.restrictedTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between bg-red-50 p-2 rounded border">
                <span className="text-sm text-red-800">{topic}</span>
                <button
                  onClick={() => {
                    const newTopics = settings.restrictedTopics.filter((_, i) => i !== index);
                    setSettings({...settings, restrictedTopics: newTopics});
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Agregar tema restringido..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  setSettings({
                    ...settings,
                    restrictedTopics: [...settings.restrictedTopics, e.target.value.trim()]
                  });
                  e.target.value = '';
                }
              }}
            />
          </div>
        </div>

        {/* Temas Permitidos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Temas Permitidos</h2>
          <p className="text-sm text-gray-600 mb-4">El chat se enfocará en estos temas</p>

          <div className="grid grid-cols-2 gap-2">
            {settings.allowedTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded border">
                <span className="text-sm text-green-800">{topic}</span>
                <button
                  onClick={() => {
                    const newTopics = settings.allowedTopics.filter((_, i) => i !== index);
                    setSettings({...settings, allowedTopics: newTopics});
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Agregar tema permitido..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  setSettings({
                    ...settings,
                    allowedTopics: [...settings.allowedTopics, e.target.value.trim()]
                  });
                  e.target.value = '';
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Guardar Configuración</h2>
            <p className="text-sm text-gray-600">Los cambios se aplicarán inmediatamente al chat</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleResetSettings}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Restablecer
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSettingsPage;
