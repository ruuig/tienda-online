// Página de prueba para depurar la API de OpenAI
'use client';
import React, { useState } from 'react';

const APITestPage = () => {
  const [message, setMessage] = useState('Hola, ¿qué productos tienes disponibles?');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testAPI = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      console.log('=== PRUEBA DE API ===');
      console.log('Enviando mensaje:', message);

      const response = await fetch('/api/chat/process-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: 'test-conversation',
          message: message,
          userInfo: {
            id: 'test-user',
            name: 'Usuario de Prueba',
            email: 'test@example.com'
          }
        })
      });

      console.log('Estado de respuesta:', response.status, response.statusText);

      const data = await response.json();
      console.log('Datos recibidos:', data);

      if (response.ok && data.success) {
        setResponse(data.message.content);
      } else {
        setError(`Error ${response.status}: ${data.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error en prueba:', error);
      setError(`Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Prueba de API de OpenAI</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Enviar mensaje de prueba</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Mensaje:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border rounded-lg"
              rows={3}
            />
          </div>

          <button
            onClick={testAPI}
            disabled={loading}
            className={`px-6 py-3 rounded-lg ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Probando...' : 'Enviar a API'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong>
            <pre className="mt-2 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {response && (
          <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded">
            <strong>Respuesta de OpenAI:</strong>
            <p className="mt-2">{response}</p>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Instrucciones de depuración:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Abre las herramientas de desarrollador (F12)</li>
            <li>Ve a la pestaña "Console"</li>
            <li>Envía un mensaje de prueba arriba</li>
            <li>Revisa los logs detallados que aparecerán en la consola</li>
            <li>Los logs mostrarán exactamente dónde está fallando el proceso</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default APITestPage;
