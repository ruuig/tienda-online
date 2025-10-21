import connectDB from '@/config/db'
import HeaderSlider from '@/src/domain/entities/HeaderSlider'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    await connectDB()

    // Buscar configuración de slider
    const sliderConfig = await HeaderSlider.findOne({})

    if (!sliderConfig) {
      // Si no existe configuración, devolver array vacío
      // El usuario debe inicializar el slider primero
      return NextResponse.json({ success: true, slides: [] })
    }

    return NextResponse.json({ success: true, slides: sliderConfig.slides })

  } catch (error) {
    console.error('Error fetching slider:', error)
    return NextResponse.json({ success: false, message: error.message })
  }
}
