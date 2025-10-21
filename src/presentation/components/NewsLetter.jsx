import React from "react";

const NewsLetter = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2 pt-8 pb-14">
      <h1 className="md:text-4xl text-2xl font-medium">
        Suscríbete ahora y obtén 20% de descuento
      </h1>
      <p className="md:text-base text-gray-500/80 pb-8">
        Recibe ofertas exclusivas y mantente actualizado con nuestros últimos productos.
      </p>
      <div className="flex items-center justify-between max-w-2xl w-full md:h-14 h-12">
        <input
          className="border border-gray-500/30 rounded-md h-full border-r-0 outline-none w-full rounded-r-none px-3 text-gray-500"
          type="text"
          placeholder="Ingresa tu correo electrónico"
        />
        <button className="md:px-12 px-8 h-full text-white bg-secondary-500 hover:bg-secondary-600 rounded-md rounded-l-none transition-colors duration-300">
          Suscribirse
        </button>
      </div>
    </div>
  );
};

export default NewsLetter;
