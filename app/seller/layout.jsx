'use client'

import React from 'react'
import { useUser } from '@clerk/nextjs'
import Navbar from '@/src/presentation/components/seller/Navbar'
import Sidebar from '@/src/presentation/components/seller/Sidebar'

export default function SellerLayout({ children }) {
  const { user, isLoaded, isSignedIn } = useUser()

  // 🧠 No evalúes permisos hasta que Clerk haya cargado
  if (!isLoaded) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-b-transparent border-secondary-600" />
      </div>
    )
  }

  const role = user?.publicMetadata?.role
  const allowed = isSignedIn && (role === 'seller' || role === 'admin')

  if (!allowed) {
    // 🔒 Ya con Clerk cargado, ahora sí mostramos el mensaje o redirigimos
    return (
      <div className="px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-1">Acceso denegado</h2>
          <p className="text-sm">Esta sección es solo para cuentas con rol <b>seller</b> o <b>admin</b>.</p>
        </div>
      </div>
    )
  }

  // ✅ Clerk listo + permisos OK → render normal del panel
  return (
    <div>
      <Navbar />
      <div className="flex w-full">
        <Sidebar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
