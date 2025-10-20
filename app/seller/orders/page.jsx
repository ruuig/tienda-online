'use client';
import React, { useEffect, useState } from "react";
import { assets, orderDummyData } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const Orders = () => {

    const { currency, getToken, user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchId, setSearchId] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [stats, setStats] = useState({ total: 0, pending: 0, shipped: 0, delivered: 0, totalAmount: 0 });

    const fetchSellerOrders = async () => {
        try {

            const token = await getToken()

            const { data } = await axios.get(
                '/api/order/seller-orders',
                { headers: { Authorization: `Bearer ${token}` } }
            )

            if (data.success) {
                setOrders(data.orders)
                setLoading(false)
                console.log('Órdenes cargadas:', data.orders.length)

                // Calcular estadísticas
                const total = data.orders.length;
                const pending = data.orders.filter(o => o.status === 'Order Placed').length;
                const shipped = data.orders.filter(o => o.status === 'Shipped').length;
                const delivered = data.orders.filter(o => o.status === 'Delivered').length;
                const totalAmount = data.orders.reduce((sum, o) => sum + o.amount, 0);

                setStats({ total, pending, shipped, delivered, totalAmount });
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = await getToken();
            const { data } = await axios.put(`/api/order/update-status/${orderId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success(`Estado actualizado a ${newStatus}`);
                // Recargar las órdenes
                fetchSellerOrders();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Error al actualizar el estado');
        }
    };

    useEffect(() => {
        if (user) {
            fetchSellerOrders();
        }
    }, [user]);

    useEffect(() => {
        let filtered = orders;

        // Filtrar por ID de compra
        if (searchId) {
            filtered = filtered.filter(order => order._id && order._id.toLowerCase().includes(searchId.toLowerCase()));
        }

        // Filtrar por estado
        if (filterStatus) {
            filtered = filtered.filter(order => order.status === filterStatus);
        }

        // Filtrar por fecha
        if (filterDate) {
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.date).toLocaleDateString();
                return orderDate === filterDate;
            });
        }

        setFilteredOrders(filtered);
    }, [orders, searchId, filterStatus, filterDate]);

    return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
            {loading ? <Loading /> : <div className="md:p-10 p-4 space-y-5">
                <h2 className="text-lg font-medium">Orders</h2>

                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-[#A8DADC] p-4 rounded-lg border-l-4 border-[#457B9D]">
                        <h3 className="text-lg font-semibold text-[#457B9D]">{stats.total}</h3>
                        <p className="text-sm text-[#457B9D]">Total Órdenes</p>
                    </div>
                    <div className="bg-[#F1FAEE] p-4 rounded-lg border-l-4 border-[#457B9D]">
                        <h3 className="text-lg font-semibold text-[#457B9D]">{stats.pending}</h3>
                        <p className="text-sm text-[#457B9D]">Pendientes</p>
                    </div>
                    <div className="bg-[#E63946] p-4 rounded-lg border-l-4 border-[#457B9D]">
                        <h3 className="text-lg font-semibold text-white">{stats.shipped}</h3>
                        <p className="text-sm text-white">Enviadas</p>
                    </div>
                    <div className="bg-[#1D3557] p-4 rounded-lg border-l-4 border-[#457B9D]">
                        <h3 className="text-lg font-semibold text-white">{stats.delivered}</h3>
                        <p className="text-sm text-white">Entregadas</p>
                    </div>
                    <div className="bg-[#457B9D] p-4 rounded-lg border-l-4 border-[#E63946]">
                        <h3 className="text-lg font-semibold text-white">{currency}{stats.totalAmount.toFixed(2)}</h3>
                        <p className="text-sm text-white">Total Ingresos</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-5">
                    <input
                        type="text"
                        placeholder="Buscar por ID de compra"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        className="border border-[#A8DADC] rounded-md p-2 flex-1 focus:border-[#457B9D] focus:outline-none"
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-[#A8DADC] rounded-md p-2 focus:border-[#457B9D] focus:outline-none"
                    >
                        <option value="">Todos los estados</option>
                        <option value="Order Placed">Pendiente</option>
                        <option value="Shipped">Enviado</option>
                        <option value="Delivered">Entregado</option>
                    </select>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="border border-[#A8DADC] rounded-md p-2 focus:border-[#457B9D] focus:outline-none"
                    />
                </div>
                <p className="text-sm text-[#457B9D] mb-4">Mostrando {filteredOrders.length} órdenes</p>
                <div className="max-w-4xl rounded-md">
                    {filteredOrders.length === 0 ? (
                        <p className="text-center text-[#457B9D] py-10">No se encontraron órdenes.</p>
                    ) : (
                        filteredOrders.map((order, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-t border-gray-300">
                                <div className="flex-1 flex gap-5 max-w-80">
                                    <Image
                                        className="max-w-16 max-h-16 object-cover"
                                        src={assets.box_icon}
                                        alt="box_icon"
                                    />
                                    <p className="flex flex-col gap-3">
                                        <span className="font-medium">
                                            {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                                        </span>
                                        <span>Items : {order.items.length}</span>
                                    </p>
                                </div>
                                <div>
                                    <p>
                                        <span className="font-medium">{order.address.fullName}</span>
                                        <br />
                                        <span>{order.address.area}</span>
                                        <br />
                                        <span>{`${order.address.city}, ${order.address.state}`}</span>
                                        <br />
                                        <span>{order.address.phoneNumber}</span>
                                    </p>
                                </div>
                                <p className="font-medium my-auto">{currency}{order.amount}</p>
                                <div>
                                    <p className="flex flex-col">
                                        <span><strong>ID de Compra:</strong> {order._id}</span>
                                        <span><strong>Usuario:</strong> {order.userId}</span>
                                        <span>Method : COD</span>
                                        <span>Date : {new Date(order.date).toLocaleDateString()}</span>
                                        <span>Payment : Pending</span>
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                        {order.status !== 'Shipped' && (
                                            <button
                                                onClick={() => updateOrderStatus(order._id, 'Shipped')}
                                                className="bg-[#457B9D] text-white px-3 py-1 rounded text-xs hover:bg-[#1D3557] transition-colors"
                                            >
                                                Marcar como Enviado
                                            </button>
                                        )}
                                        {order.status !== 'Delivered' && (
                                            <button
                                                onClick={() => updateOrderStatus(order._id, 'Delivered')}
                                                className="bg-[#E63946] text-white px-3 py-1 rounded text-xs hover:bg-[#A8DADC] transition-colors"
                                            >
                                                Marcar como Entregado
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>}
        </div>
    );
};

export default Orders;