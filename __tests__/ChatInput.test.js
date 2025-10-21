/**
 * Test para verificar que el límite de caracteres funciona correctamente
 * aunque el indicador esté oculto
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import ChatInput from '../src/presentation/components/chat/ChatInput';

describe('ChatInput Character Limit', () => {
  test('should limit input to 1000 characters', () => {
    const mockOnChange = jest.fn();
    const mockOnSend = jest.fn();

    render(
      <ChatInput
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        disabled={false}
        placeholder="Test"
      />
    );

    const textarea = screen.getByPlaceholderText('Test');

    // Verificar que el textarea existe
    expect(textarea).toBeInTheDocument();

    // Verificar que tiene el límite de 1000 caracteres
    expect(textarea).toHaveAttribute('maxLength', '1000');

    // Verificar que el indicador de caracteres está oculto
    const characterCounter = screen.queryByText(/1000/);
    expect(characterCounter).toHaveClass('opacity-0');
  });

  test('should show character count when typing (but hidden)', () => {
    const mockOnChange = jest.fn();

    render(
      <ChatInput
        value="test"
        onChange={mockOnChange}
        onSend={() => {}}
        disabled={false}
        placeholder="Test"
      />
    );

    // El indicador existe pero está oculto
    const characterCounter = document.querySelector('.opacity-0');
    expect(characterCounter).toBeInTheDocument();
    expect(characterCounter).toHaveTextContent('4/1000');
  });
});
