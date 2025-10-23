# Configuración del Proyecto - Tienda Online

## Problema: "Tiempo de espera agotado" al cargar descuentos

Este error ocurre cuando la aplicación no puede conectar a la base de datos MongoDB. Sigue estos pasos para solucionarlo:

### 1. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Configuración de MongoDB
MONGODB_URI=mongodb://localhost:27017/quickcart

# O si usas MongoDB Atlas (recomendado para producción):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickcart

# Configuración de Clerk (opcional para pruebas)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_demo
CLERK_SECRET_KEY=sk_test_demo

# Configuración del servidor
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Instalar MongoDB (si usas local)

**Opción A: MongoDB Atlas (Recomendado)**
1. Ve a [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crea una cuenta gratuita
3. Crea un cluster gratuito
4. Obtén tu connection string y reemplázala en `MONGODB_URI`

**Opción B: MongoDB Local**
1. Descarga MongoDB desde [mongodb.com](https://www.mongodb.com/try/download/community)
2. Instala MongoDB en tu sistema
3. Asegúrate de que MongoDB esté ejecutándose en `mongodb://localhost:27017`

### 3. Crear descuentos de prueba

Una vez que MongoDB esté configurado, ejecuta:

```bash
node scripts/create-test-discounts.js
```

Esto creará descuentos de prueba que puedes usar para probar la funcionalidad.

### 4. Iniciar el servidor

```bash
npm run dev
```

### 5. Verificar la conexión

Si aún tienes problemas, verifica la consola del servidor para ver mensajes de error específicos:

- `❌ MongoDB connection error` - Problema con la URI o MongoDB no está ejecutándose
- `✅ MongoDB connected successfully` - Conexión exitosa
- `⏰ Database query timeout` - La consulta está tardando demasiado

### Soluciones adicionales:

1. **Reinicia MongoDB**: Si usas local, reinicia el servicio de MongoDB
2. **Verifica la URI**: Asegúrate de que la `MONGODB_URI` sea correcta
3. **Prueba la conexión**: Ejecuta `scripts/create-test-discounts.js` para verificar que la BD funciona
4. **Revisa el firewall**: Asegúrate de que MongoDB no esté bloqueado por el firewall

### Códigos de descuento de prueba:
- `BIENVENIDA10` - 10% de descuento
- `PRIMERACOMPRA` - 15% de descuento (mínimo Q100)

¡Con estos pasos deberías poder resolver el problema del timeout!
