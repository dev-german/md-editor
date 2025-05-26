import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AddTodoForm from './AddTodoForm';

describe('AddTodoForm component', () => {
  test('calls addTodo prop with input value when submitted', () => {
    const addTodoMock = jest.fn();
    render(<AddTodoForm addTodo={addTodoMock} />);
    const inputElement = screen.getByPlaceholderText(/Add new todo/i);
    const formElement = inputElement.closest('form'); // Or find button and click

    fireEvent.change(inputElement, { target: { value: 'Test new todo' } });
    fireEvent.submit(formElement); // Or fireEvent.click(buttonElement)

    expect(addTodoMock).toHaveBeenCalledWith('Test new todo');
  });

  test('clears input field after submission', () => {
    const addTodoMock = jest.fn();
    render(<AddTodoForm addTodo={addTodoMock} />);
    const inputElement = screen.getByPlaceholderText(/Add new todo/i);
    const formElement = inputElement.closest('form');

    fireEvent.change(inputElement, { target: { value: 'Test new todo' } });
    fireEvent.submit(formElement);

    expect(inputElement.value).toBe('');
  });
});
