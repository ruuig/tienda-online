import connectDB from '@/config/db'
import Discount from '@/src/domain/entities/Discount'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    console.log('🔄 API: Iniciando carga de descuentos...')

    // Conectar a la base de datos con timeout
    console.log('🔌 API: Conectando a la base de datos...')
    await connectDB()
    console.log('✅ API: Conexión a BD establecida')

    // Obtener parámetros de consulta para filtrar por usuario
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    console.log('👤 API: Usuario ID:', userId)

    // Si se especifica userId, mostrar solo descuentos de ese usuario (para gestión personal)
    // Si no se especifica, mostrar todos los descuentos activos (para que todos los sellers vean todo)
    let query = { isActive: true } // Por defecto mostrar solo descuentos activos
    if (userId) {
      query.userId = userId
    }

    console.log('🔍 API: Query a ejecutar:', query)

    // Buscar descuentos sin límite de tiempo
    const discounts = await Discount.find(query).sort({ date: -1 })

    console.log('📦 API: Descuentos encontrados:', discounts?.length || 0)

    // Crear respuesta sin caché
    const response = NextResponse.json({ success: true, discounts })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    console.log('✅ API: Respuesta enviada exitosamente')
    return response

  } catch (error) {
    console.error('❌ API: Error en /api/discount/list:', error)

    // Mensaje genérico para evitar mostrar problemas de conexión
    return NextResponse.json({
      success: false,
      message: 'Error interno'
    }, { status: 500 })
  }
}
