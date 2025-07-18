/* Copyright Contributors to the Open Cluster Management project */

jest.mock('../../resources/utils/resource-request', () => ({
  replaceResource: () => ({
    promise: Promise.resolve(),
  }),
}))

import { render, waitFor, screen } from '@testing-library/react'
import { AcmArgoRefresh } from './AcmArgoRefresh'
import { AcmToastGroup, AcmToastProvider } from '../AcmAlert'

describe('AcmArgoRefresh', () => {
  test('should refresh the argo application set', async () => {
    const { getByRole } = render(
      <AcmToastProvider>
        <AcmToastGroup />
        <AcmArgoRefresh
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
    const button = getByRole('button', { name: /refresh/i })
    expect(button).toBeInTheDocument()
    button.click()

    await waitFor(() => expect(screen.getByText('ArgoCD app refreshed')).toBeInTheDocument())
  })
})
