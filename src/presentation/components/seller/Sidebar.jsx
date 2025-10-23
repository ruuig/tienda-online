import React from 'react';
import Link from 'next/link';
import { assets } from '@/src/assets/assets';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

const SideBar = () => {
    const pathname = usePathname()
    const { user } = useAppContext()

    // Verificar que el usuario tenga permisos de vendedor
    const userRole = user?.publicMetadata?.role || 'user';
    const hasSellerAccess = userRole === 'admin' || userRole === 'seller';

    // Si el usuario no tiene permisos de vendedor, no mostrar el sidebar
    if (!hasSellerAccess) {
        return null;
    }

    const baseMenuItems = [
        { name: 'Agregar Producto', path: '/seller', icon: assets.add_icon },
        { name: 'Lista de Productos', path: '/seller/product-list', icon: assets.product_list_icon },
        { name: 'Gestionar Slider', path: '/seller/slider-management', icon: assets.add_icon },
        { name: 'Ordenes', path: '/seller/orders', icon: assets.order_icon },
    ];

    // Solo mostrar gestión de usuarios si el usuario es admin o seller
    const canManageUsers = userRole === 'admin' || userRole === 'seller';

    const menuItems = canManageUsers
        ? [...baseMenuItems, { name: 'Usuarios', path: '/seller/users', icon: assets.user_icon }]
        : baseMenuItems;

    return (
        <div className='md:w-64 w-16 border-r min-h-screen text-base border-gray-300 py-2 flex flex-col'>
            {menuItems.map((item) => {

                const isActive = pathname === item.path;

                return (
                    <Link href={item.path} key={item.name} passHref>
                        <div
                            className={
                                `flex items-center py-3 px-4 gap-3 ${isActive
                                    ? "border-r-4 md:border-r-[6px] bg-secondary-100 border-secondary-500/90"
                                    : "hover:bg-gray-100/90 border-white"
                                }`
                            }
                        >
                            <Image
                                src={item.icon}
                                alt={`${item.name.toLowerCase()}_icon`}
                                className="w-7 h-7"
                            />
                            <p className='md:block hidden text-center'>{item.name}</p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default SideBar;
