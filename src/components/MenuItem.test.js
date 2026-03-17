import React from 'react';
import { render, screen } from '@testing-library/react';
import MenuItem from './MenuItem';

/**
 * Comprehensive tests for the MenuItem component
 */
describe('MenuItem Component', () => {
  test('renders MenuItem with correct text', () => {
    render(<MenuItem text="Test Menu Item" />);
    const menuItemElement = screen.getByText(/Test Menu Item/i);
    expect(menuItemElement).toBeInTheDocument();
  });

  test('has correct class name when active', () => {
    render(<MenuItem text="Active Item" active={true} />);
    const menuItemElement = screen.getByText(/Active Item/i);
    expect(menuItemElement).toHaveClass('active');
  });

  test('does not have active class when not active', () => {
    render(<MenuItem text="Inactive Item" active={false} />);
    const menuItemElement = screen.getByText(/Inactive Item/i);
    expect(menuItemElement).not.toHaveClass('active');
  });

  // Add more tests as needed for additional functionality
});
