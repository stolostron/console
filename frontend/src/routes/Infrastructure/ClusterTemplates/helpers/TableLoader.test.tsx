/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react';
import { waitForTestId, waitForText } from '../../../../lib/test-util';
import TableLoader from './TableLoader';

describe('TableLoader', () => {
  test('renders children when loaded and there are no errors', async () => {
    render(<TableLoader loaded>Loaded content</TableLoader>);
    await waitForText('Loaded content');
  });
  test('renders skeleton loader when not loaded', async () => {
    render(<TableLoader loaded={false}>Loaded content</TableLoader>);
    await waitForTestId('table-skeleton');
  });
  test('renders error when there is an error', async () => {
    render(
      <TableLoader
        error={true}
        errorId="loading-error"
        errorTitle="Load failed"
        errorMessage="There was a problem loading data"
        loaded
      >
        Loaded content
      </TableLoader>,
    );
    await waitForTestId('loading-error');
    await waitForText('Load failed');
    await waitForText('There was a problem loading data');
  });
  test('renders error defaults (title and no message) when error props are not provided', async () => {
    render(
      <TableLoader error={true} loaded>
        Loaded content
      </TableLoader>,
    );
    await waitForText('Something went wrong');
  });
});
