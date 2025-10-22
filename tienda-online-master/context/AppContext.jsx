'use client'
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext)
}

export const AppContextProvider = (props) => {

    const currency = 'Q'
    const router = useRouter()
    const pathname = usePathname()

    const { user } = useUser()
    const { getToken } = useAuth()

    const [products, setProducts] = useState([])
    const [userData, setUserData] = useState(false)
    const [isSeller, setIsSeller] = useState(false)
    const [cartItems, setCartItems] = useState({})

    const fetchProductData = async () => {
        try {
            
            // Agregar timestamp para evitar caché
            const timestamp = new Date().getTime()
            const {data} = await axios.get(`/api/product/list?t=${timestamp}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            })

            if (data.success) {
                setProducts(data.products)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    const fetchUserData = async () => {
        try {
            if (user.publicMetadata.role === 'seller') {
                setIsSeller(true)
            }

            const token = await getToken()
            const { data } = await axios.get('/api/user/data', {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (data.success) {
                setUserData(data.user)
                setCartItems(data.user.cartItems || {})
            }

        } catch (error) {
            console.error('Error fetching user data:', error)
        }
    }

    const addToCart = async (itemId) => {
        if (!user) {
            return toast('Please login',{
                icon: '⚠️',
            })
        }

        if (!setCartItems) {
            console.error('setCartItems not available')
            return toast.error('Error interno del carrito')
        }

        if (!itemId) {
            return toast.error('Error: producto no válido')
        }

        try {
            let cartData = { ...cartItems };
            cartData[itemId] = (cartData[itemId] || 0) + 1;

            setCartItems(cartData);

            // Actualizar en el servidor
            const token = await getToken();
            await axios.post('/api/cart/update', { cartData }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Producto agregado al carrito');

            // Emitir evento personalizado para mostrar notificación (solo en cliente)
            if (typeof window !== 'undefined') {
                const productInfo = products.find(p => p._id === itemId);
                if (productInfo) {
                    window.dispatchEvent(new CustomEvent('productAddedToCart', {
                        detail: { product: productInfo }
                    }));
                }
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Error al agregar producto');
        }
    }

    const updateCartQuantity = async (itemId, quantity) => {
        if (!setCartItems) {
            console.error('setCartItems not available')
            return toast.error('Error interno del carrito')
        }

        if (!itemId) {
            return toast.error('Error: producto no válido')
        }

        try {
            let cartData = { ...cartItems };

            if (quantity <= 0) {
                delete cartData[itemId];
            } else {
                cartData[itemId] = quantity;
            }

            setCartItems(cartData);

            // Actualizar en el servidor si hay usuario
            if (user) {
                const token = await getToken();
                await axios.post('/api/cart/update', { cartData }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            // Si se agregó cantidad (no se eliminó), mostrar notificación
            if (quantity > 0) {
                toast.success('Carrito actualizado');

                // Emitir evento personalizado para mostrar notificación (solo en cliente)
                if (typeof window !== 'undefined') {
                    const productInfo = products.find(p => p._id === itemId);
                    if (productInfo) {
                        window.dispatchEvent(new CustomEvent('productAddedToCart', {
                            detail: { product: productInfo }
                        }));
                    }
                }
            }
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            toast.error('Error al actualizar carrito');
        }
    }

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            if (cartItems[items] > 0) {
                totalCount += cartItems[items];
            }
        }
        return totalCount;
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (cartItems[items] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[items];
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    }

    useEffect(() => {
        fetchProductData()
    }, [])

    useEffect(() => {
        if (pathname === '/' || pathname === '/all-products' || pathname.startsWith('/product/')) {
            fetchProductData()
        }
    }, [pathname])

    useEffect(() => {
        if (user) {
            fetchUserData()
        }
    }, [user])

    const value = {
        user, getToken,
        currency, router,
        isSeller, setIsSeller,
        userData, fetchUserData,
        products, fetchProductData,
        cartItems, setCartItems,
        addToCart, updateCartQuantity,
        getCartCount, getCartAmount
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}