'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";

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

const AllProducts = () => {

    const { products } = useAppContext();
    const searchParams = useSearchParams()
    const [filteredProducts, setFilteredProducts] = useState([])
    const [filters, setFilters] = useState({
      search: '',
      category: 'All',
      minPrice: '',
      maxPrice: '',
      sort: 'date-desc'
    })

    // Aplicar filtros iniciales desde la URL cuando se carga la página
    useEffect(() => {
      const searchQuery = searchParams.get('search') || ''
      if (searchQuery) {
        setFilters(prev => ({ ...prev, search: searchQuery }))
      }
    }, [searchParams])

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

    return (
        <>
            <Navbar />
            <div className="px-6 md:px-16 lg:px-32 py-16">
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    {filters.search ? (
                      <>
                        Resultados para: <span className="text-secondary-500">"{filters.search}"</span>
                      </>
                    ) : (
                      <>
                        Nuestra <span className="text-secondary-500">Tienda</span>
                      </>
                    )}
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    {filters.search ? (
                      `Encontramos ${filteredProducts.length} productos que coinciden con tu búsqueda`
                    ) : (
                      'Descubre nuestra amplia colección de productos tecnológicos de las mejores marcas'
                    )}
                  </p>
                </div>

                {/* Filters */}
                <ProductFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  productsCount={filteredProducts.length}
                />

                {/* Products Grid */}
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredProducts.map((product, index) => (
                      <ProductCard key={product._id || index} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
                    <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
                  </div>
                )}
              </div>
            </div>
            <Footer />
        </>
    );
};

export default AllProducts;
