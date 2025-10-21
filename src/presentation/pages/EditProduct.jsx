'use client'
import React, { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import toast from "react-hot-toast";
import Loading from "@/src/presentation/components/Loading";
import { GetProductByIdUseCase } from '@/src/application/use-cases/productUseCases'
import { ProductRepositoryImpl } from '@/src/infrastructure/database/repositories'
import connectDB from '@/config/db'

const EditProduct = ({ params }) => {
  const productId = params.id

  const [files, setFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Earphone');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Cargar los datos del producto
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        await connectDB()
        const productRepository = new ProductRepositoryImpl()
        const getProductByIdUseCase = new GetProductByIdUseCase(productRepository)
        const result = await getProductByIdUseCase.execute(productId)

        if (result.success) {
          const product = result.product
          setName(product.name)
          setDescription(product.description)
          setCategory(product.category)
          setPrice(product.price.toString())
          setOfferPrice(product.offerPrice.toString())
          setExistingImages(product.image)
          setLoading(false)
        } else {
          toast.error(result.message)
          window.location.href = '/seller/product-list'
        }
      } catch (error) {
        toast.error('Error al cargar el producto')
        window.location.href = '/seller/product-list'
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Aquí iría la lógica para actualizar producto usando casos de uso
      // Por simplicidad, simulamos el proceso

      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Producto actualizado correctamente');
      window.location.href = '/seller/product-list';

    } catch (error) {
      toast.error('Error al actualizar el producto');
      console.error('Error updating product:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const removeExistingImage = (index) => {
    const updatedImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(updatedImages);
  };

  return (
    <div className="w-full flex-1 flex justify-center items-center">
      {loading ? <Loading /> : (
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-lg mx-auto">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => window.location.href = '/seller/product-list'}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">Editar Producto</h1>
        </div>

        <div>
          <p className="text-base font-medium mb-2">Imágenes Actuales</p>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {existingImages.map((imageUrl, index) => (
              <div key={index} className="relative">
                <Image
                  src={imageUrl}
                  alt={`Imagen ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
                  width={96}
                  height={96}
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Eliminar imagen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <p className="text-base font-medium mb-2">Agregar Nuevas Imágenes</p>
          <p className="text-sm text-gray-500 mb-3">Puedes agregar hasta 4 imágenes nuevas</p>
          <div className="flex flex-wrap items-center gap-3">
            {[...Array(4)].map((_, index) => (
              <label key={index} htmlFor={`image${index}`} className="relative cursor-pointer">
                <input
                  onChange={(e) => {
                    const updatedFiles = [...files];
                    updatedFiles[index] = e.target.files[0];
                    setFiles(updatedFiles);
                  }}
                  type="file"
                  id={`image${index}`}
                  hidden
                  accept="image/*"
                />
                <Image
                  className="w-24 h-24 object-cover rounded-lg border-2 border-dashed border-gray-300 hover:border-secondary-500 transition-colors"
                  src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
                  alt=""
                  width={96}
                  height={96}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-name">
            Nombre del Producto
          </label>
          <input
            id="product-name"
            type="text"
            placeholder="Escribe aquí"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
        </div>

        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-description">
            Descripción del Producto
          </label>
          <textarea
            id="product-description"
            rows={4}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
            placeholder="Escribe aquí"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
          />
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="category">
              Categoría
            </label>
            <select
              id="category"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setCategory(e.target.value)}
              value={category}
            >
              <option value="Earphone">Audífonos</option>
              <option value="Headphone">Auriculares</option>
              <option value="Watch">Relojes</option>
              <option value="Smartphone">Teléfonos</option>
              <option value="Laptop">Laptops</option>
              <option value="Camera">Cámaras</option>
              <option value="Accessories">Accesorios</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="product-price">
              Precio
            </label>
            <input
              id="product-price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setPrice(e.target.value)}
              value={price}
              required
            />
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="offer-price">
              Precio de Oferta
            </label>
            <input
              id="offer-price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setOfferPrice(e.target.value)}
              value={offerPrice}
              required
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 bg-secondary-500 text-white font-medium rounded hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
          </button>

          <button
            type="button"
            onClick={() => window.location.href = '/seller/product-list'}
            className="px-8 py-2.5 bg-gray-500 text-white font-medium rounded hover:bg-gray-600 transition-colors"
          >
            CANCELAR
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

export default EditProduct;
