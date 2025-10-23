import connectDB from '../config/db.js'
import Discount from '../src/domain/entities/Discount.js'

async function createTestDiscount() {
  try {
    console.log('🔄 Conectando a la base de datos...')
    await connectDB()
    console.log('✅ Conexión establecida')

    // Crear un descuento de prueba
    const testDiscount = {
      userId: 'test-user-id',
      code: 'BIENVENIDA10',
      percentage: 10,
      description: 'Descuento de bienvenida para nuevos clientes',
      isActive: true,
      maxUses: 100,
      usedCount: 0,
      applicableProducts: [],
      minPurchase: 0,
      date: Date.now()
    }

    console.log('💾 Creando descuento de prueba...')
    const discount = await Discount.create(testDiscount)
    console.log('✅ Descuento creado exitosamente:', discount)

    // Crear otro descuento de prueba
    const testDiscount2 = {
      userId: 'test-user-id',
      code: 'PRIMERACOMPRA',
      percentage: 15,
      description: '15% de descuento en tu primera compra',
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      maxUses: 50,
      usedCount: 0,
      applicableProducts: [],
      minPurchase: 100,
      date: Date.now()
    }

    const discount2 = await Discount.create(testDiscount2)
    console.log('✅ Segundo descuento creado:', discount2)

    console.log('🎉 ¡Descuentos de prueba creados exitosamente!')
    console.log('Códigos disponibles:')
    console.log('- BIENVENIDA10 (10% descuento)')
    console.log('- PRIMERACOMPRA (15% descuento, mínimo Q100)')

  } catch (error) {
    console.error('❌ Error creando descuentos de prueba:', error)
  } finally {
    process.exit(0)
  }
}

createTestDiscount()
