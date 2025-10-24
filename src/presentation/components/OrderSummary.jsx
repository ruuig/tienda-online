import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const OrderSummary = () => {

  const { router, getCartCount, getCartAmount, getToken, user, cartItems, setCartItems } = useAppContext()
  const currency = 'Q' // Forzar el uso de quetzales
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [promotionCode, setPromotionCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const fetchUserAddresses = async () => {
    try {
      
      const token = await getToken()
      const {data} = await axios.get('/api/user/get-address',{headers:{Authorization:`Bearer ${token}`}})
      if (data.success) {
        setUserAddresses(data.addresses)
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0])
        }
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  const applyDiscount = async () => {
    if (!promotionCode.trim()) {
      toast.error('Por favor ingresa un código de promoción');
      return;
    }

    if (appliedDiscount) {
      toast.error('Ya tienes un descuento aplicado. Remueve el actual para aplicar uno nuevo.');
      return;
    }

    setIsApplyingDiscount(true);

    try {
      const token = await getToken();
      const { data } = await axios.post('/api/discount/validate-code', {
        code: promotionCode.trim(),
        userId: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        const discount = data.discount;
        const subtotal = getCartAmount();

        // Verificar monto mínimo de compra
        if (discount.minPurchase && subtotal < discount.minPurchase) {
          toast.error(`El monto mínimo para este descuento es Q${discount.minPurchase}`);
          return;
        }

        // Verificar productos aplicables si existen
        if (discount.applicableProducts && discount.applicableProducts.length > 0) {
          const cartProductIds = Object.keys(cartItems);
          const applicableProducts = discount.applicableProducts;

          const hasApplicableProduct = cartProductIds.some(productId =>
            applicableProducts.includes(productId)
          );

          if (!hasApplicableProduct) {
            toast.error('Este descuento no aplica a los productos en tu carrito');
            return;
          }
        }

        setAppliedDiscount(discount);
        toast.success(`¡Descuento aplicado! ${discount.percentage}% de descuento`);
      } else {
        toast.error(data.message || 'Código de descuento inválido');
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      toast.error(error.response?.data?.message || 'Error al aplicar el descuento');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setPromotionCode('');
    toast.success('Descuento removido');
  };

  const createOrder = async () => {
    try {
      if (!user) {
        return toast('Please login to place order',{
          icon: '⚠️',
        })
      }

      if (!selectedAddress) {
        return toast.error('Please select an address')
      }

      let cartItemsArray = Object.keys(cartItems).map((key) => ({product:key, quantity:cartItems[key]}))
      cartItemsArray = cartItemsArray.filter(item => item.quantity > 0)

      if (cartItemsArray.length === 0) {
        return toast.error('Cart is empty')
      }

      console.log('Creating order with userId:', user.id)
      console.log('Cart items:', cartItemsArray)
      console.log('Selected address:', selectedAddress)
      console.log('Applied discount:', appliedDiscount)

      const token = await getToken()

      // Si hay un descuento aplicado, aplicarlo primero
      let appliedDiscountId = null;
      if (appliedDiscount) {
        try {
          const applyResponse = await axios.post('/api/discount/apply', {
            discountId: appliedDiscount.id
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (applyResponse.data.success) {
            appliedDiscountId = appliedDiscount.id;
            console.log('Discount applied successfully:', applyResponse.data.discount);
          } else {
            console.error('Failed to apply discount:', applyResponse.data.message);
            toast.error('Error al aplicar el descuento: ' + applyResponse.data.message);
            return;
          }
        } catch (error) {
          console.error('Error applying discount:', error);
          toast.error('Error al aplicar el descuento');
          return;
        }
      }

      const { data } = await axios.post('/api/order/create',{
        address: selectedAddress._id,
        items: cartItemsArray,
        discountId: appliedDiscountId,
        discountAmount: discountAmount
      },{
        headers: {Authorization:`Bearer ${token}`}
      })

      if (data.success) {
        toast.success(data.message)
        setCartItems({})
        setAppliedDiscount(null);
        setPromotionCode('');
        router.push('/order-placed')
      } else {
        console.error('Order creation failed:', data.message)
        toast.error(data.message || 'Error al crear la orden')
      }

    } catch (error) {
      console.error('Error creating order:', error)
      if (error.response) {
        console.error('Response data:', error.response.data)
        toast.error(error.response.data.message || 'Error del servidor')
      } else {
        toast.error('Error de conexión')
      }
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserAddresses();
    }
  }, [user])

  // Calcular descuento y total
  const subtotal = getCartAmount();
  const discountAmount = appliedDiscount
    ? (subtotal * appliedDiscount.percentage / 100)
    : 0;
  const totalAmount = subtotal - discountAmount;

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700">
        Resumen del Pedido
      </h2>
      <hr className="border-gray-500/30 my-5" />
      <div className="space-y-6">
        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Seleccionar Dirección
          </label>
          <div className="relative inline-block w-full text-sm border">
            <button
              className="peer w-full text-left px-4 pr-2 py-2 bg-white text-gray-700 focus:outline-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>
                {selectedAddress
                  ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                  : "Seleccionar Dirección"}
              </span>
              <svg className={`w-5 h-5 inline float-right transition-transform duration-200 ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#6B7280"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5">
                {userAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                    onClick={() => handleAddressSelect(address)}
                  >
                    {address.fullName}, {address.area}, {address.city}, {address.state}
                  </li>
                ))}
                <li
                  onClick={() => router.push("/add-address")}
                  className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
                >
                  + Agregar Nueva Dirección
                </li>
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Código de Promoción
          </label>
          <div className="flex flex-col items-start gap-3">
            <input
              type="text"
              value={promotionCode}
              onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
              placeholder="Ingresa el código de promoción"
              className="flex-grow w-full outline-none p-2.5 text-gray-600 border"
              disabled={!!appliedDiscount}
            />
            <div className="flex gap-2">
              <button
                onClick={applyDiscount}
                disabled={isApplyingDiscount || !!appliedDiscount}
                className="bg-secondary-500 text-white px-6 py-2 hover:bg-secondary-600 transition-colors disabled:bg-gray-400"
              >
                {isApplyingDiscount ? 'Aplicando...' : 'Aplicar'}
              </button>
              {appliedDiscount && (
                <button
                  onClick={removeDiscount}
                  className="bg-red-500 text-white px-4 py-2 hover:bg-red-600 transition-colors text-sm"
                >
                  Remover
                </button>
              )}
            </div>
            {appliedDiscount && (
              <div className="w-full p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{appliedDiscount.code}</span>
                  <span>-{appliedDiscount.percentage}%</span>
                </div>
                {appliedDiscount.description && (
                  <div className="text-xs text-green-600 mt-1">
                    {appliedDiscount.description}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <hr className="border-gray-500/30 my-5" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-700">Subtotal</p>
            <p className="text-gray-700">{currency}{getCartAmount().toFixed(2)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-700">Costo de Envío</p>
            <p className="text-gray-700">Gratis</p>
          </div>
          {appliedDiscount && (
            <div className="flex items-center justify-between">
              <p className="text-gray-700">Descuento ({appliedDiscount.code})</p>
              <p className="text-green-600">-{currency}{discountAmount.toFixed(2)}</p>
            </div>
          )}
          <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
            <p>Total</p>
            <p>{currency}{totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <button
        onClick={createOrder}
        className="w-full bg-secondary-500 text-white py-3 rounded-md hover:bg-secondary-600 transition-colors"
      >
        Realizar Pedido
      </button>
    </div>
  );
};

export default OrderSummary;