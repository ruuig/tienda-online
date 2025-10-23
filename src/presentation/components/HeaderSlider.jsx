import React, { useState, useEffect, useRef } from "react";
import { assets } from "@/src/assets/assets";
import Image from "next/image";

const HeaderSlider = () => {
  const [sliderData, setSliderData] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef(null);

  // Función para convertir nombres de assets a URLs reales
  const getImageUrl = (imgSrc) => {
    // Si es un nombre de asset, obtener la URL real
    if (typeof imgSrc === 'string' && !imgSrc.startsWith('http') && !imgSrc.startsWith('/')) {
      return assets[imgSrc] || assets.header_headphone_image
    }
    return imgSrc
  }

  // Cargar datos del slider
  useEffect(() => {
    const fetchSliderData = async () => {
      try {
        const response = await fetch('/api/header-slider/list')
        const data = await response.json()

        if (data.success) {
          // Convertir nombres de assets a URLs reales
          const processedSlides = data.slides.map(slide => ({
            ...slide,
            imgSrc: getImageUrl(slide.imgSrc)
          }))
          setSliderData(processedSlides)
        } else {
          // Si falla la API, mostrar mensaje de error pero no cargar datos por defecto
          console.error('Error loading slider data:', data.message)
          setSliderData([])
        }
      } catch (error) {
        console.error('Error loading slider data:', error)
        // Si hay error de conexión, no mostrar datos por defecto
        setSliderData([])
      } finally {
        setLoading(false)
      }
    }

    fetchSliderData()
  }, [])

  useEffect(() => {
    // 🎬 AUTOPLAY CON PAUSA: Solo funciona cuando no está pausado
    // Si el usuario hace click en las bolitas, se pausa por 5 segundos
    if (sliderData.length > 0 && !isPaused) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliderData.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [sliderData.length, isPaused]);

  // Cleanup timeout cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);

    // 🎯 PAUSA DEL AUTOPLAY: Cuando el usuario hace click en una bolita,
    // el slider se pausa por 5 segundos para dar tiempo de ver el contenido
    setIsPaused(true);

    // Limpiar timeout anterior si existe (evitar memory leaks)
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }

    // Reanudar autoplay después de 5 segundos
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 5000);
  };

  if (loading || sliderData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-secondary-500 border-gray-200 mb-4"></div>
        <p className="text-gray-600">
          {loading ? 'Cargando slider...' : 'Slider no configurado'}
        </p>
        {!loading && (
          <p className="text-sm text-gray-500 mt-2">
            Ve a Gestión del Slider para configurar los slides
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-hidden relative w-full">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
        }}
      >
        {sliderData.map((slide, index) => (
          <div
            key={slide.id}
            className="flex flex-col-reverse md:flex-row items-center justify-between bg-gray-50 py-12 md:px-16 px-6 mt-6 rounded-xl min-w-full border border-gray-100"
          >
            <div className="md:pl-8 mt-10 md:mt-0">
              <p className="md:text-base text-secondary-500 font-medium pb-2">{slide.offer}</p>
              <h1 className="max-w-lg md:text-[42px] md:leading-[52px] text-3xl font-bold text-primary-800">
                {slide.title}
              </h1>
              <div className="flex items-center mt-6 md:mt-8 gap-4">
                <button className="px-10 py-3 bg-secondary-500 hover:bg-secondary-600 rounded-lg text-white font-medium transition-colors shadow-md hover:shadow-lg hover:shadow-secondary-100">
                  {slide.buttonText1}
                </button>
                <button className="group flex items-center gap-2 px-6 py-3 font-medium text-primary-700 hover:text-primary-800 transition-colors">
                  {slide.buttonText2}
                  <Image
                    className="group-hover:translate-x-1 transition-transform w-4 h-4"
                    src={assets.arrow_icon}
                    alt="arrow_icon"
                    style={{ filter: 'invert(28%) sepia(18%) saturate(1968%) hue-rotate(190deg) brightness(90%) contrast(92%)' }}
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center flex-1 justify-center relative h-64 md:h-80">
              <div className="absolute inset-0 bg-gradient-to-l from-primary-800/5 to-transparent rounded-xl"></div>
              <Image
                className="object-contain h-full w-auto"
                src={slide.imgSrc}
                alt={`Slide ${index + 1}`}
                width={400}
                height={400}
                priority
                onError={(e) => {
                  e.target.src = assets.header_headphone_image
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mt-8">
        {sliderData.map((_, index) => (
          <div
            key={index}
            onClick={() => handleSlideChange(index)}
            className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
              currentSlide === index
                ? isPaused
                  ? "bg-primary-500 w-8" // Indicador visual cuando está pausado
                  : "bg-secondary-500 w-6"
                : "bg-gray-300 hover:bg-gray-400 w-2"
            }`}
            title={isPaused ? "Autoplay pausado por 5 segundos" : "Click para pausar autoplay"}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default HeaderSlider;
