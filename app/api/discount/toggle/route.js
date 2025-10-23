import connectDB from '@/config/db'
import Discount from '@/src/domain/entities/Discount'
import { NextResponse } from 'next/server'

export async function PUT(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { id, isActive } = body

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID del descuento es requerido' })
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ success: false, message: 'El estado activo debe ser verdadero o falso' })
    }

    // Verificar que el descuento existe
    const discount = await Discount.findById(id)
    if (!discount) {
      return NextResponse.json({ success: false, message: 'Descuento no encontrado' })
    }

    // Actualizar estado
    const updatedDiscount = await Discount.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    )

    return NextResponse.json({
      success: true,
      message: `Descuento ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      discount: updatedDiscount
    })

  } catch (error) {
    console.error('Error toggling discount status:', error)
    return NextResponse.json({ success: false, message: error.message })
  }
}
