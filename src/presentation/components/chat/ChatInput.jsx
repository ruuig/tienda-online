// Componente de input para el chat con límite de 1000 caracteres (oculto visualmente)
import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

const ChatInput = forwardRef(({
  value,
  onChange,
  onSend,
  onKeyDown,
  disabled = false,
  placeholder = "Escribe tu mensaje..."
}, ref) => {
  const textareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Exponer métodos al componente padre
  useImperativeHandle(ref, () => ({
    adjustHeight: adjustTextareaHeight,
    focus: () => textareaRef.current?.focus()
  }));

  // Ajustar altura del textarea automáticamente
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 40; // Altura mínima en píxeles
      const maxHeight = 100; // Altura máxima en píxeles

      // Si no hay contenido o es muy corto, usar altura mínima
      if (!value || value.length < 10) {
        textarea.style.height = minHeight + 'px';
      } else {
        // Si hay contenido, ajustar al scrollHeight pero con límites
        textarea.style.height = Math.min(Math.max(scrollHeight, minHeight), maxHeight) + 'px';
      }
    }
  };

  // Ajustar altura cuando cambie el valor
  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  // Ajustar altura inicial cuando se monte el componente
  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  const handleChange = (e) => {
    onChange(e.target.value);
    adjustTextareaHeight();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend();
  };

  const handleKeyPress = (e) => {
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-3">
      {/* Área de texto */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={1000}
          className={`w-full px-4 py-2 pr-12 border rounded-lg resize-none transition-all duration-200 ${
            isFocused
              ? 'border-[#69c2d0] ring-2 ring-[#69c2d0] ring-opacity-20'
              : 'border-gray-300 hover:border-gray-400'
          } ${
            disabled
              ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
              : 'bg-white text-gray-900'
          }`}
          rows={1}
          style={{ minHeight: '40px', maxHeight: '100px' }}
        />

        {/* Indicador de caracteres - oculto visualmente pero funcional */}
        {value.length > 0 && (
          <div className="absolute bottom-1 right-12 text-xs text-gray-400 opacity-0 pointer-events-none">
            {value.length}/1000
          </div>
        )}
      </div>

      {/* Botón de enviar */}
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className={`p-2.5 rounded-lg transition-all duration-200 self-stretch ${
          disabled || !value.trim()
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-[#343b65] hover:bg-[#2a2f52] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </form>
  );
});

export default ChatInput;
