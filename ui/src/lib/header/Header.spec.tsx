import React from 'react';
import { render } from '@testing-library/react-native';

import Header from './Header';

describe('Header', () => {
  it('should render successfully', () => {
    const { root } = render(<Header />);
    expect(root).toBeTruthy();
  });
});
