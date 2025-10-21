/* Copyright Contributors to the Open Cluster Management project */

jest.mock('../../../resources/utils', () => ({
  patchResource: jest.fn(() => ({
    promise: Promise.resolve(),
  })),
}))

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SyncArgoCDModal, ISyncArgoCDModalProps } from './SyncArgoCDModal'
import { AcmToastGroup, AcmToastProvider } from '../../../ui-components'
import { patchResource } from '../../../resources/utils'

describe('SyncArgoCDModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the modal for a single application', () => {
    const mockApp = {
      metadata: {
        name: 'test-app',
        namespace: 'test-namespace',
      },
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Application',
        metadata: {
          name: 'test-app',
          namespace: 'test-namespace',
        },
        spec: {
          syncPolicy: {
            automated: {
              prune: true,
              selfHeal: true,
            },
          },
        },
      },
    }

    const modalProps: ISyncArgoCDModalProps = {
      open: true,
      close: jest.fn(),
      appOrAppSet: mockApp,
    }

    const { getByText } = render(
      <AcmToastProvider>
        <AcmToastGroup />
        <SyncArgoCDModal {...modalProps} />
      </AcmToastProvider>
    )

    expect(getByText('Initiate sync for ArgoCD application')).toBeTruthy()
    expect(getByText('Initiate synchronization of application resources with the source repository.')).toBeTruthy()
    expect(screen.getByRole('button', { name: /synchronize/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy()
  })

  it('should render the modal for an ApplicationSet', () => {
    const mockAppSet = {
      metadata: {
        name: 'test-appset',
        namespace: 'test-namespace',
      },
      appSetApps: [
        {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'Application',
          metadata: {
            name: 'test-app-1',
            namespace: 'test-namespace',
          },
          spec: {
            syncPolicy: {
              automated: {
                prune: true,
                selfHeal: true,
              },
            },
          },
        },
        {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'Application',
          metadata: {
            name: 'test-app-2',
            namespace: 'test-namespace',
          },
          spec: {
            syncPolicy: {
              automated: {
                prune: true,
                selfHeal: true,
              },
            },
          },
        },
      ],
    }

    const modalProps: ISyncArgoCDModalProps = {
      open: true,
      close: jest.fn(),
      appOrAppSet: mockAppSet,
    }

    const { getByText } = render(
      <AcmToastProvider>
        <AcmToastGroup />
        <SyncArgoCDModal {...modalProps} />
      </AcmToastProvider>
    )

    expect(getByText('Initiate sync for ArgoCD application')).toBeTruthy()
    expect(
      getByText('Initiate synchronization of all applications in the ApplicationSet with their source repositories.')
    ).toBeTruthy()
  })

  it('should not render when open is false', () => {
    const { container } = render(<SyncArgoCDModal open={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('should successfully sync a single application', async () => {
    const mockApp = {
      metadata: {
        name: 'test-app',
        namespace: 'test-namespace',
      },
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Application',
        metadata: {
          name: 'test-app',
          namespace: 'test-namespace',
        },
        spec: {
          syncPolicy: {
            automated: {
              prune: true,
              selfHeal: true,
            },
          },
        },
      },
    }

    const closeMock = jest.fn()
    const modalProps: ISyncArgoCDModalProps = {
      open: true,
      close: closeMock,
      appOrAppSet: mockApp,
    }

    render(
      <AcmToastProvider>
        <AcmToastGroup />
        <SyncArgoCDModal {...modalProps} />
      </AcmToastProvider>
    )

    const synchronizeButton = screen.getByRole('button', { name: /synchronize/i })
    userEvent.click(synchronizeButton)

    await waitFor(() => {
      expect(patchResource).toHaveBeenCalledTimes(1)
      expect(patchResource).toHaveBeenCalledWith(
        mockApp.app,
        expect.objectContaining({
          operation: expect.objectContaining({
            sync: expect.any(Object),
          }),
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('ArgoCD app sync initiated')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(closeMock).toHaveBeenCalled()
    })
  })

  it('should successfully sync an ApplicationSet', async () => {
    const mockAppSet = {
      metadata: {
        name: 'test-appset',
        namespace: 'test-namespace',
      },
      appSetApps: [
        {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'Application',
          metadata: {
            name: 'test-app-1',
            namespace: 'test-namespace',
          },
          spec: {
            syncPolicy: {
              automated: {
                prune: true,
                selfHeal: true,
              },
            },
          },
        },
        {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'Application',
          metadata: {
            name: 'test-app-2',
            namespace: 'test-namespace',
          },
          spec: {
            syncPolicy: {
              automated: {
                prune: true,
                selfHeal: true,
              },
            },
          },
        },
      ],
    }

    const closeMock = jest.fn()
    const modalProps: ISyncArgoCDModalProps = {
      open: true,
      close: closeMock,
      appOrAppSet: mockAppSet,
    }

    render(
      <AcmToastProvider>
        <AcmToastGroup />
        <SyncArgoCDModal {...modalProps} />
      </AcmToastProvider>
    )

    const synchronizeButton = screen.getByRole('button', { name: /synchronize/i })
    userEvent.click(synchronizeButton)

    await waitFor(() => {
      // Should patch both apps in the ApplicationSet
      expect(patchResource).toHaveBeenCalledTimes(2)
    })

    await waitFor(() => {
      expect(screen.getByText('ArgoCD app sync initiated')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(closeMock).toHaveBeenCalled()
    })
  })

  it('should handle sync failure with error toast', async () => {
    const mockError = new Error('Sync failed')
    ;(patchResource as jest.Mock).mockReturnValueOnce({
      promise: Promise.reject(mockError),
    })

    const mockApp = {
      metadata: {
        name: 'test-app',
        namespace: 'test-namespace',
      },
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Application',
        metadata: {
          name: 'test-app',
          namespace: 'test-namespace',
        },
        spec: {
          syncPolicy: {
            automated: {
              prune: true,
              selfHeal: true,
            },
          },
        },
      },
    }

    const closeMock = jest.fn()
    const modalProps: ISyncArgoCDModalProps = {
      open: true,
      close: closeMock,
      appOrAppSet: mockApp,
    }

    render(
      <AcmToastProvider>
        <AcmToastGroup />
        <SyncArgoCDModal {...modalProps} />
      </AcmToastProvider>
    )

    const synchronizeButton = screen.getByRole('button', { name: /synchronize/i })
    userEvent.click(synchronizeButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to initiate sync')).toBeInTheDocument()
    })

    // Modal should not close on failure
    expect(closeMock).not.toHaveBeenCalled()
  })

  it('should disable buttons during sync operation', async () => {
    const mockApp = {
      metadata: {
        name: 'test-app',
        namespace: 'test-namespace',
      },
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Application',
        metadata: {
          name: 'test-app',
          namespace: 'test-namespace',
        },
        spec: {
          syncPolicy: {
            automated: {
              prune: true,
              selfHeal: true,
            },
          },
        },
      },
    }

    // Mock a slow sync to test disabled state
    ;(patchResource as jest.Mock).mockReturnValueOnce({
      promise: new Promise((resolve) => setTimeout(resolve, 100)),
    })

    const modalProps: ISyncArgoCDModalProps = {
      open: true,
      close: jest.fn(),
      appOrAppSet: mockApp,
    }

    render(
      <AcmToastProvider>
        <AcmToastGroup />
        <SyncArgoCDModal {...modalProps} />
      </AcmToastProvider>
    )

    const synchronizeButton = screen.getByRole('button', { name: /synchronize/i })
    const cancelButton = screen.getByRole('button', { name: /cancel/i })

    expect(synchronizeButton).not.toBeDisabled()
    expect(cancelButton).not.toBeDisabled()

    userEvent.click(synchronizeButton)

    // Buttons should be disabled during sync
    await waitFor(() => {
      expect(synchronizeButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
    })
  })

  it('should call close function when cancel button is clicked', () => {
    const mockApp = {
      metadata: {
        name: 'test-app',
        namespace: 'test-namespace',
      },
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Application',
        metadata: {
          name: 'test-app',
          namespace: 'test-namespace',
        },
        spec: {
          syncPolicy: {},
        },
      },
    }

    const closeMock = jest.fn()
    const modalProps: ISyncArgoCDModalProps = {
      open: true,
      close: closeMock,
      appOrAppSet: mockApp,
    }

    render(
      <AcmToastProvider>
        <AcmToastGroup />
        <SyncArgoCDModal {...modalProps} />
      </AcmToastProvider>
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    userEvent.click(cancelButton)

    expect(closeMock).toHaveBeenCalled()
  })
})
