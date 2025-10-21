"use client"
import React, { useState } from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from "@/src/assets/assets";
import Link from "next/link"
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs";
import { ChatButton } from "./chat";

const Navbar = () => {
  const { isSeller, router, user, getCartCount } = useAppContext();
  const { openSignIn } = useClerk()
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const cartCount = getCartCount();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Redirigir a la tienda con el término de búsqueda
      router.push(`/all-products?search=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearchModal(false)
      setSearchQuery('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <>
      <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-primary-200 bg-white text-primary-800">
        <Image
          className="cursor-pointer w-28 md:w-32"
          onClick={() => router.push('/')}
          src={assets.logo}
          alt="logo"
        />
        <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
          <Link href="/" className="hover:text-primary-600 transition-colors font-medium">
            Inicio
          </Link>
          <Link href="/all-products" className="hover:text-primary-600 transition-colors font-medium">
            Tienda
          </Link>
          <Link href="/about" className="hover:text-primary-600 transition-colors font-medium">
            Nosotros
          </Link>
          <Link href="/contact" className="hover:text-primary-600 transition-colors font-medium">
            Contacto
          </Link>

          {isSeller &&
            <button
              onClick={() => router.push('/seller')}
              className="text-xs border border-primary-600 text-primary-600 px-4 py-1.5 rounded-full hover:bg-primary-50 transition-colors font-medium"
            >
              Panel de Vendedor
            </button>
          }
        </div>

        <ul className="hidden md:flex items-center gap-6">
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-5 h-5 cursor-pointer text-primary-600 hover:opacity-80 transition-opacity"
            aria-label="Buscar productos"
          >
            <Image
              src={assets.search_icon}
              alt="buscar"
              width={20}
              height={20}
            />
          </button>
          {user && (
            <button
              onClick={() => router.push('/cart')}
              className="relative p-2 hover:bg-primary-50 rounded-full transition-colors"
              aria-label="Carrito de compras"
            >
              <CartIcon className="w-5 h-5 text-primary-800" />
              {/* Contador de items en el carrito */}
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          )}
          {
            user
              ? (
                  <UserButton>
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label="Carrito"
                        labelIcon={<CartIcon />}
                        onClick={() => router.push('/cart')}
                      />
                      <UserButton.Action
                        label="Mis Pedidos"
                        labelIcon={<BagIcon />}
                        onClick={() => router.push('/my-orders')}
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                )
              : (
                  <button
                    onClick={openSignIn}
                    className="flex items-center gap-2 hover:text-primary-600 transition-colors font-medium"
                  >
                    <Image src={assets.user_icon} alt="usuario" />
                    Cuenta
                  </button>
                )
          }
        </ul>

        <div className="flex items-center md:hidden gap-3">
          {isSeller &&
            <button
              onClick={() => router.push('/seller')}
              className="text-xs border border-primary-600 text-primary-600 px-4 py-1.5 rounded-full hover:bg-primary-50 transition-colors font-medium"
            >
              Panel Vendedor
            </button>
          }
          {
            user
              ? <>
                  <UserButton>
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label="Inicio"
                        labelIcon={<HomeIcon />}
                        onClick={() => router.push('/')}
                      />
                    </UserButton.MenuItems>
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label="Productos"
                        labelIcon={<BoxIcon />}
                        onClick={() => router.push('/all-products')}
                      />
                    </UserButton.MenuItems>
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label="Buscar"
                        labelIcon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        }
                        onClick={() => setShowSearchModal(true)}
                      />
                    </UserButton.MenuItems>
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label="Nosotros"
                        labelIcon={<HomeIcon />}
                        onClick={() => router.push('/about')}
                      />
                    </UserButton.MenuItems>
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label="Contacto"
                        labelIcon={<CartIcon />}
                        onClick={() => router.push('/contact')}
                      />
                    </UserButton.MenuItems>
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label="Carrito"
                        labelIcon={<CartIcon />}
                        onClick={() => router.push('/cart')}
                      />
                    </UserButton.MenuItems>
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label="Mis Pedidos"
                        labelIcon={<BagIcon />}
                        onClick={() => router.push('/my-orders')}
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </>
              : <button
                  onClick={openSignIn}
                  className="flex items-center gap-2 hover:text-primary-600 transition-colors font-medium"
                >
                  <Image src={assets.user_icon} alt="usuario" />
                  Cuenta
                </button>
          }
        </div>
      </nav>

      {/* Chat de soporte */}
      <ChatButton />

      {/* Modal de Búsqueda */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Buscar Productos</h2>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  autoFocus
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                className="px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Buscar
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>Presiona Enter o haz clic en "Buscar" para buscar productos</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar