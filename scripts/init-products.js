#!/usr/bin/env node

// Script para inicializar productos de prueba
// Ejecutar: node scripts/init-products.js

import connectDB from '../src/infrastructure/database/db.js';
import { Product } from '../src/domain/entities/index.js';

const sampleProducts = [
    {
        userId: 'system',
        name: 'iPhone 15 Pro',
        description: 'El smartphone más avanzado de Apple con chip A17 Pro y cámara profesional de 48MP',
        price: 9500,
        offerPrice: 8500,
        image: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500'],
        category: 'smartphone',
        date: Date.now()
    },
    {
        userId: 'system',
        name: 'MacBook Pro M3',
        description: 'Laptop profesional con chip M3, pantalla Liquid Retina XDR de 14 pulgadas',
        price: 25000,
        offerPrice: 22000,
        image: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500'],
        category: 'laptop',
        date: Date.now()
    },
    {
        userId: 'system',
        name: 'AirPods Pro 2',
        description: 'Audífonos inalámbricos con cancelación activa de ruido y audio espacial',
        price: 2500,
        offerPrice: 2200,
        image: ['https://images.unsplash.com/photo-1606220945770-b5b6c2c01bf7?w=500'],
        category: 'earphone',
        date: Date.now()
    },
    {
        userId: 'system',
        name: 'Apple Watch Series 9',
        description: 'Reloj inteligente con GPS, monitor de salud y más de 18 horas de batería',
        price: 4500,
        offerPrice: 4000,
        image: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500'],
        category: 'watch',
        date: Date.now()
    },
    {
        userId: 'system',
        name: 'iPad Air 5',
        description: 'Tablet con chip M1, pantalla Liquid Retina de 10.9 pulgadas y compatibilidad con Apple Pencil',
        price: 6500,
        offerPrice: 6000,
        image: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500'],
        category: 'tablet',
        date: Date.now()
    },
    {
        userId: 'system',
        name: 'Sony WH-1000XM5',
        description: 'Audífonos over-ear con cancelación de ruido líder en la industria',
        price: 3500,
        offerPrice: 3200,
        image: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500'],
        category: 'headphone',
        date: Date.now()
    },
    {
        userId: 'system',
        name: 'PlayStation 5',
        description: 'Consola de videojuegos de última generación con gráficos 4K y ray tracing',
        price: 5000,
        offerPrice: 4800,
        image: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500'],
        category: 'console',
        date: Date.now()
    },
    {
        userId: 'system',
        name: 'Canon EOS R5',
        description: 'Cámara mirrorless profesional con sensor full-frame de 45MP y video 8K',
        price: 35000,
        offerPrice: 32000,
        image: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500'],
        category: 'camera',
        date: Date.now()
    },
    {
        userId: 'system',
        name: 'Magic Keyboard',
        description: 'Teclado inalámbrico con batería recargable y diseño flotante',
        price: 1200,
        offerPrice: 1000,
        image: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'],
        category: 'accessories',
        date: Date.now()
    },
    {
        userId: 'system',
        name: 'Nintendo Switch OLED',
        description: 'Consola híbrida con pantalla OLED de 7 pulgadas y 64GB de almacenamiento',
        price: 3500,
        offerPrice: 3200,
        image: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500'],
        category: 'console',
        date: Date.now()
    }
];

async function initProducts() {
    try {
        console.log('🛍️ Inicializando productos de prueba...');

        await connectDB();

        // Insertar productos de prueba
        const insertedProducts = [];
        for (const productData of sampleProducts) {
            const existingProduct = await Product.findOne({ name: productData.name });
            if (!existingProduct) {
                const product = await Product.create(productData);
                insertedProducts.push(product);
                console.log(`✅ Producto creado: ${productData.name} (${productData.category})`);
            } else {
                console.log(`⚡ Producto ya existe: ${productData.name}`);
            }
        }

        console.log(`🎉 ¡${insertedProducts.length} productos de prueba insertados exitosamente!`);
        console.log('\n📋 Categorías disponibles:');
        const categories = [...new Set(sampleProducts.map(p => p.category))];
        categories.forEach(cat => console.log(`   • ${cat}`));

        console.log('\n🔧 Los filtros de categoría ahora deberían funcionar correctamente');
        console.log('   Visita: http://localhost:3000/all-products');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error inicializando productos:', error);
        process.exit(1);
    }
}

// Ejecutar inicialización
initProducts();
