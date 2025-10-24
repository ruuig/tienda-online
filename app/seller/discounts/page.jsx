'use client'
import React, { useEffect, useState, useMemo } from "react";
import { assets } from "@/src/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/src/presentation/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const DiscountManagement = () => {
  const { getToken, user } = useAppContext();

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    percentage: '',
    description: '',
    startDate: '',
    endDate: '',
    maxUses: '',
    minPurchase: '',
    applicableProducts: ''
  });

  // Obtener descuentos del usuario con reintento automático
  const fetchDiscounts = async (retryCount = 0) => {
    console.log('🔄 fetchDiscounts: Iniciando carga de descuentos...', { retryCount });
    try {
      console.log('🔑 fetchDiscounts: Obteniendo token...');
      const token = await getToken();
      console.log('✅ fetchDiscounts: Token obtenido:', !!token);

      const timestamp = new Date().getTime();
      console.log('📡 fetchDiscounts: Llamando API...', { userId: user?.id, timestamp });

      const { data } = await axios.get(`/api/discount/list?t=${timestamp}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log('📦 fetchDiscounts: Respuesta recibida:', data);

      if (data.success) {
        console.log('✅ fetchDiscounts: Descuentos cargados:', data.discounts?.length || 0);
        setDiscounts(data.discounts || []);
        setLoading(false); // Asegurar que se desactive el loading en caso de éxito
        setError(''); // Limpiar cualquier error anterior
      } else {
        console.error('❌ fetchDiscounts: Error en respuesta:', data.message);
        // Solo mostrar error si es realmente crítico y no relacionado con conexión
        if (data.message && !data.message.includes('Error al cargar') && !data.message.includes('servidor') && !data.message.includes('descuentos') && !data.message.includes('Error interno')) {
          setError(data.message);
          setLoading(false);
        } else {
          // Para errores menores, continuar cargando sin mostrar error
          setDiscounts([]);
          setError('');
          setLoading(true);
        }
      }
    } catch (error) {
      console.error('❌ fetchDiscounts: Error en catch:', error);
      // No mostrar errores de red, solo continuar esperando pacientemente
      setDiscounts([]);
      setError('');
      setLoading(true);

      // Reintentar automáticamente después de 5 segundos si hay error de red
      if (retryCount < 3) {
        console.log(`🔄 fetchDiscounts: Reintentando en 5 segundos... (intento ${retryCount + 1}/3)`);
        setTimeout(() => fetchDiscounts(retryCount + 1), 5000);
      }
    }
  };

  // Crear nuevo descuento
  const handleAddDiscount = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const { data } = await axios.post('/api/discount/add', {
        ...formData,
        userId: user?.id,
        applicableProducts: formData.applicableProducts ? formData.applicableProducts.split(',').map(p => p.trim()) : []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message);
        setShowAddModal(false);
        setFormData({
          code: '',
          percentage: '',
          description: '',
          startDate: '',
          endDate: '',
          maxUses: '',
          minPurchase: '',
          applicableProducts: ''
        });
        fetchDiscounts();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error al crear el descuento');
      console.error('Error creating discount:', error);
    }
  };

  // Actualizar descuento
  const handleUpdateDiscount = async (e) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const { data } = await axios.put('/api/discount/update', {
        id: editingDiscount._id,
        ...formData,
        applicableProducts: formData.applicableProducts ? formData.applicableProducts.split(',').map(p => p.trim()) : []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message);
        setShowEditModal(false);
        setEditingDiscount(null);
        setFormData({
          code: '',
          percentage: '',
          description: '',
          startDate: '',
          endDate: '',
          maxUses: '',
          minPurchase: '',
          applicableProducts: ''
        });
        fetchDiscounts();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error al actualizar el descuento');
      console.error('Error updating discount:', error);
    }
  };

  // Eliminar descuento
  const handleDeleteDiscount = async (discountId) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium text-gray-800">¿Eliminar código de descuento?</p>
        <p className="text-sm text-gray-600">Esta acción eliminará permanentemente este código de descuento.</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const token = await getToken();
                const { data } = await axios.delete(`/api/discount/delete?id=${discountId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                if (data.success) {
                  toast.success(data.message);
                  fetchDiscounts();
                } else {
                  toast.error(data.message);
                }
              } catch (error) {
                toast.error('Error al eliminar el descuento');
                console.error('Error deleting discount:', error);
              }
            }}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
    });
  };

  // Toggle estado activo/inactivo
  const handleToggleDiscount = async (discountId, currentStatus) => {
    try {
      const token = await getToken();
      const { data } = await axios.put('/api/discount/toggle', {
        id: discountId,
        isActive: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message);
        fetchDiscounts();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error al cambiar el estado del descuento');
      console.error('Error toggling discount:', error);
    }
  };

  // Filtrar descuentos
  const filteredDiscounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return discounts.filter(discount => {
      const matchesSearch =
        !query ||
        discount.code.toLowerCase().includes(query) ||
        (discount.description || '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && discount.isActive) ||
        (statusFilter === 'inactive' && !discount.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [discounts, search, statusFilter]);

  // Abrir modal de edición
  const openEditModal = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code || '',
      percentage: discount.percentage || '',
      description: discount.description || '',
      startDate: discount.startDate ? new Date(discount.startDate).toISOString().split('T')[0] : '',
      endDate: discount.endDate ? new Date(discount.endDate).toISOString().split('T')[0] : '',
      maxUses: discount.maxUses || '',
      minPurchase: discount.minPurchase || '',
      applicableProducts: discount.applicableProducts ? discount.applicableProducts.join(', ') : ''
    });
    setShowEditModal(true);
  };

  // Limpiar estado inicial
  useEffect(() => {
    setError('');
    setLoading(true); // Iniciar en loading para evitar mostrar errores iniciales
  }, []); // Solo se ejecuta al montar el componente

  // Cargar descuentos cuando cambie el usuario
  useEffect(() => {
    console.log('🎯 useEffect: Iniciando...', { user: !!user, getToken: !!getToken, loading });
    if (user && getToken) {
      console.log('✅ useEffect: Condiciones cumplidas, activando loading');
      setLoading(true);
      setError(''); // Limpiar errores anteriores
      fetchDiscounts();
    } else {
      console.log('⏸️ useEffect: Condiciones no cumplidas', { user: !!user, getToken: !!getToken });
    }
  }, [user, getToken]);

  // Sincronizar formData con editingDiscount cuando cambie
  useEffect(() => {
    if (editingDiscount) {
      setFormData({
        code: editingDiscount.code || '',
        percentage: editingDiscount.percentage || '',
        description: editingDiscount.description || '',
        startDate: editingDiscount.startDate ? new Date(editingDiscount.startDate).toISOString().split('T')[0] : '',
        endDate: editingDiscount.endDate ? new Date(editingDiscount.endDate).toISOString().split('T')[0] : '',
        maxUses: editingDiscount.maxUses || '',
        minPurchase: editingDiscount.minPurchase || '',
        applicableProducts: editingDiscount.applicableProducts ? editingDiscount.applicableProducts.join(', ') : ''
      });
    }
  }, [editingDiscount]);

  if (loading) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="flex-1 min-h-screen flex flex-col justify-between">
        <div className="w-full p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Descuentos</h1>
            <p className="text-gray-600">Crea y administra códigos de descuento para tus productos</p>
          </div>

          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-medium">Error al cargar descuentos</h3>
                <p className="text-sm mt-1">{error}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setError('');
                      setLoading(true);
                      fetchDiscounts();
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                  >
                    Recargar página
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <div className="w-full p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Descuentos</h1>
          <p className="text-gray-600">Crea y administra códigos de descuento para tus productos</p>
        </div>

        {/* Botón Agregar */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Agregar Código de Descuento
          </button>
        </div>

        {/* Contador de resultados */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Mostrando {filteredDiscounts.length} de {discounts.length} códigos de descuento
          </p>
        </div>

        {/* Buscador + Filtro */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código o descripción..."
              className="w-full md:flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo activos</option>
              <option value="inactive">Solo inactivos</option>
            </select>
          </div>
        </div>

        {/* Tabla de Descuentos */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDiscounts.length > 0 ? (
                filteredDiscounts.map((discount) => (
                  <tr key={discount._id} className="hover:bg-gray-50">
                    {/* Código */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-secondary-700">
                              {discount.code.substring(0, 2)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{discount.code}</div>
                          <div className="text-sm text-gray-500">ID: {discount._id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>

                    {/* Porcentaje */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {discount.percentage}% OFF
                      </span>
                    </td>

                    {/* Descripción */}
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {discount.description || 'Sin descripción'}
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          discount.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {discount.isActive ? 'Activo' : 'Inactivo'}
                        </span>

                        <button
                          onClick={() => handleToggleDiscount(discount._id, discount.isActive)}
                          className={`p-1 rounded-full transition-colors ${
                            discount.isActive
                              ? 'text-green-600 hover:text-green-800 hover:bg-green-100'
                              : 'text-red-600 hover:text-red-800 hover:bg-red-100'
                          }`}
                          title={discount.isActive ? 'Desactivar descuento' : 'Activar descuento'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={
                              discount.isActive
                                ? "M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                : "M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            } />
                          </svg>
                        </button>
                      </div>
                    </td>

                    {/* Usos */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {discount.usedCount || 0} / {discount.maxUses || '∞'}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(discount)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteDiscount(discount._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    {search || statusFilter !== 'all'
                      ? 'No se encontraron descuentos que coincidan con la búsqueda.'
                      : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">No tienes códigos de descuento</p>
                            <p className="text-sm text-gray-500 mt-1">Crea tu primer descuento para atraer más clientes</p>
                          </div>
                        </div>
                      )
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Agregar Código de Descuento</h2>

            <form onSubmit={handleAddDiscount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  placeholder="DESCUENTO10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de Descuento (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentage}
                  onChange={(e) => setFormData({...formData, percentage: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  placeholder="10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  placeholder="Descuento especial para clientes"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo Usos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mínimo Compra (Q)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({...formData, minPurchase: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    placeholder="100.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Productos Aplicables (opcional)
                </label>
                <input
                  type="text"
                  value={formData.applicableProducts}
                  onChange={(e) => setFormData({...formData, applicableProducts: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  placeholder="productId1, productId2 (dejar vacío para todos)"
                />
                <p className="text-xs text-gray-500 mt-1">Separar IDs con comas</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 transition-colors"
                >
                  Crear Descuento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showEditModal && editingDiscount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Editar Código de Descuento</h2>

            <form onSubmit={handleUpdateDiscount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  placeholder="DESCUENTO10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de Descuento (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentage}
                  onChange={(e) => setFormData({...formData, percentage: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  placeholder="10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  placeholder="Descuento especial para clientes"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo Usos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mínimo Compra (Q)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({...formData, minPurchase: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    placeholder="100.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Productos Aplicables (opcional)
                </label>
                <input
                  type="text"
                  value={formData.applicableProducts}
                  onChange={(e) => setFormData({...formData, applicableProducts: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  placeholder="productId1, productId2 (dejar vacío para todos)"
                />
                <p className="text-xs text-gray-500 mt-1">Separar IDs con comas</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDiscount(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 transition-colors"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DiscountManagement
