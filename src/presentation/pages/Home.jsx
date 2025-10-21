'use client'
import React from "react";
import HeaderSlider from "@/src/presentation/components/HeaderSlider";
import HomeProducts from "@/src/presentation/components/HomeProducts";
import Banner from "@/src/presentation/components/Banner";
import NewsLetter from "@/src/presentation/components/NewsLetter";
import FeaturedProduct from "@/src/presentation/components/FeaturedProduct";
import Navbar from "@/src/presentation/components/Navbar";
import Footer from "@/src/presentation/components/Footer";
import { GetProductsUseCase } from '@/src/application/use-cases/productUseCases'
import { ProductRepositoryImpl } from '@/src/infrastructure/database/repositories'
import connectDB from '@/config/db'

const Home = async () => {
  // Obtener productos usando casos de uso
  await connectDB()
  const productRepository = new ProductRepositoryImpl()
  const getProductsUseCase = new GetProductsUseCase(productRepository)
  const result = await getProductsUseCase.execute()

  const products = result.success ? result.products.slice(0, 10) : []

  return (
    <>
      <Navbar/>
      <div className="px-6 md:px-16 lg:px-32">
        <HeaderSlider />
        <HomeProducts products={products} />
        <FeaturedProduct />
        <Banner />
        <NewsLetter />
      </div>
      <Footer />
    </>
  );
};

export default Home;
