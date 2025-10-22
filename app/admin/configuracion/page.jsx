// Página de configuración general de la tienda
'use client';
import React, { useState, useEffect } from 'react';

const StoreSettings = () => {
  const [settings, setSettings] = useState({
    storeName: 'Tienda Online Demo',
    storeDescription: 'Tu tienda de tecnología favorita con los mejores productos Apple y accesorios.',
    storePhone: '+502 1234-5678',
    storeEmail: 'info@tienda.com',
    storeAddress: 'Zona 10, Ciudad de Guatemala',
    storeHours: 'Lunes a Viernes: 8:00 AM - 6:00 PM\nSábados: 9:00 AM - 4:00 PM\nDomingos: Cerrado',
    shippingInfo: 'Envío gratuito en compras mayores a Q500\nTiempo de entrega: 2-3 días hábiles',
    returnPolicy: '30 días para devoluciones\nProductos deben estar sin usar y en empaque original',
    warrantyInfo: 'Garantía de fabricante incluida\nSoporte técnico disponible',
    facebook: 'https://facebook.com/tienda',
    instagram: 'https://instagram.com/tienda',
    whatsapp: '+502 1234-5678'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Aquí iría la llamada a la API para guardar configuración
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación
      setMessage('✅ Configuración guardada exitosamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error guardando configuración');
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  };

  const handleResetSettings = () => {
    setSettings({
      storeName: 'Tienda Online Demo',
      storeDescription: 'Tu tienda de tecnología favorita con los mejores productos Apple y accesorios.',
      storePhone: '+502 1234-5678',
      storeEmail: 'info@tienda.com',
      storeAddress: 'Zona 10, Ciudad de Guatemala',
      storeHours: 'Lunes a Viernes: 8:00 AM - 6:00 PM\nSábados: 9:00 AM - 4:00 PM\nDomingos: Cerrado',
      shippingInfo: 'Envío gratuito en compras mayores a Q500\nTiempo de entrega: 2-3 días hábiles',
      returnPolicy: '30 días para devoluciones\nProductos deben estar sin usar y en empaque original',
      warrantyInfo: 'Garantía de fabricante incluida\nSoporte técnico disponible',
      facebook: 'https://facebook.com/tienda',
      instagram: 'https://instagram.com/tienda',
      whatsapp: '+502 1234-5678'
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
            <h1 className="text-2xl font-bold text-gray-900">Configuración de Tienda</h1>
            <p className="text-gray-600 mt-1">Configura la información general de tu tienda</p>
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
        {/* Información básica */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la tienda
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de tu tienda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de la tienda
              </label>
              <textarea
                value={settings.storeDescription}
                onChange={(e) => setSettings({...settings, storeDescription: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Breve descripción de tu tienda..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={settings.storePhone}
                  onChange={(e) => setSettings({...settings, storePhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+502 1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.storeEmail}
                  onChange={(e) => setSettings({...settings, storeEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="info@tienda.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={settings.storeAddress}
                onChange={(e) => setSettings({...settings, storeAddress: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Dirección física de la tienda"
              />
            </div>
          </div>
        </div>

        {/* Políticas y horarios */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Políticas y Horarios</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horarios de atención
              </label>
              <textarea
                value={settings.storeHours}
                onChange={(e) => setSettings({...settings, storeHours: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Horarios de atención al cliente..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Información de envío
              </label>
              <textarea
                value={settings.shippingInfo}
                onChange={(e) => setSettings({...settings, shippingInfo: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Políticas de envío..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Política de devoluciones
              </label>
              <textarea
                value={settings.returnPolicy}
                onChange={(e) => setSettings({...settings, returnPolicy: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Política de devoluciones..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Información de garantía
              </label>
              <textarea
                value={settings.warrantyInfo}
                onChange={(e) => setSettings({...settings, warrantyInfo: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Información de garantías..."
              />
            </div>
          </div>
        </div>

        {/* Redes sociales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Redes Sociales</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook
              </label>
              <input
                type="url"
                value={settings.facebook}
                onChange={(e) => setSettings({...settings, facebook: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://facebook.com/tutienda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram
              </label>
              <input
                type="url"
                value={settings.instagram}
                onChange={(e) => setSettings({...settings, instagram: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://instagram.com/tutienda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                value={settings.whatsapp}
                onChange={(e) => setSettings({...settings, whatsapp: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+502 1234-5678"
              />
            </div>
          </div>
        </div>

        {/* Vista previa */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h2>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{settings.storeName}</h3>
              <p className="text-gray-600 mt-1">{settings.storeDescription}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Contacto:</p>
                <p className="text-gray-600">{settings.storePhone}</p>
                <p className="text-gray-600">{settings.storeEmail}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Ubicación:</p>
                <p className="text-gray-600">{settings.storeAddress}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="font-medium text-gray-700 mb-2">Horarios:</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{settings.storeHours}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Guardar Configuración</h2>
            <p className="text-sm text-gray-600">Los cambios se aplicarán inmediatamente</p>
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

export default StoreSettings;
