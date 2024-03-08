import React from 'react';
import { render } from '@testing-library/react-native';

import Modal from './Modal';

describe('Modal', () => {
  it('should render successfully', () => {
    const { root } = render(< Modal />);
    expect(root).toBeTruthy();
  });
});
