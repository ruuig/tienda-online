"use client"
import { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import ProductCard from "@/src/presentation/components/ProductCard";
import Navbar from "@/src/presentation/components/Navbar";
import Footer from "@/src/presentation/components/Footer";
import Image from "next/image";
import { useParams } from "next/navigation";
import Loading from "@/src/presentation/components/Loading";
import { formatCurrency } from '@/src/shared/utils';
import { GetProductByIdUseCase } from '@/src/application/use-cases/productUseCases'
import { ProductRepositoryImpl } from '@/src/infrastructure/database/repositories'
import connectDB from '@/config/db'

const Product = () => {
    const { id } = useParams();
    const [mainImage, setMainImage] = useState(null);
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState([]);

    const fetchProductData = async () => {
        try {
            await connectDB()
            const productRepository = new ProductRepositoryImpl()
            const getProductByIdUseCase = new GetProductByIdUseCase(productRepository)
            const result = await getProductByIdUseCase.execute(id)

            if (result.success) {
                setProductData(result.product);
                setMainImage(result.product.image[0]);

                // Obtener productos relacionados (mismo categoría, excluyendo el actual)
                const productRepository2 = new ProductRepositoryImpl()
                const getProductsUseCase = new GetProductsUseCase(productRepository2)
                const allProductsResult = await getProductsUseCase.execute()

                if (allProductsResult.success) {
                    const related = allProductsResult.products
                        .filter(p => p.category === result.product.category && p._id !== id)
                        .slice(0, 5);
                    setRelatedProducts(related);
                }
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (id) {
            fetchProductData();
        }
    }, [id])

    const handleAddToCart = (productId) => {
        // Aquí iría la lógica para agregar al carrito usando casos de uso
        console.log('Agregar al carrito:', productId);
    }

    if (loading) {
        return <Loading />
    }

    if (!productData) {
        return (
            <>
                <Navbar />
                <div className="px-6 md:px-16 lg:px-32 py-16">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">Producto no encontrado</h1>
                        <p className="text-gray-600">El producto que buscas no existe o ha sido eliminado.</p>
                    </div>
                </div>
                <Footer />
            </>
        )
    }

    return (
        <>
            <Navbar />
            <div className="px-6 md:px-16 lg:px-32 pt-14 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="px-5 lg:px-16 xl:px-20">
                        <div className="rounded-lg overflow-hidden bg-gray-500/10 mb-4">
                            <Image
                                src={mainImage || productData.image[0]}
                                alt={productData.name}
                                className="w-full h-auto object-cover mix-blend-multiply"
                                width={1280}
                                height={720}
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {productData.image.map((image, index) => (
                                <div
                                    key={index}
                                    onClick={() => setMainImage(image)}
                                    className="cursor-pointer rounded-lg overflow-hidden bg-gray-500/10"
                                >
                                    <Image
                                        src={image}
                                        alt={`${productData.name} ${index + 1}`}
                                        className="w-full h-auto object-cover mix-blend-multiply"
                                        width={1280}
                                        height={720}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <h1 className="text-3xl font-medium text-gray-800/90 mb-4">
                            {productData.name}
                        </h1>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                                <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                                <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                                <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                                <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                                <Image
                                    className="h-4 w-4"
                                    src={assets.star_dull_icon}
                                    alt="star_dull_icon"
                                />
                            </div>
                            <p>(4.5)</p>
                        </div>
                        <p className="text-gray-600 mt-3">
                            {productData.description}
                        </p>
                        <p className="text-3xl font-medium mt-6">
                            {formatCurrency(productData.offerPrice)}
                            <span className="text-base font-normal text-gray-800/60 line-through ml-2">
                                {formatCurrency(productData.price)}
                            </span>
                        </p>
                        <hr className="bg-gray-600 my-6" />
                        <div className="overflow-x-auto">
                            <table className="table-auto border-collapse w-full max-w-72">
                                <tbody>
                                    <tr>
                                        <td className="text-gray-600 font-medium">Marca</td>
                                        <td className="text-gray-800/50 ">Generic</td>
                                    </tr>
                                    <tr>
                                        <td className="text-gray-600 font-medium">Color</td>
                                        <td className="text-gray-800/50 ">Multi</td>
                                    </tr>
                                    <tr>
                                        <td className="text-gray-600 font-medium">Categoría</td>
                                        <td className="text-gray-800/50">
                                            {productData.category}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center mt-10 gap-4">
                            <button
                                onClick={() => handleAddToCart(productData._id)}
                                className="w-full py-3.5 bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition"
                            >
                                Agregar al Carrito
                            </button>
                            <button
                                onClick={() => { handleAddToCart(productData._id); window.location.href = '/cart'; }}
                                className="w-full py-3.5 bg-secondary-500 text-white hover:bg-secondary-600 transition"
                            >
                                Comprar ahora
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <div className="flex flex-col items-center mb-4 mt-16">
                        <p className="text-3xl font-medium">Productos <span className="font-medium text-secondary-500">Relacionados</span></p>
                        <div className="w-28 h-0.5 bg-secondary-500 mt-2"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
                        {relatedProducts.map((product, index) => (
                            <ProductCard
                                key={product._id || index}
                                product={product}
                                onAddToCart={handleAddToCart}
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => window.location.href = '/all-products'}
                        className="px-8 py-2 mb-16 border rounded text-gray-500/70 hover:bg-slate-50/90 transition"
                    >
                        Ver más
                    </button>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Product;
