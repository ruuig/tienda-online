'use client'
import Navbar from '@/src/presentation/components/seller/Navbar'
import Sidebar from '@/src/presentation/components/seller/Sidebar'
import React from 'react'
import { useAppContext } from '@/context/AppContext'

const Layout = ({ children }) => {
  const { user } = useAppContext()

  // Verificar que el usuario tenga permisos de vendedor
  const userRole = user?.publicMetadata?.role || 'user';
  const hasSellerAccess = userRole === 'admin' || userRole === 'seller';

  return (
    <div>
      <Navbar />
      <div className='flex w-full'>
        {hasSellerAccess && <Sidebar />}
        {children}
      </div>
    </div>
  )
}

export default Layout