import connectDB from '@/config/db'
import Discount from '@/src/domain/entities/Discount'
import { NextResponse } from 'next/server'

export async function DELETE(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID del descuento es requerido' })
    }

    // Verificar que el descuento existe
    const discount = await Discount.findById(id)
    if (!discount) {
      return NextResponse.json({ success: false, message: 'Descuento no encontrado' })
    }

    // Eliminar descuento
    await Discount.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Código de descuento eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting discount:', error)
    return NextResponse.json({ success: false, message: error.message })
  }
}
