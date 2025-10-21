'use client'

import { useState, useEffect } from 'react'
import { useAppContext } from '@/context/AppContext'

const AddToCartNotification = () => {
  const { router } = useAppContext()
  const [isVisible, setIsVisible] = useState(false)
  const [product, setProduct] = useState(null)
  const [showNotification, setShowNotification] = useState(false)

  // Esta función será llamada desde el contexto cuando se agregue un producto
  useEffect(() => {
    const handleProductAdded = (event) => {
      setProduct(event.detail.product)
      setShowNotification(true)
      setIsVisible(true)

      // Auto-ocultar después de 3 segundos
      setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => setShowNotification(false), 300)
      }, 3000)
    }

    window.addEventListener('productAddedToCart', handleProductAdded)
    return () => window.removeEventListener('productAddedToCart', handleProductAdded)
  }, [])

  const handleContinueShopping = () => {
    setIsVisible(false)
    setTimeout(() => {
      setShowNotification(false)
      router.push('/all-products')  // Redirigir a la tienda
    }, 300)
  }

  const handleViewCart = () => {
    setIsVisible(false)
    setTimeout(() => {
      setShowNotification(false)
      router.push('/cart')
    }, 300)
  }

  if (!showNotification) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
    }`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              ¡Producto agregado al carrito!
            </p>
            {product && (
              <p className="text-xs text-gray-600 truncate">
                {product.name}
              </p>
            )}
          </div>

          <button
            onClick={() => setShowNotification(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleContinueShopping}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Seguir Comprando
          </button>
          <button
            onClick={handleViewCart}
            className="flex-1 px-3 py-2 text-sm bg-secondary-500 text-white rounded-md hover:bg-secondary-600 transition-colors"
          >
            Ver Carrito
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddToCartNotification
