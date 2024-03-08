import React from 'react';
import { render } from '@testing-library/react-native';

import HelpModal from './HelpModal';

describe('HelpModal', () => {
  it('should render successfully', () => {
    const { root } = render(<HelpModal />);
    expect(root).toBeTruthy();
  });
});
