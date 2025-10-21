'use client'
import React from "react";
import HeaderSlider from "@/src/presentation/components/HeaderSlider";
import HomeProducts from "@/src/presentation/components/HomeProducts";
import Banner from "@/src/presentation/components/Banner";
import NewsLetter from "@/src/presentation/components/NewsLetter";
import FeaturedProduct from "@/src/presentation/components/FeaturedProduct";
import Navbar from "@/src/presentation/components/Navbar";
import Footer from "@/src/presentation/components/Footer";

const Home = () => {
  return (
    <>
      <Navbar/>
      <div className="px-6 md:px-16 lg:px-32">
        <HeaderSlider />
        <HomeProducts />
        <FeaturedProduct />
        <Banner />
        <NewsLetter />
      </div>
      <Footer />
    </>
  );
};

export default Home;
