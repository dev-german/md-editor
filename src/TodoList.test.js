import React from 'react';
import { render, screen } from '@testing-library/react';
import TodoList from './TodoList';

// Mock TodoItem to prevent rendering its internals and focus on TodoList logic
jest.mock('./TodoItem', () => (props) => <li data-testid="todo-item">{props.todo.text}</li>);

describe('TodoList component', () => {
  const toggleCompleteMock = jest.fn();
  const deleteTodoMock = jest.fn();

  test('renders "No todos yet!" when todos array is empty', () => {
    render(
      <TodoList
        todos={[]}
        toggleComplete={toggleCompleteMock}
        deleteTodo={deleteTodoMock}
      />
    );
    expect(screen.getByText('No todos yet!')).toBeInTheDocument();
  });

  test('renders correct number of TodoItem components', () => {
    const mockTodos = [
      { id: 1, text: 'Todo 1', completed: false },
      { id: 2, text: 'Todo 2', completed: true },
    ];
    render(
      <TodoList
        todos={mockTodos}
        toggleComplete={toggleCompleteMock}
        deleteTodo={deleteTodoMock}
      />
    );
    const todoItems = screen.getAllByTestId('todo-item');
    expect(todoItems.length).toBe(mockTodos.length);
  });
});
