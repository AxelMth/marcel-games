import React from 'react';
import { render } from '@testing-library/react-native';

import HintItem from './HintItem';

describe('HintItem', () => {
  it('should render successfully', () => {
    const { root } = render(< HintItem />);
    expect(root).toBeTruthy();
  });
});
