import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App component', () => {
  test('renders initial components (heading, form, empty list message)', () => {
    render(<App />);
    expect(screen.getByText(/My Todo List/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Add new todo/i)).toBeInTheDocument(); // From AddTodoForm
    expect(screen.getByText(/No todos yet!/i)).toBeInTheDocument(); // From TodoList
  });

  test('adds a new todo and displays it', () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText(/Add new todo/i);
    const addButton = screen.getByRole('button', { name: /Add Todo/i }); // Text from AddTodoForm button

    fireEvent.change(inputElement, { target: { value: 'A new task' } });
    fireEvent.click(addButton);

    expect(screen.getByText('A new task')).toBeInTheDocument();
    expect(screen.queryByText(/No todos yet!/i)).not.toBeInTheDocument(); // Message should disappear
  });

  test('toggles a todo completion status', () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText(/Add new todo/i);
    const addButton = screen.getByRole('button', { name: /Add Todo/i });

    fireEvent.change(inputElement, { target: { value: 'Task to toggle' } });
    fireEvent.click(addButton);

    const todoTextElement = screen.getByText('Task to toggle');
    const todoItemElement = todoTextElement.closest('li');
    const checkbox = screen.getByRole('checkbox'); // There's only one todo, so this is fine

    // Initial state: not completed
    expect(todoItemElement).not.toHaveClass('completed');
    expect(checkbox.checked).toBe(false);

    // Toggle to complete
    fireEvent.click(checkbox);
    expect(todoItemElement).toHaveClass('completed');
    expect(checkbox.checked).toBe(true);

    // Toggle back to not completed
    fireEvent.click(checkbox);
    expect(todoItemElement).not.toHaveClass('completed');
    expect(checkbox.checked).toBe(false);
  });

  test('deletes a todo', () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText(/Add new todo/i);
    const addButton = screen.getByRole('button', { name: /Add Todo/i });

    fireEvent.change(inputElement, { target: { value: 'Task to delete' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Task to delete')).toBeInTheDocument();

    const deleteButton = screen.getByRole('button', { name: /Delete/i }); // From TodoItem
    fireEvent.click(deleteButton);

    expect(screen.queryByText('Task to delete')).not.toBeInTheDocument();
    expect(screen.getByText(/No todos yet!/i)).toBeInTheDocument(); // List should be empty again
  });
});
