// src/testUtils.jsx
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from './contexts/ThemeContext';

export function renderWithProviders(
  ui,
  {
    theme = 'light',
    router = true,
  } = {}
) {
  const tree = (
    <ThemeProvider initialTheme={theme}>
      {router ? <BrowserRouter>{ui}</BrowserRouter> : ui}
    </ThemeProvider>
  );
  return render(tree);
}