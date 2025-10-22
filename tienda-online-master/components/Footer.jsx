import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const Footer = () => {
  return (
    <footer>
      <div className="flex flex-col md:flex-row items-start justify-center px-6 md:px-16 lg:px-32 gap-10 py-14 border-b border-gray-500/30 text-gray-500">
        <div className="w-4/5">
          <Image className="w-28 md:w-32" src={assets.logo} alt="logo" />
          <p className="mt-6 text-sm">
            Tu tienda en línea de confianza con los mejores productos y ofertas exclusivas.
            Ofrecemos una experiencia de compra sencilla y segura para todos nuestros clientes.
            Creado por Rudy, Jan Carlos y Gerardo
          </p>
        </div>

        <div className="w-1/2 flex items-center justify-start md:justify-center">
          <div>
            <h2 className="font-medium text-gray-900 mb-5">Empresa</h2>
            <ul className="text-sm space-y-2">
              <li>
                <a className="hover:underline transition" href="#">Inicio</a>
              </li>
              <li>
                <a className="hover:underline transition" href="#">Nosotros</a>
              </li>
              <li>
                <a className="hover:underline transition" href="#">Contacto</a>
              </li>
              <li>
                <a className="hover:underline transition" href="#">Política de privacidad</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="w-1/2 flex items-start justify-start md:justify-center">
          <div>
            <h2 className="font-medium text-gray-900 mb-5">Contáctanos</h2>
            <div className="text-sm space-y-2">
              <p>+502 3696 7266</p>
              <p>+502 4002 6108</p>
              <p>+502 5712 0482</p>
              <p>rog.eleazar01@tienda.com</p>
              <p>jan.carlos@tienda.com</p>
              <p>gerardo@tienda.com</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;