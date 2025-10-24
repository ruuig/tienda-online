// Página para solicitar acceso como vendedor
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

const RequestSellerAccess = () => {
  const { user } = useAppContext();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleRequestAccess = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    setIsSubmitting(true);
    try {
      // Aquí iría la lógica para solicitar acceso como vendedor
      // Por ahora simulamos el proceso
      await new Promise(resolve => setTimeout(resolve, 2000));

      setMessage('✅ Solicitud enviada correctamente. Un administrador revisará tu petición.');
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      setMessage('❌ Error enviando la solicitud. Inténtalo de nuevo.');
      setTimeout(() => setMessage(''), 3000);
    }
    setIsSubmitting(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Necesitas iniciar sesión para solicitar acceso como vendedor.
              </p>
              <button
                onClick={() => router.push('/sign-in')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center">
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Solicitar Acceso como Vendedor
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Obtén acceso completo al panel de administración
            </p>
          </div>

          {message && (
            <div className={`mt-4 p-4 rounded-md ${message.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${message.includes('✅') ? 'text-green-800' : 'text-red-800'}`}>
                {message}
              </p>
            </div>
          )}

          <div className="mt-8 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    ¿Qué obtienes con acceso de vendedor?
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Panel de administración completo</li>
                      <li>Gestión de productos y inventario</li>
                      <li>Control de pedidos y ventas</li>
                      <li>Configuración del chatbot IA</li>
                      <li>Análisis y estadísticas detalladas</li>
                      <li>Gestión de documentos para RAG</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Información importante:
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Tu solicitud será revisada por un administrador. Una vez aprobada, recibirás acceso completo al panel de administración.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                Usuario: <strong>{user.name}</strong>
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>

            <button
              onClick={handleRequestAccess}
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando solicitud...' : 'Solicitar Acceso como Vendedor'}
            </button>

            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                ← Volver a la tienda
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestSellerAccess;
