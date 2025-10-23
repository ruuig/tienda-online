'use client'
import React, { useState, useEffect } from 'react'
import Navbar from '@/src/presentation/components/Navbar'
import Footer from '@/src/presentation/components/Footer'
import { assets } from '@/src/assets/assets'
import Image from 'next/image'
import toast from 'react-hot-toast'
// ❌ quitamos: import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Enviar al endpoint /api/contact
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (!res.ok || !data.ok) throw new Error(data.error || 'Error al enviar')

      toast.success('Mensaje enviado correctamente. ¡Gracias por contactarnos!')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      toast.error('Error al enviar el mensaje: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 🗺️ Inicializar Leaflet SOLO en cliente para evitar "window is not defined"
  useEffect(() => {
    let map
    const init = async () => {
      if (typeof window === 'undefined') return
      const { default: L } = await import('leaflet')

      const lat = 14.796436
      const lng = -89.546711
      map = L.map('map').setView([lat, lng], 16)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
      }).addTo(map)

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup('<b>RJG Tech Shop</b><br>Ubicación: Parque El Calvario, Chiquimula.')
        .openPopup()
    }

    init()
    return () => { if (map) map.remove() }
  }, [])

  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Contácta<span className="text-secondary-500">nos</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              ¿Tienes preguntas sobre nuestros productos o necesitas ayuda?
              Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos lo antes posible.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white p-8 rounded-lg shadow-md border">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Envíanos un Mensaje</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="¿En qué podemos ayudarte?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent resize-none"
                    placeholder="Describe tu consulta o comentario..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-secondary-500 text-white py-3 px-6 rounded-md hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Contact Info Cards */}
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Información de Contacto</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Dirección</h4>
                      <p className="text-gray-600">Parque El Calvario, Chiquimula</p>
                      <p className="text-gray-600">Guatemala, C.A.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Teléfonos</h4>
                      <p className="text-gray-600">+502 5712-0482</p>
                      <p className="text-gray-600">+502 4002-6108</p>
                      <p className="text-gray-600">+502 3696-7266</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Email</h4>
                      <p className="text-gray-600">soporterjgtechshop@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Horario de Atención</h4>
                      <p className="text-gray-600">Lunes - Viernes: 8:00 AM - 6:00 PM</p>
                      <p className="text-gray-600">Sábados: 9:00 AM - 4:00 PM</p>
                      <p className="text-gray-600">Domingos: Cerrado</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mapa Leaflet */}
              <div className="mt-8 relative z-0">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Ubicación</h3>
                <div id="map" className="bg-gray-200 rounded-lg" style={{ height: 192 }}></div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 bg-gray-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Preguntas Frecuentes</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Cómo puedo hacer un pedido?</h3>
                <p className="text-gray-600">Puedes hacer tu pedido directamente desde nuestra tienda online. Agrega productos al carrito, selecciona tu dirección de envío y completa el pago de forma segura.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Cuáles son los métodos de pago?</h3>
                <p className="text-gray-600">Aceptamos tarjetas de crédito, débito, transferencias bancarias y pagos en efectivo contra entrega en algunos casos.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Cuánto tiempo tarda la entrega?</h3>
                <p className="text-gray-600">Los pedidos suelen entregarse en 2-3 días hábiles dentro de la ciudad capital y 3-5 días en el interior del país.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Tienen garantía los productos?</h3>
                <p className="text-gray-600">Sí, todos nuestros productos tienen garantía del fabricante. El tiempo varía según el producto, desde 6 meses hasta 2 años.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Contact
