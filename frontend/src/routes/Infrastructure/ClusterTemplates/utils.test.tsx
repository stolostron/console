/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react';
import { waitForSelector, waitForText } from '../../../lib/test-util';
import { getNavLabelWithCount, LoadingHelper } from './utils';

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

describe('getNavLabelWithCount', () => {
  test('returns just a label when no count is provided', () => {
    expect(getNavLabelWithCount('Items')).toEqual('Items');
  });
  test('returns label with count when the count is provided', () => {
    expect(getNavLabelWithCount('Items', 3)).toEqual('Items (3)');
  });
});
