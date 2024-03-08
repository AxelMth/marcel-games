import React from 'react';
import { render } from '@testing-library/react-native';

import SuccessModal from './SuccessModal';

describe('SuccessModal', () => {
  it('should render successfully', () => {
    const { root } = render(<SuccessModal />);
    expect(root).toBeTruthy();
  });
});
