import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TodoItem from './TodoItem';

describe('TodoItem component', () => {
  const mockTodo = { id: 1, text: 'Test Todo', completed: false };
  const toggleCompleteMock = jest.fn();
  const deleteTodoMock = jest.fn();

  test('renders todo text', () => {
    render(
      <TodoItem
        todo={mockTodo}
        toggleComplete={toggleCompleteMock}
        deleteTodo={deleteTodoMock}
      />
    );
    expect(screen.getByText('Test Todo')).toBeInTheDocument();
  });

  test('calls toggleComplete when checkbox is clicked', () => {
    render(
      <TodoItem
        todo={mockTodo}
        toggleComplete={toggleCompleteMock}
        deleteTodo={deleteTodoMock}
      />
    );
    const checkboxElement = screen.getByRole('checkbox');
    fireEvent.click(checkboxElement);
    expect(toggleCompleteMock).toHaveBeenCalledWith(mockTodo.id);
  });

  test('calls deleteTodo when delete button is clicked', () => {
    render(
      <TodoItem
        todo={mockTodo}
        toggleComplete={toggleCompleteMock}
        deleteTodo={deleteTodoMock}
      />
    );
    const deleteButtonElement = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtonElement);
    expect(deleteTodoMock).toHaveBeenCalledWith(mockTodo.id);
  });

  test('has "completed" class when todo is completed', () => {
    const completedTodo = { ...mockTodo, completed: true };
    render(
      <TodoItem
        todo={completedTodo}
        toggleComplete={toggleCompleteMock}
        deleteTodo={deleteTodoMock}
      />
    );
    const listItemElement = screen.getByText('Test Todo').closest('li');
    expect(listItemElement).toHaveClass('completed');
  });
});
