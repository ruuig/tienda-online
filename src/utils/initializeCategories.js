import connectDB from '@/config/db'
import { CategoryRepositoryImpl } from '@/src/infrastructure/database/repositories'
import { CreateCategoryUseCase } from '@/src/application/use-cases/categoryUseCases'

const defaultCategories = [
  { name: 'Electrónicos', description: 'Productos electrónicos y tecnología' },
  { name: 'Ropa', description: 'Ropa y accesorios de moda' },
  { name: 'Hogar', description: 'Artículos para el hogar y decoración' },
  { name: 'Deportes', description: 'Equipo deportivo y fitness' },
  { name: 'Libros', description: 'Libros y material educativo' },
  { name: 'Belleza', description: 'Productos de belleza y cuidado personal' },
  { name: 'Automotriz', description: 'Accesorios y partes automotrices' },
  { name: 'Juguetes', description: 'Juguetes y juegos para niños' }
];

export async function initializeDefaultCategories(userId) {
  try {
    await connectDB();

    const categoryRepository = new CategoryRepositoryImpl();
    const createCategoryUseCase = new CreateCategoryUseCase(categoryRepository);

    console.log('🚀 Inicializando categorías por defecto...');

    for (const categoryData of defaultCategories) {
      try {
        // Verificar si ya existe la categoría
        const existingCategory = await categoryRepository.findByName(categoryData.name);

        if (!existingCategory) {
          const result = await createCategoryUseCase.execute(userId, categoryData);

          if (result.success) {
            console.log(`✅ Categoría creada: ${categoryData.name}`);
          } else {
            console.log(`❌ Error creando categoría ${categoryData.name}: ${result.message}`);
          }
        } else {
          console.log(`ℹ️ Categoría ya existe: ${categoryData.name}`);
        }
      } catch (error) {
        console.error(`❌ Error procesando categoría ${categoryData.name}:`, error);
      }
    }

    console.log('🎉 Inicialización de categorías completada');
  } catch (error) {
    console.error('❌ Error inicializando categorías:', error);
  }
}
