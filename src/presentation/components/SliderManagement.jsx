'use client'
import React, { useState, useEffect } from 'react'
import { assets } from '@/src/assets/assets'
import Image from 'next/image'
import toast from 'react-hot-toast'
import Loading from '@/src/presentation/components/Loading'

const SliderManagement = () => {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSlide, setEditingSlide] = useState(null)
  const [newSlide, setNewSlide] = useState({
    title: '',
    offer: '',
    buttonText1: 'Comprar Ahora',
    buttonText2: 'Ver Más',
    buttonLink1: '',
    buttonLink2: '/all-products',
    imgSrc: ''
  })
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [selectedImageFor, setSelectedImageFor] = useState(null) // 'new' o slide.id
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [selectedProductFor, setSelectedProductFor] = useState(null)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Lista de imágenes disponibles de assets
  const availableImages = [
    { name: 'header_headphone_image', label: 'Auriculares Header' },
    { name: 'header_playstation_image', label: 'PlayStation Header' },
    { name: 'header_macbook_image', label: 'MacBook Header' },
    { name: 'projector_image', label: 'Proyector' },
    { name: 'girl_with_headphone_image', label: 'Chica con Auriculares' },
    { name: 'girl_with_earphone_image', label: 'Chica con Earphones' },
    { name: 'boy_with_tablet_image', label: 'Chico con Tablet' },
    { name: 'macbook_image', label: 'MacBook' },
    { name: 'bose_headphone_image', label: 'Bose Auriculares' },
    { name: 'apple_earphone_image', label: 'Apple Earphones' },
    { name: 'samsung_s23phone_image', label: 'Samsung S23' },
    { name: 'venu_watch_image', label: 'Venu Watch' },
    { name: 'cannon_camera_image', label: 'Canon Cámara' },
    { name: 'sony_airbuds_image', label: 'Sony Airbuds' },
    { name: 'asus_laptop_image', label: 'Asus Laptop' },
    { name: 'playstation_image', label: 'PlayStation' },
    { name: 'md_controller_image', label: 'Control MD' },
    { name: 'sm_controller_image', label: 'Control SM' },
    { name: 'jbl_soundbox_image', label: 'JBL Soundbox' },
    { name: 'boy_with_laptop_image', label: 'Chico con Laptop' },
  ]

  // Función para seleccionar imagen
  const selectImage = (imageName) => {
    if (selectedImageFor === 'new') {
      setNewSlide({...newSlide, imgSrc: imageName})
    } else if (editingSlide) {
      setEditingSlide({...editingSlide, imgSrc: imageName})
    }
    setShowImageSelector(false)
    setSelectedImageFor(null)
  }

  // Función para abrir selector de imagen
  const openImageSelector = (forWhat) => {
    setSelectedImageFor(forWhat)
    setShowImageSelector(true)
  }

  const openProductSelector = (forWhat) => {
    setSelectedProductFor(forWhat)
    setShowProductSelector(true)
  }

  const selectProduct = (productId) => {
    if (selectedProductFor === 'new') {
      setNewSlide({...newSlide, buttonLink1: productId})
    } else if (editingSlide) {
      setEditingSlide({...editingSlide, buttonLink1: productId})
    }
    setShowProductSelector(false)
    setSelectedProductFor(null)
  }

  const getProductName = (productId) => {
    if (!productId) return 'Sin producto seleccionado'
    const product = products.find(item => item._id === productId)
    return product ? product.name : productId
  }

  // Cargar slides actuales
  const fetchSlides = async () => {
    try {
      const response = await fetch('/api/header-slider/list')
      const data = await response.json()

      if (data.success) {
        const normalizedSlides = (data.slides || []).map(slide => ({
          ...slide,
          buttonLink1: slide.buttonLink1 || '',
          buttonLink2: slide.buttonLink2 || '/all-products'
        }))
        setSlides(normalizedSlides)
      } else {
        setSlides([])
        toast.error(data.message || 'Error al cargar slides')
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching slides:', error)
      setSlides([])
      toast.error('Error al cargar slides')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const timestamp = Date.now()
      const response = await fetch(`/api/product/list?t=${timestamp}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.products || [])
      } else {
        setProducts([])
        toast.error(data.message || 'Error al cargar productos')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
      toast.error('Error al cargar productos')
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Inicializar slider con datos por defecto
  const initializeSlider = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/header-slider/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchSlides() // Recargar slides
      } else {
        toast.error(data.message || 'Error al inicializar slider')
      }
    } catch (error) {
      console.error('Error initializing slider:', error)
      toast.error('Error al inicializar slider')
    } finally {
      setLoading(false)
    }
  }

  // Guardar cambios
  const saveSlides = async () => {
    try {
      let slidesToSave = slides

      if (editingSlide) {
        if (!editingSlide.title || !editingSlide.offer || !editingSlide.imgSrc) {
          toast.error('Completa todos los campos requeridos en el slide en edición')
          return
        }

        slidesToSave = slides.map(slide =>
          slide.id === editingSlide.id ? editingSlide : slide
        )
        setSlides(slidesToSave)
        setEditingSlide(null)
      }

      const response = await fetch('/api/header-slider/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slides: slidesToSave }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Slides guardados correctamente')
        fetchSlides() // Recargar para obtener datos actualizados
      } else {
        toast.error(data.message || 'Error al guardar slides')
      }
    } catch (error) {
      console.error('Error saving slides:', error)
      toast.error('Error al guardar slides')
    }
  }

  // Agregar nuevo slide
  const addSlide = () => {
    if (!newSlide.title || !newSlide.offer || !newSlide.imgSrc) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    const slide = {
      id: Date.now(),
      ...newSlide,
      buttonLink1: newSlide.buttonLink1 || '',
      buttonLink2: newSlide.buttonLink2 || '/all-products'
    }

    setSlides([...slides, slide])
    setNewSlide({
      title: '',
      offer: '',
      buttonText1: 'Comprar Ahora',
      buttonText2: 'Ver Más',
      buttonLink1: '',
      buttonLink2: '/all-products',
      imgSrc: ''
    })
    setShowAddForm(false)
    toast.success('Slide agregado')
  }

  // Eliminar slide
  const deleteSlide = (id) => {
    setSlides(slides.filter(slide => slide.id !== id))
    toast.success('Slide eliminado')
  }

  // Editar slide
  const startEdit = (slide) => {
    setEditingSlide({
      ...slide,
      buttonLink1: slide.buttonLink1 || '',
      buttonLink2: slide.buttonLink2 || '/all-products'
    })
  }

  const saveEdit = () => {
    if (!editingSlide.title || !editingSlide.offer || !editingSlide.imgSrc) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    setSlides(slides.map(slide =>
      slide.id === editingSlide.id ? editingSlide : slide
    ))
    setEditingSlide(null)
    toast.success('Slide actualizado')
  }

  // Cancelar edición
  const cancelEdit = () => {
    setEditingSlide(null)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? (
        <Loading />
      ) : (
        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Gestión del Slider</h1>
            <div className="flex gap-4">
              <button
                onClick={saveSlides}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-md hover:opacity-90 transition-colors min-w-[90px]"
                style={{backgroundColor: '#343b65'}}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-sm font-medium">Agregar Slide</span>
              </button>
            </div>
          </div>

          {/* Formulario para agregar nuevo slide */}
          {showAddForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border">
              <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Slide</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Título del slide"
                  value={newSlide.title}
                  onChange={(e) => setNewSlide({...newSlide, title: e.target.value})}
                  className="p-3 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Oferta/Subtítulo"
                  value={newSlide.offer}
                  onChange={(e) => setNewSlide({...newSlide, offer: e.target.value})}
                  className="p-3 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Texto botón 1"
                  value={newSlide.buttonText1}
                  onChange={(e) => setNewSlide({...newSlide, buttonText1: e.target.value})}
                  className="p-3 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Texto botón 2"
                  value={newSlide.buttonText2}
                  onChange={(e) => setNewSlide({...newSlide, buttonText2: e.target.value})}
                  className="p-3 border rounded-lg"
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => openProductSelector('new')}
                    className="p-3 border rounded-lg text-left hover:bg-gray-50 transition"
                  >
                    {newSlide.buttonLink1 ? `Producto: ${getProductName(newSlide.buttonLink1)}` : 'Elige el producto'}
                  </button>
                  {newSlide.buttonLink1 && (
                    <button
                      type="button"
                      onClick={() => setNewSlide({...newSlide, buttonLink1: ''})}
                      className="text-sm text-red-500 hover:text-red-600 self-start"
                    >
                      Quitar selección
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Enlace botón 2 (Ver Más)"
                  value={newSlide.buttonLink2}
                  onChange={(e) => setNewSlide({...newSlide, buttonLink2: e.target.value})}
                  className="p-3 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="URL de imagen o selecciona de assets"
                  value={newSlide.imgSrc}
                  onChange={(e) => setNewSlide({...newSlide, imgSrc: e.target.value})}
                  className="p-3 border rounded-lg md:col-span-2"
                />
                <button
                  type="button"
                  onClick={() => openImageSelector('new')}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 md:col-span-2"
                >
                  Seleccionar imagen de assets disponibles
                </button>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={addSlide}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de slides */}
          <div className="space-y-6">
            {slides.map((slide, index) => (
              <div key={slide.id} className="bg-white p-6 rounded-lg shadow-md border">
                {editingSlide && editingSlide.id === slide.id ? (
                  // Modo edición
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Editando Slide #{index + 1}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={editingSlide.title}
                        onChange={(e) => setEditingSlide({...editingSlide, title: e.target.value})}
                        className="p-3 border rounded-lg"
                        placeholder="Título del slide"
                      />
                      <input
                        type="text"
                        value={editingSlide.offer}
                        onChange={(e) => setEditingSlide({...editingSlide, offer: e.target.value})}
                        className="p-3 border rounded-lg"
                        placeholder="Oferta/Subtítulo"
                      />
                      <input
                        type="text"
                        value={editingSlide.buttonText1}
                        onChange={(e) => setEditingSlide({...editingSlide, buttonText1: e.target.value})}
                        className="p-3 border rounded-lg"
                        placeholder="Texto botón 1"
                      />
                      <input
                        type="text"
                        value={editingSlide.buttonText2}
                        onChange={(e) => setEditingSlide({...editingSlide, buttonText2: e.target.value})}
                        className="p-3 border rounded-lg"
                        placeholder="Texto botón 2"
                      />
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => openProductSelector(editingSlide.id)}
                          className="p-3 border rounded-lg text-left hover:bg-gray-50 transition"
                        >
                          {editingSlide.buttonLink1 ? `Producto: ${getProductName(editingSlide.buttonLink1)}` : 'Elige el producto'}
                        </button>
                        {editingSlide.buttonLink1 && (
                          <button
                            type="button"
                            onClick={() => setEditingSlide({...editingSlide, buttonLink1: ''})}
                            className="text-sm text-red-500 hover:text-red-600 self-start"
                          >
                            Quitar selección
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editingSlide.buttonLink2}
                        onChange={(e) => setEditingSlide({...editingSlide, buttonLink2: e.target.value})}
                        className="p-3 border rounded-lg"
                        placeholder="Enlace botón 2 (Ver Más)"
                      />
                      <input
                        type="text"
                        value={editingSlide.imgSrc}
                        onChange={(e) => setEditingSlide({...editingSlide, imgSrc: e.target.value})}
                        className="p-3 border rounded-lg md:col-span-2"
                        placeholder="URL de imagen o selecciona de assets"
                      />
                      <button
                        type="button"
                        onClick={() => openImageSelector(editingSlide.id)}
                        className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 md:col-span-2"
                      >
                        Seleccionar imagen de assets disponibles
                      </button>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={saveEdit}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Vista normal
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Image
                          src={typeof slide.imgSrc === 'string' && slide.imgSrc.startsWith('http') ? slide.imgSrc : assets[slide.imgSrc] || assets.header_headphone_image}
                          alt={`Slide ${index + 1}`}
                          width={40}
                          height={40}
                          className="object-contain"
                          onError={(e) => {
                            e.target.src = assets.header_headphone_image
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{slide.title}</h3>
                        <p className="text-gray-600 text-sm">{slide.offer}</p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {slide.buttonText1}
                          </span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {slide.buttonText2}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {slide.buttonLink1 ? `Producto: ${getProductName(slide.buttonLink1)}` : 'Sin producto asociado'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(slide)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-md hover:opacity-90 transition-colors min-w-[90px]"
                        style={{backgroundColor: '#69c2d0'}}
                        title="Editar slide"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span className="text-sm font-medium">Editar</span>
                      </button>
                      <button
                        onClick={() => deleteSlide(slide.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[110px]"
                        title="Eliminar slide"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span className="text-sm font-medium">Eliminar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {slides.length === 0 && !loading && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="mb-4">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay slides configurados</h3>
              <p className="text-gray-600 mb-6">El slider necesita ser inicializado con slides por defecto antes de poder editarlo.</p>
              <button
                onClick={initializeSlider}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Inicializar Slider con Datos por Defecto
              </button>
            </div>
          )}

          {/* Modal selector de imágenes */}
          {showImageSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-semibold mb-4">Seleccionar Imagen</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableImages.map((image) => (
                    <div
                      key={image.name}
                      onClick={() => selectImage(image.name)}
                      className="cursor-pointer border-2 border-gray-200 rounded-lg p-2 hover:border-secondary-500 transition-colors"
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                        <Image
                          src={assets[image.name] || assets.header_headphone_image}
                          alt={image.label}
                          width={80}
                          height={80}
                          className="object-contain"
                          onError={(e) => {
                            console.warn(`Image not found for ${image.name}, using fallback`)
                            e.target.src = assets.header_headphone_image
                          }}
                        />
                      </div>
                      <p className="text-xs text-center text-gray-600">{image.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowImageSelector(false)
                      setSelectedImageFor(null)
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {showProductSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto w-full">
                <h3 className="text-xl font-semibold mb-4">Seleccionar producto</h3>
                {loadingProducts ? (
                  <div className="py-10 text-center text-gray-500">Cargando productos...</div>
                ) : products.length === 0 ? (
                  <div className="py-10 text-center text-gray-500">No hay productos disponibles</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div
                      onClick={() => selectProduct('')}
                      className="cursor-pointer border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center hover:border-secondary-500 transition-colors"
                    >
                      <p className="text-sm text-gray-600">Sin producto</p>
                    </div>
                    {products.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => selectProduct(product._id)}
                        className="cursor-pointer border-2 border-gray-200 rounded-lg p-4 hover:border-secondary-500 transition-colors flex flex-col gap-3"
                      >
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          <Image
                            src={product.image?.[0] || assets.header_headphone_image}
                            alt={product.name}
                            width={200}
                            height={120}
                            className="object-contain"
                            onError={(e) => {
                              e.target.src = assets.header_headphone_image
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowProductSelector(false)
                      setSelectedProductFor(null)
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SliderManagement
