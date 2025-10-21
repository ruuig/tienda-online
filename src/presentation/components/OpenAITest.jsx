// Componente de prueba para OpenAI
'use client';
import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';

const OpenAITest = () => {
  const { user, getToken } = useAppContext();
  const [testMessage, setTestMessage] = useState('Hola, ¿qué productos de tecnología tienes disponibles?');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const testOpenAI = async () => {
    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const token = await getToken();
      console.log('Token obtenido:', !!token);

      if (!token) {
        setError('No se pudo obtener token de autenticación');
        return;
      }

      const testResponse = await fetch('/api/chat/process-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: 'test-conversation',
          message: testMessage,
          userInfo: {
            id: user?.id,
            name: user?.name,
            email: user?.email
          }
        })
      });

      const data = await testResponse.json();
      console.log('Respuesta completa de API:', data);

      if (testResponse.ok && data.success) {
        setResponse(data.message.content);
      } else {
        setError(`Error: ${data.message || 'Problema desconocido'}`);
      }
    } catch (error) {
      console.error('Error en prueba:', error);
      setError(`Error de conexión: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Prueba de OpenAI</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Mensaje de prueba:
        </label>
        <textarea
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          className="w-full p-3 border rounded-lg"
          rows={3}
        />
      </div>

      <button
        onClick={testOpenAI}
        disabled={isLoading}
        className={`px-6 py-3 rounded-lg ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isLoading ? 'Procesando...' : 'Probar OpenAI'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {response && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-800 rounded">
          <strong>Respuesta de OpenAI:</strong>
          <p className="mt-2">{response}</p>
        </div>
      )}
    </div>
  );
};

export default OpenAITest;
