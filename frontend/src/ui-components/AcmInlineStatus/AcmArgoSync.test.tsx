/* Copyright Contributors to the Open Cluster Management project */

jest.mock('../../resources/utils/resource-request', () => ({
  replaceResource: () => ({
    promise: Promise.resolve(),
  }),
}))

import { render, waitFor, screen } from '@testing-library/react'
import { AcmArgoSync } from './AcmArgoSync'
import { AcmToastGroup, AcmToastProvider } from '../AcmAlert'

describe('AcmArgoSync', () => {
  test('should refresh the argo application set', async () => {
    const { getByRole } = render(
      <AcmToastProvider>
        <AcmToastGroup />
        <AcmArgoSync
          app={
            {
              appSetApps: [
                {
                  name: 'test',
                },
              ],
            } as any
          }
        />
      </AcmToastProvider>
    )
    const button = getByRole('button', { name: /sync/i })
    expect(button).toBeInTheDocument()
    button.click()

    await waitFor(() => expect(screen.getByText('ArgoCD app synced')).toBeInTheDocument())
  })
})
