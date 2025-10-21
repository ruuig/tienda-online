'use client'
import { useEffect, useState } from 'react'

export default function InitializeSlider() {
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const initializeSlider = async () => {
      try {
        const response = await fetch('/api/header-slider/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (response.ok) {
          const data = await response.json()
          setStatus('success')
          setMessage('Slider inicializado correctamente')
        } else {
          const errorData = await response.json()
          setStatus('error')
          setMessage('Error: ' + errorData.message)
        }
      } catch (error) {
        setStatus('error')
        setMessage('Error al conectar con el servidor')
        console.error('Error:', error)
      }
    }

    initializeSlider()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-secondary-500 border-gray-200 mx-auto mb-4"></div>
            <p>Inicializando slider...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-green-600 font-medium">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <p className="text-red-600 font-medium">{message}</p>
          </>
        )}

        <div className="mt-6">
          <button
            onClick={() => window.location.href = '/seller/slider-management'}
            className="px-6 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 transition-colors"
          >
            Ir a Gestión del Slider
          </button>
        </div>
      </div>
    </div>
  )
}
