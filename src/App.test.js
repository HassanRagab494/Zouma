import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the login screen when signed out', () => {
  render(<App />);
  expect(screen.getByText(/تسجيل الدخول للنظام/i)).toBeInTheDocument();
});
