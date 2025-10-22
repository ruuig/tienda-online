'use client'
import React from 'react'
import Navbar from '@/src/presentation/components/Navbar'
import Footer from '@/src/presentation/components/Footer'
import { assets } from '@/src/assets/assets'
import Image from 'next/image'

const About = () => {
  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Sobre <span className="text-secondary-500">Nosotros</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Somos una tienda online especializada en tecnología y productos electrónicos,
              comprometidos con brindar la mejor experiencia de compra a nuestros clientes.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="bg-white p-8 rounded-lg shadow-md border">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Nuestra Misión</h3>
              <p className="text-gray-600">
                Proporcionar productos tecnológicos de alta calidad, servicio excepcional y precios competitivos,
                haciendo que la tecnología sea accesible para todos nuestros clientes.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md border">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Nuestra Visión</h3>
              <p className="text-gray-600">
                Ser la tienda online líder en tecnología en Guatemala, reconocida por nuestra innovación,
                calidad de productos y compromiso con la satisfacción del cliente.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Nuestros Valores</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Calidad</h3>
                <p className="text-gray-600">Ofrecemos solo productos de las mejores marcas y con garantía de calidad.</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Servicio al Cliente</h3>
                <p className="text-gray-600">Atención personalizada y soporte técnico especializado para todos nuestros clientes.</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Precios Competitivos</h3>
                <p className="text-gray-600">Los mejores precios del mercado con ofertas exclusivas y promociones especiales.</p>
              </div>
            </div>
          </div>

         {/* Team Section */}
<div className="bg-gray-50 rounded-lg p-8">
  <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Nuestro Equipo</h2>

  <div className="grid md:grid-cols-3 gap-8">
    {/* Rudy */}
    <div className="text-center">
      <div className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden border-4 border-secondary-100">
        <Image
          src="/team/rudy.jpg"
          alt="Rudy Eleazar Oloroso Gutierrez"
          width={224} height={224}
          className="w-full h-full object-cover"
          priority
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Rudy Eleazar Oloroso Gutierrez</h3>
      <p className="text-secondary-600 mb-2">CEO & Founder</p>
      <p className="text-gray-600 text-sm">
        Coordinador de la empresa y del grupo de trabajo.
      </p>
    </div>

    {/* Jan */}
    <div className="text-center">
      <div className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden border-4 border-secondary-100">
        <Image
          src="/team/jan.jpg"
          alt="Jan Carlos René Marcos"
          width={224} height={224}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Jan Carlos René Marcos</h3>
      <p className="text-secondary-600 mb-2">Director de estrategia comercial</p>
      <p className="text-gray-600 text-sm">
        Planificador de ventas, análisis del mercado y encargado de hacer tratos con proveedores.
      </p>
    </div>

    {/* Gerardo */}
    <div className="text-center">
      <div className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden border-4 border-secondary-100">
        <Image
          src="/team/gerardo.jpg"
          alt="Gerardo Waldemar García Vásquez"
          width={224} height={224}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Gerardo Waldemar García Vásquez</h3>
      <p className="text-secondary-600 mb-2">Director Técnico</p>
      <p className="text-gray-600 text-sm">
        Experto en tecnología e innovación, asegurando que ofrezcamos los últimos avances tecnológicos.
      </p>
    </div>
  </div>
</div>

        </div>
      </div>
      <Footer />
    </>
  )
}

export default About
