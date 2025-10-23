import connectDB from '../config/db.js'

async function testConnection() {
  try {
    console.log('🔄 Probando conexión a MongoDB...')
    console.log('📍 URI:', process.env.MONGODB_URI)

    const conn = await connectDB()
    console.log('✅ Conexión exitosa a MongoDB!')
    console.log('📊 Base de datos:', conn.connection.name)
    console.log('🌐 Host:', conn.connection.host)

    // Verificar si podemos hacer consultas
    console.log('🔍 Verificando acceso a colecciones...')

    // Listar colecciones disponibles
    const collections = await conn.connection.db.listCollections().toArray()
    console.log('📋 Colecciones disponibles:', collections.map(c => c.name))

    console.log('🎉 ¡Todo está funcionando correctamente!')

  } catch (error) {
    console.error('❌ Error de conexión:', error.message)

    if (error.message.includes('authentication failed')) {
      console.log('💡 Solución: Verifica las credenciales de MongoDB')
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.log('💡 Solución: Verifica que la URI de MongoDB sea correcta')
    } else if (error.message.includes('connection timed out')) {
      console.log('💡 Solución: Verifica que MongoDB esté ejecutándose y sea accesible')
    }

    console.log('📖 Consulta DISCOUNT_FIX_README.md para más ayuda')
  } finally {
    process.exit(0)
  }
}

testConnection()
