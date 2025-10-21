/**
 * Componente ProductCard adaptado para mostrar en el chat
 * Versión compacta y optimizada para mensajes de chat
 */

import React from 'react';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';

const ChatProductCard = ({ product, onAddToCart, showAddToCart = true }) => {
  const { currency, router } = useAppContext();

  const handleCardClick = () => {
    if (typeof window !== 'undefined') {
      router.push('/product/' + product._id);
      // Scroll to top when navigating
      window.scrollTo(0, 0);
    }
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation(); // Prevenir que se active el clic de la card
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white border border-gray-200 rounded-lg p-3 max-w-sm cursor-pointer hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
    >
      <div className="flex gap-3">
        {/* Imagen del producto */}
        <div className="relative bg-gray-100 rounded-lg w-20 h-20 flex items-center justify-center flex-shrink-0">
          <Image
            src={product.image?.[0] || '/placeholder-product.jpg'}
            alt={product.name}
            className="object-cover w-full h-full rounded-lg"
            width={80}
            height={80}
          />
        </div>

        {/* Información del producto */}
        <div className="flex-1 min-w-0">
          {/* Nombre del producto */}
          <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
            {product.name}
          </h3>

          {/* Categoría */}
          <p className="text-xs text-gray-600 mb-1">
            {product.category}
          </p>

          {/* Descripción corta */}
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
            {product.description}
          </p>

          {/* Precio y rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-600 text-sm">
                {currency}{product.offerPrice}
              </span>
              {product.price > product.offerPrice && (
                <span className="text-xs text-gray-400 line-through">
                  {currency}{product.price}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600">
                {product.rating || 4.5}
              </span>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, index) => (
                  <svg
                    key={`star-${product._id || 'default'}-${index}`}
                    className={`w-3 h-3 ${
                      index < Math.floor(product.rating || 4.5)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          {/* Botón de agregar al carrito */}
          {showAddToCart && (
            <div className="mt-2">
              <button
                onClick={handleAddToCartClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-3 rounded-lg transition-colors duration-200 font-medium"
              >
                🛒 Agregar al Carrito
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Indicador de clic */}
      <div className="mt-2 text-xs text-gray-400 text-center">
        👆 Haz clic para ver detalles completos
      </div>
    </div>
  );
};

export default ChatProductCard;
