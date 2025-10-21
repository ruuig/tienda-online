import connectDB from '@/config/db'
import HeaderSlider from '@/models/HeaderSlider'
import { assets } from '@/src/assets/assets'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    await connectDB()

    // Datos por defecto del slider - estos se insertarán en la base de datos
    const defaultSlides = [
      {
        id: 1,
        title: "Experimenta Sonido Puro - ¡Tus Auriculares Perfectos te Esperan!",
        offer: "Oferta por Tiempo Limitado 30% de Descuento",
        buttonText1: "Comprar Ahora",
        buttonText2: "Ver Más",
        imgSrc: "header_headphone_image",
      },
      {
        id: 2,
        title: "El Juego de Próximo Nivel Comienza Aquí - ¡Descubre PlayStation 5 Hoy!",
        offer: "¡Date prisa, ¡quedan pocas unidades!",
        buttonText1: "Comprar Ahora",
        buttonText2: "Ver Ofertas",
        imgSrc: "header_playstation_image",
      },
      {
        id: 3,
        title: "Potencia y Elegancia - ¡El Apple MacBook Pro Llegó para Ti!",
        offer: "Oferta Exclusiva 40% de Descuento",
        buttonText1: "Ordenar Ahora",
        buttonText2: "Más Información",
        imgSrc: "header_macbook_image",
      },
      {
        id: 4,
        title: "Cine en Casa - Vive la Experiencia con Nuestro Proyector 4K",
        offer: "Oferta Especial: 35% de Descuento en Proyectores",
        buttonText1: "Ordenar Ahora",
        buttonText2: "Más Información",
        imgSrc: "projector_image",
      },
    ]

    // Crear configuración inicial del slider con los datos por defecto
    const sliderConfig = new HeaderSlider({
      slides: defaultSlides
    })

    await sliderConfig.save()

    return NextResponse.json({
      success: true,
      message: 'Slider inicializado correctamente con 4 slides por defecto',
      slidesCount: defaultSlides.length
    })

  } catch (error) {
    console.error('Error initializing slider:', error)
    return NextResponse.json({ success: false, message: error.message })
  }
}
