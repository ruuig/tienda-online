import connectDB from '@/config/db'
import HeaderSlider from '@/src/domain/entities/HeaderSlider'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { slides } = await request.json()

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json({ success: false, message: 'Datos de slides inválidos' })
    }

    await connectDB()

    // Actualizar o crear configuración de slider
    const sliderConfig = await HeaderSlider.findOneAndUpdate(
      {},
      { slides },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    )

    return NextResponse.json({ success: true, message: 'Slides guardados correctamente' })

  } catch (error) {
    console.error('Error saving slider:', error)
    return NextResponse.json({ success: false, message: error.message })
  }
}
