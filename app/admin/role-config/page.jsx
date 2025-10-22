'use client'
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

const RoleConfig = () => {
  const { user, getToken } = useAppContext();
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState('user');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.publicMetadata?.role) {
      setCurrentRole(user.publicMetadata.role);
    }
  }, [user]);

  const updateRole = async (newRole) => {
    setLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.post('/api/admin/set-role', { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message);
        setCurrentRole(newRole);

        // Si el nuevo rol es admin o seller, redirigir al panel admin
        if (newRole === 'admin' || newRole === 'seller') {
          setTimeout(() => {
            router.push('/admin');
          }, 1000);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error al cambiar el rol');
      console.error('Error updating role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Simular logout y login con nuevo rol
    // En producción usarías Clerk para esto
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Configuración de Rol
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Configura tu rol para acceder al panel de administración
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario actual
              </label>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-900">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'Email'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol actual
              </label>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-900 capitalize">{currentRole}</p>
                <p className="text-xs text-gray-500">
                  {currentRole === 'admin' || currentRole === 'seller'
                    ? '✅ Tienes acceso al panel de administración'
                    : '❌ No tienes acceso al panel de administración'
                  }
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cambiar rol (Solo para desarrollo)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateRole('user')}
                  disabled={loading}
                  className={`px-3 py-2 text-sm rounded-md ${
                    currentRole === 'user'
                      ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Usuario
                </button>
                <button
                  onClick={() => updateRole('seller')}
                  disabled={loading}
                  className={`px-3 py-2 text-sm rounded-md ${
                    currentRole === 'seller'
                      ? 'bg-blue-500 text-white cursor-not-allowed'
                      : 'bg-blue-200 text-blue-700 hover:bg-blue-300'
                  }`}
                >
                  Vendedor
                </button>
                <button
                  onClick={() => updateRole('admin')}
                  disabled={loading}
                  className={`px-3 py-2 text-sm rounded-md ${
                    currentRole === 'admin'
                      ? 'bg-green-500 text-white cursor-not-allowed'
                      : 'bg-green-200 text-green-700 hover:bg-green-300'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Nota para producción
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Para cambiar el rol en producción:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Ve al dashboard de Clerk</li>
                      <li>Busca tu usuario</li>
                      <li>Edita los metadatos públicos</li>
                      <li>Establece <code className="bg-yellow-100 px-1 rounded">role</code> como "admin" o "seller"</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
              >
                Ir al Panel Admin
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleConfig;
