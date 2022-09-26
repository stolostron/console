/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react';
import { waitForSelector, waitForText } from '../../../lib/test-util';
import { LoadingHelper } from './utils';

describe('LoadingHelper component', () => {
  test('renders children when loaded and no error', async () => {
    render(<LoadingHelper isLoaded>The content</LoadingHelper>);
    await waitForText('The content');
  });
  test('renders skeleton when loading', async () => {
    const { container } = render(<LoadingHelper isLoaded={false}>The content</LoadingHelper>);
    await waitForSelector(container, 'div.pf-c-skeleton');
  });
  test('renders `-` when there is an error', async () => {
    render(
      <LoadingHelper isLoaded error={'something went wrong'}>
        The content
      </LoadingHelper>,
    );
    await waitForText('-');
  });
});
