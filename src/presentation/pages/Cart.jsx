'use client'
import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import OrderSummary from "@/src/presentation/components/OrderSummary";
import Image from "next/image";
import Navbar from "@/src/presentation/components/Navbar";
import Footer from "@/src/presentation/components/Footer";
import { formatCurrency } from '@/src/shared/utils';
import { GetCartUseCase } from '@/src/application/use-cases/cartUseCases'
import { UserRepositoryImpl } from '@/src/infrastructure/database/repositories'
import connectDB from '@/config/db'

const Cart = () => {
    const [cartItems, setCartItems] = useState({});
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCartData = async () => {
        try {
            await connectDB()

            // Obtener productos
            const productRepository = new ProductRepositoryImpl()
            const getProductsUseCase = new GetProductsUseCase(productRepository)
            const productsResult = await getProductsUseCase.execute()

            if (productsResult.success) {
                setProducts(productsResult.products);
            }

            // Nota: En una implementación completa, necesitarías obtener el userId
            // Para este ejemplo, asumimos que tienes acceso al userId
            // const userRepository = new UserRepositoryImpl()
            // const getCartUseCase = new GetCartUseCase(userRepository)
            // const cartResult = await getCartUseCase.execute(userId)

        } catch (error) {
            console.error('Error fetching cart data:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCartData();
    }, [])

    const handleUpdateQuantity = (productId, quantity) => {
        // Aquí iría la lógica para actualizar cantidad usando casos de uso
        console.log('Update quantity:', productId, quantity);
    }

    const handleRemoveItem = (productId) => {
        handleUpdateQuantity(productId, 0);
    }

    const handleContinueShopping = () => {
        window.location.href = '/all-products';
    }

    return (
        <>
            <Navbar />
            <div className="flex flex-col md:flex-row gap-10 px-6 md:px-16 lg:px-32 pt-14 mb-20">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-8 border-b border-gray-500/30 pb-6">
                        <p className="text-2xl md:text-3xl text-gray-500">
                            Tu <span className="font-medium text-secondary-500">Carrito</span>
                        </p>
                        <p className="text-lg md:text-xl text-gray-500/80">
                            {Object.values(cartItems).reduce((total, qty) => total + qty, 0)} Artículos
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead className="text-left">
                                <tr>
                                    <th className="text-nowrap pb-6 md:px-4 px-1 text-gray-600 font-medium">
                                        Detalles del Producto
                                    </th>
                                    <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                                        Precio
                                    </th>
                                    <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                                        Cantidad
                                    </th>
                                    <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(cartItems).map((itemId) => {
                                    const product = products.find(product => product._id === itemId);

                                    if (!product || cartItems[itemId] <= 0) return null;

                                    return (
                                        <tr key={itemId}>
                                            <td className="flex items-center gap-4 py-4 md:px-4 px-1">
                                                <div>
                                                    <div className="rounded-lg overflow-hidden bg-gray-500/10 p-2">
                                                        <Image
                                                            src={product.image[0]}
                                                            alt={product.name}
                                                            className="w-16 h-auto object-cover mix-blend-multiply"
                                                            width={1280}
                                                            height={720}
                                                        />
                                                    </div>
                                                    <button
                                                        className="md:hidden text-xs text-secondary-500 mt-1"
                                                        onClick={() => handleRemoveItem(product._id)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                                <div className="text-sm hidden md:block">
                                                    <p className="text-gray-800">{product.name}</p>
                                                    <button
                                                        className="text-xs text-secondary-500 mt-1"
                                                        onClick={() => handleRemoveItem(product._id)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-4 md:px-4 px-1 text-gray-600">{formatCurrency(product.offerPrice)}</td>
                                            <td className="py-4 md:px-4 px-1">
                                                <div className="flex items-center md:gap-2 gap-1">
                                                    <button onClick={() => handleUpdateQuantity(product._id, cartItems[itemId] - 1)}>
                                                        <Image
                                                            src={assets.decrease_arrow}
                                                            alt="decrease_arrow"
                                                            className="w-4 h-4"
                                                        />
                                                    </button>
                                                    <input
                                                        onChange={e => handleUpdateQuantity(product._id, Number(e.target.value))}
                                                        type="number"
                                                        value={cartItems[itemId]}
                                                        className="w-8 border text-center appearance-none"
                                                    />
                                                    <button onClick={() => handleUpdateQuantity(product._id, cartItems[itemId] + 1)}>
                                                        <Image
                                                            src={assets.increase_arrow}
                                                            alt="increase_arrow"
                                                            className="w-4 h-4"
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-4 md:px-4 px-1 text-gray-600">
                                                {formatCurrency(product.offerPrice * cartItems[itemId])}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <button
                        onClick={handleContinueShopping}
                        className="group flex items-center mt-6 gap-2 text-secondary-500"
                    >
                        <Image
                            className="group-hover:-translate-x-1 transition"
                            src={assets.arrow_right_icon_colored}
                            alt="arrow_right_icon_colored"
                        />
                        Seguir Comprando
                    </button>
                </div>
                <OrderSummary />
            </div>
            <Footer />
        </>
    );
};

export default Cart;
