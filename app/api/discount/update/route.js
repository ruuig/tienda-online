import connectDB from '@/config/db'
import Discount from '@/src/domain/entities/Discount'
import { NextResponse } from 'next/server'

export async function PUT(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { id, code, percentage, description, startDate, endDate, maxUses, applicableProducts, minPurchase, isActive } = body

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID del descuento es requerido' })
    }

    // Verificar que el descuento existe
    const existingDiscount = await Discount.findById(id)
    if (!existingDiscount) {
      return NextResponse.json({ success: false, message: 'Descuento no encontrado' })
    }

    // Si se está cambiando el código, verificar que no exista ya
    if (code && code !== existingDiscount.code) {
      const codeExists = await Discount.findOne({
        code: code.toUpperCase(),
        _id: { $ne: id }
      })
      if (codeExists) {
        return NextResponse.json({ success: false, message: 'Ya existe un código de descuento con ese nombre' })
      }
    }

    // Actualizar descuento
    const updateData = {
      ...(code && { code: code.toUpperCase() }),
      ...(percentage !== undefined && { percentage }),
      ...(description !== undefined && { description }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(maxUses !== undefined && { maxUses }),
      ...(applicableProducts !== undefined && { applicableProducts }),
      ...(minPurchase !== undefined && { minPurchase }),
      ...(isActive !== undefined && { isActive })
    }

    const discount = await Discount.findByIdAndUpdate(id, updateData, { new: true })

    return NextResponse.json({
      success: true,
      message: 'Código de descuento actualizado exitosamente',
      discount
    })

  } catch (error) {
    console.error('Error updating discount:', error)
    return NextResponse.json({ success: false, message: error.message })
  }
}
