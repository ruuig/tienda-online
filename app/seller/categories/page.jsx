'use client'
import React, { useEffect, useState } from "react";
import { assets } from "@/src/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/src/presentation/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";

const CategoryManagement = () => {
  const { router, getToken, user } = useAppContext();
  const pathname = usePathname();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Obtener categorías del usuario
  const fetchCategories = async () => {
    try {
      const token = await getToken();
      const timestamp = new Date().getTime();
      const { data } = await axios.get(`/api/category/list?t=${timestamp}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (data.success) {
        setCategories(data.categories);
        setLoading(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error(error.message);
    }
  };

  // Crear nueva categoría
  const createCategory = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post('/api/category/add', {
        name: formData.name,
        description: formData.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message);
        setShowAddModal(false);
        setFormData({ name: '', description: '' });
        fetchCategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error al crear la categoría');
      console.error('Error creating category:', error);
    }
  };

  // Actualizar categoría
  const updateCategory = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.put(`/api/category/update`, {
        id: editingCategory._id,
        name: formData.name,
        description: formData.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message);
        setShowEditModal(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
        fetchCategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error al actualizar la categoría');
      console.error('Error updating category:', error);
    }
  };

  // Eliminar categoría
  const deleteCategory = async (categoryId) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium text-gray-800">¿Eliminar categoría?</p>
        <p className="text-sm text-gray-600">Esta acción eliminará permanentemente esta categoría.</p>
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
                const { data } = await axios.delete(`/api/category/delete?id=${categoryId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                if (data.success) {
                  toast.success(data.message);
                  fetchCategories();
                } else {
                  toast.error(data.message);
                }
              } catch (error) {
                toast.error('Error al eliminar la categoría');
                console.error('Error deleting category:', error);
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

  // Alternar estado de la categoría (activar/desactivar)
  const toggleCategoryStatus = async (categoryId) => {
    try {
      const token = await getToken();
      const { data } = await axios.put(`/api/category/toggle?id=${categoryId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message);
        fetchCategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error al cambiar estado de la categoría');
      console.error('Error toggling category status:', error);
    }
  };

  // Abrir modal de edición
  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowEditModal(true);
  };

  // Recargar categorías cuando cambia el usuario
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchCategories();
    }
  }, [user, pathname]);

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? <Loading /> : (
        <div className="w-full md:p-10 p-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Categorías</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
            >
              Agregar Categoría
            </button>
          </div>

          <div className="flex flex-col items-center max-w-7xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
            <table className="table-auto w-full overflow-hidden">
              <thead className="text-gray-900 text-sm text-left">
                <tr>
                  <th className="w-1/3 px-4 py-3 font-medium truncate">Nombre</th>
                  <th className="w-1/3 px-4 py-3 font-medium truncate">Descripción</th>
                  <th className="px-4 py-3 font-medium truncate">Estado</th>
                  <th className="px-4 py-3 font-medium truncate">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-500">
                {categories.length > 0 ? (
                  categories.map((category, index) => (
                    <tr key={index} className="border-t border-gray-500/20">
                      <td className="px-4 py-3 truncate font-medium text-gray-800">
                        {category.name}
                      </td>
                      <td className="px-4 py-3 truncate">
                        {category.description || 'Sin descripción'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => openEditModal(category)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-md hover:opacity-90 transition-colors min-w-[70px]"
                            style={{ backgroundColor: '#69c2d0' }}
                            title="Editar categoría"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="text-sm font-medium">Editar</span>
                          </button>
                          <button
                            onClick={() => toggleCategoryStatus(category._id)}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-md hover:opacity-90 transition-colors min-w-[70px] ${
                              category.isActive
                                ? 'bg-yellow-500 hover:bg-yellow-600'
                                : 'bg-green-500 hover:bg-green-600'
                            }`}
                            title={category.isActive ? 'Desactivar categoría' : 'Activar categoría'}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium">
                              {category.isActive ? 'Desactivar' : 'Activar'}
                            </span>
                          </button>
                          <button
                            onClick={() => deleteCategory(category._id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors min-w-[70px]"
                            title="Eliminar categoría"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="text-sm font-medium">Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No se encontraron categorías. Crea tu primera categoría para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para agregar categoría */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Agregar Categoría</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="Ej: Electrónicos, Ropa, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="Breve descripción de la categoría..."
                  rows="3"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createCategory}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Crear Categoría
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar categoría */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Editar Categoría</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="Ej: Electrónicos, Ropa, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="Breve descripción de la categoría..."
                  rows="3"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={updateCategory}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
