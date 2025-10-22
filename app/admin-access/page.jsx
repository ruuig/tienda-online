// Página de acceso directo al panel de administración con diseño de tienda
'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { assets } from '@/src/assets/assets';
import Image from 'next/image';

const AdminAccess = () => {
  const { user } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    // Si el usuario tiene permisos, redirigir automáticamente al panel
    if (user && (user.email === 'seller@tienda.com' || user.publicMetadata?.role === 'seller' || user.isAdmin)) {
      router.push('/admin');
    }
  }, [user, router]);

  const handleAccess = () => {
    if (user && (user.email === 'seller@tienda.com' || user.publicMetadata?.role === 'seller' || user.isAdmin)) {
      router.push('/admin');
    } else {
      // Si no tiene permisos, mostrar información
      alert('Necesitas permisos de administrador o vendedor para acceder a este panel.');
    }
  };

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      title: 'Gestión Completa de Productos',
      description: 'CRUD avanzado con filtros, búsquedas y gestión de imágenes'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
        </svg>
      ),
      title: 'Control de Pedidos y Ventas',
      description: 'Gestión completa del flujo de pedidos con estados y seguimiento'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: 'Configuración del Chatbot IA',
      description: 'Personalización avanzada del asistente conversacional'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Gestión de Documentos RAG',
      description: 'Sistema avanzado de documentos para respuestas inteligentes'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Configuración General',
      description: 'Ajustes completos de información de tienda y políticas'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Estadísticas y Análisis',
      description: 'Dashboard completo con métricas y reportes detallados'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar estilo tienda */}
      <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-200 bg-white">
        <Image
          className="cursor-pointer w-28 md:w-32"
          onClick={() => router.push('/')}
          src={assets.logo}
          alt="logo"
        />
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Volver a la tienda
          </button>
        </div>
      </nav>

      <div className="px-6 md:px-16 lg:px-32 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <svg className="w-20 h-20 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Panel de Administración</h1>
            <p className="text-xl text-gray-600 mb-8">Gestión completa de tu tienda online con herramientas avanzadas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-blue-600">{feature.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {user ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-lg text-gray-600 mb-2">
                  Conectado como: <strong className="text-gray-900">{user.name}</strong>
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>

              {user.email === 'seller@tienda.com' || user.publicMetadata?.role === 'seller' || user.isAdmin ? (
                <div className="text-center">
                  <button
                    onClick={handleAccess}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-sm hover:shadow-md"
                  >
                    🚀 Acceder al Panel de Administración
                  </button>
                  <p className="text-sm text-gray-500 mt-4">
                    Serás redirigido automáticamente al panel completo
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                    <div className="flex justify-center mb-4">
                      <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      Acceso Restringido
                    </h3>
                    <p className="text-yellow-700 mb-4">
                      No tienes permisos para acceder al panel de administración.
                    </p>
                    <p className="text-sm text-yellow-600">
                      Contacta al administrador para obtener acceso de vendedor o administrador.
                    </p>
                  </div>

                  <button
                    onClick={() => router.push('/request-seller-access')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Solicitar Acceso como Vendedor
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Inicia sesión para acceder
              </h3>
              <p className="text-gray-600 mb-6">
                Necesitas una cuenta con permisos de administrador o vendedor para acceder al panel.
              </p>
              <button
                onClick={() => window.location.href = '/sign-in'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Iniciar Sesión
              </button>
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              ¿Problemas para acceder? <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">Contáctanos</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAccess;
