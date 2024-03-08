import React from 'react';
import { render } from '@testing-library/react-native';

import HintModal from './HintModal';

describe('HintModal', () => {
  it('should render successfully', () => {
    const { root } = render(< HintModal />);
    expect(root).toBeTruthy();
  });
});
