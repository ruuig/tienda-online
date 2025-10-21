'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Navbar from "@/src/presentation/components/Navbar";
import Footer from "@/src/presentation/components/Footer";
import Loading from "@/src/presentation/components/Loading";
import { formatCurrency, formatDate } from '@/src/shared/utils';
import { GetOrdersUseCase } from '@/src/application/use-cases/orderUseCases'
import { OrderRepositoryImpl } from '@/src/infrastructure/database/repositories'
import connectDB from '@/config/db'

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            await connectDB()

            // Nota: En una implementación completa, necesitarías obtener el userId
            // Para este ejemplo, asumimos que tienes acceso al userId
            // const orderRepository = new OrderRepositoryImpl()
            // const getOrdersUseCase = new GetOrdersUseCase(orderRepository)
            // const result = await getOrdersUseCase.execute(userId)

            // Por ahora, establecer orders vacías
            setOrders([])
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <>
            <Navbar />
            <div className="flex flex-col justify-between px-6 md:px-16 lg:px-32 py-6 min-h-screen">
                <div className="space-y-5">
                    <h2 className="text-lg font-medium mt-6">Mis Pedidos</h2>
                    {loading ? <Loading /> : (
                        <div className="max-w-5xl border-t border-gray-300 text-sm">
                            {orders.length === 0 ? (
                                <p className="text-center text-gray-500 py-10">Aún no has realizado ningún pedido.</p>
                            ) : (
                                orders.map((order, index) => (
                                    <div key={index} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-b border-gray-300">
                                        <div className="flex-1 flex gap-5 max-w-80">
                                            <Image
                                                className="max-w-16 max-h-16 object-cover"
                                                src={assets.box_icon}
                                                alt="box_icon"
                                            />
                                            <p className="flex flex-col gap-3">
                                                <span className="font-medium text-base">
                                                    {order.items.map((item) => `${item.product?.name || 'Producto'} x ${item.quantity}`).join(", ")}
                                                </span>
                                                <span>Artículos: {order.items.length}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p>
                                                <span className="font-medium">{order.address?.fullName || 'N/A'}</span>
                                                <br />
                                                <span>{order.address?.area || 'N/A'}</span>
                                                <br />
                                                <span>{`${order.address?.city || ''}, ${order.address?.state || ''}`}</span>
                                                <br />
                                                <span>{order.address?.phoneNumber || 'N/A'}</span>
                                            </p>
                                        </div>
                                        <p className="font-medium my-auto">{formatCurrency(order.amount)}</p>
                                        <div>
                                            <p className="flex flex-col">
                                                <span>Método: COD</span>
                                                <span>Fecha: {formatDate(order.date)}</span>
                                                <span>Pago: Pendiente</span>
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MyOrders;
