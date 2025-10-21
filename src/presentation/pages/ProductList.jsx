'use client'
import React, { useState, useEffect, useMemo } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Loading from "@/src/presentation/components/Loading";
import { formatCurrency } from '@/src/shared/utils';

const ProductFilters = ({ filters, onFiltersChange, productsCount }) => {
  const categories = [
    'All',
    'Earphone',
    'Headphone',
    'Watch',
    'Smartphone',
    'Laptop',
    'Camera',
    'Accessories'
  ]

  const sortOptions = [
    { value: 'name-asc', label: 'Nombre A-Z' },
    { value: 'name-desc', label: 'Nombre Z-A' },
    { value: 'price-asc', label: 'Precio: Menor a Mayor' },
    { value: 'price-desc', label: 'Precio: Mayor a Menor' },
    { value: 'date-desc', label: 'Más Recientes' },
    { value: 'date-asc', label: 'Más Antiguos' }
  ]

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar productos
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="w-full lg:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            value={filters.category}
            onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
            className="w-full lg:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'All' ? 'Todas las categorías' : category}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="w-full lg:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rango de Precio
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Mín"
              value={filters.minPrice}
              onChange={(e) => onFiltersChange({ ...filters, minPrice: e.target.value })}
              className="w-full lg:w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
            />
            <span className="self-center text-gray-500">-</span>
            <input
              type="number"
              placeholder="Máx"
              value={filters.maxPrice}
              onChange={(e) => onFiltersChange({ ...filters, maxPrice: e.target.value })}
              className="w-full lg:w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="w-full lg:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ordenar por
          </label>
          <select
            value={filters.sort}
            onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value })}
            className="w-full lg:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          {productsCount} productos encontrados
        </div>
      </div>
    </div>
  )
}

const ProductList = () => {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    minPrice: '',
    maxPrice: '',
    sort: 'date-desc'
  })

  // Función para aplicar filtros
  const applyFilters = useMemo(() => {
    return (products, filters) => {
      let filtered = [...products]

      // Filtro de búsqueda
      if (filters.search) {
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          product.description.toLowerCase().includes(filters.search.toLowerCase())
        )
      }

      // Filtro de categoría
      if (filters.category !== 'All') {
        filtered = filtered.filter(product => product.category === filters.category)
      }

      // Filtro de precio mínimo
      if (filters.minPrice) {
        filtered = filtered.filter(product => product.offerPrice >= parseFloat(filters.minPrice))
      }

      // Filtro de precio máximo
      if (filters.maxPrice) {
        filtered = filtered.filter(product => product.offerPrice <= parseFloat(filters.maxPrice))
      }

      // Ordenamiento
      switch (filters.sort) {
        case 'name-asc':
          filtered.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'name-desc':
          filtered.sort((a, b) => b.name.localeCompare(a.name))
          break
        case 'price-asc':
          filtered.sort((a, b) => a.offerPrice - b.offerPrice)
          break
        case 'price-desc':
          filtered.sort((a, b) => b.offerPrice - a.offerPrice)
          break
        case 'date-desc':
          filtered.sort((a, b) => b.date - a.date)
          break
        case 'date-asc':
          filtered.sort((a, b) => a.date - b.date)
          break
        default:
          break
      }

      return filtered
    }
  }, [])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    const filtered = applyFilters(products, filters)
    setFilteredProducts(filtered)
  }, [products, filters, applyFilters])

  const fetchSellerProducts = async () => {
    try {
      // Nota: En una implementación completa, necesitarías obtener productos del vendedor actual
      // usando casos de uso específicos para vendedores
      setProducts([])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching seller products:', error);
      setLoading(false)
    }
  }

  const deleteProduct = async (productId) => {
    // Aquí iría la lógica para eliminar producto usando casos de uso
    console.log('Delete product:', productId);
  }

  const handleViewProduct = (productId) => {
    window.location.href = `/product/${productId}`;
  }

  const handleEditProduct = (productId) => {
    window.location.href = `/seller/edit-product/${productId}`;
  }

  const handleAddProduct = () => {
    window.location.href = '/seller';
  }

  useEffect(() => {
    fetchSellerProducts();
  }, [])

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? <Loading /> : <div className="w-full md:p-10 p-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Productos</h2>
          <button
            onClick={handleAddProduct}
            className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
          >
            Agregar Producto
          </button>
        </div>

        {/* Filters */}
        <ProductFilters
          filters={filters}
          onFiltersChange={setFilters}
          productsCount={filteredProducts.length}
        />

        <div className="flex flex-col items-center max-w-7xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
          <table className="table-auto w-full overflow-hidden">
            <thead className="text-gray-900 text-sm text-left">
              <tr>
                <th className="w-2/3 md:w-2/5 px-4 py-3 font-medium truncate">Producto</th>
                <th className="px-4 py-3 font-medium truncate max-sm:hidden">Categoría</th>
                <th className="px-4 py-3 font-medium truncate">
                  Precio
                </th>
                <th className="px-4 py-3 font-medium truncate max-sm:hidden">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-500">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <tr key={index} className="border-t border-gray-500/20">
                    <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                      <div className="bg-gray-500/10 rounded p-2">
                        <Image
                          src={product.image[0]}
                          alt="product Image"
                          className="w-16"
                          width={1280}
                          height={720}
                        />
                      </div>
                      <span className="truncate w-full">
                        {product.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-sm:hidden">{product.category}</td>
                    <td className="px-4 py-3">{formatCurrency(product.offerPrice)}</td>
                    <td className="px-4 py-3 max-sm:hidden">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => handleViewProduct(product._id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-md hover:opacity-90 transition-colors min-w-[90px]"
                          style={{backgroundColor: '#343b65'}}
                          title="Ver producto"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          <span className="text-sm font-medium">Ver</span>
                        </button>
                        <button
                          onClick={() => handleEditProduct(product._id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-md hover:opacity-90 transition-colors min-w-[90px]"
                          style={{backgroundColor: '#69c2d0'}}
                          title="Editar producto"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span className="text-sm font-medium">Editar</span>
                        </button>
                        <button
                          onClick={() => deleteProduct(product._id)}
                          disabled={deleting === product._id}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[110px]"
                          title="Eliminar producto"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          <span className="text-sm font-medium">{deleting === product._id ? 'Eliminando...' : 'Eliminar'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                    No se encontraron productos con los filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  );
};

export default ProductList;
