import connectDB from '@/config/db'
import Discount from '@/src/domain/entities/Discount'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    await connectDB()

    // Obtener parámetros de consulta para filtrar por usuario
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    let query = {}
    if (userId) {
      query.userId = userId
    }

    // Buscar descuentos
    const discounts = await Discount.find(query).sort({ date: -1 })

    // Crear respuesta sin caché
    const response = NextResponse.json({ success: true, discounts })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error) {
    console.error('Error fetching discounts:', error)
    return NextResponse.json({ success: false, message: error.message })
  }
}
