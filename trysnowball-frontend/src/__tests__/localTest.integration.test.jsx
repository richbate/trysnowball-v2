import React from 'react';
import { render, screen } from '@testing-library/react';
import LocalTest from '../pages/LocalTest';
import { debtsManager } from '../lib/debtsManager';

describe('LocalTest – smoke', () => {
  beforeEach(() => {
    debtsManager.clearAllData();
  });

  test('renders and can show snapshot components', async () => {
    render(<LocalTest />);
    // The page auto-runs; just assert it renders Test Suite title
    expect(await screen.findByText(/Local Storage Test Suite/i)).toBeInTheDocument();
  });
});