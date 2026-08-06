/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Provider } from '../../../../../ui-components'
import { DestroyHostedModal } from './DestroyHostedModal'
import { clickByText } from '../../../../../lib/test-util'

const mockClose = jest.fn()

function renderModal(provider?: Provider, clusterName = 'test-cluster') {
  render(<DestroyHostedModal open={true} close={mockClose} clusterName={clusterName} provider={provider} />)
  return screen.getByRole('dialog', { name: /permanently destroy/i })
}

describe('DestroyHostedModal', () => {
  beforeEach(() => jest.clearAllMocks())

  test('has no accessibility violations (AWS)', async () => {
    renderModal(Provider.aws)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test('has no accessibility violations (Azure)', async () => {
    renderModal(Provider.azure)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test('renders the modal title and cluster name in the description', () => {
    const dialog = renderModal(Provider.aws)
    expect(within(dialog).getByText('Permanently destroy clusters?')).toBeInTheDocument()
    expect(within(dialog).getByText('test-cluster', { exact: false })).toBeInTheDocument()
    expect(within(dialog).getByText('can only be destroyed through the CLI', { exact: false })).toBeInTheDocument()
  })

  test('calls close when the Close button is clicked', async () => {
    renderModal(Provider.aws)
    await clickByText('Close')
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  test('does not render when open is false', () => {
    render(<DestroyHostedModal open={false} close={mockClose} clusterName="test-cluster" provider={Provider.aws} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  describe('AWS provider', () => {
    test('shows AWS-specific destroy instructions', () => {
      const dialog = renderModal(Provider.aws)
      expect(within(dialog).getByText(/--sts-creds/)).toBeInTheDocument()
      expect(within(dialog).getByText(/--role-arn/)).toBeInTheDocument()
      expect(within(dialog).getByText('hcp destroy cluster aws --help')).toBeInTheDocument()
    })

    test('shows AWS credential guidance', () => {
      const dialog = renderModal(Provider.aws)
      expect(within(dialog).getByText(/Amazon Web Services \(AWS\) STS credential and role ARN/)).toBeInTheDocument()
    })
  })

  describe('Azure provider', () => {
    test('shows Azure-specific destroy cluster instructions', () => {
      const dialog = renderModal(Provider.azure)
      expect(within(dialog).getByText(/--dns-zone-rg-name/)).toBeInTheDocument()
      expect(within(dialog).getByText('hcp destroy cluster azure --help')).toBeInTheDocument()
    })

    test('shows Azure credential guidance', () => {
      const dialog = renderModal(Provider.azure)
      expect(within(dialog).getByText(/Azure credentials file/)).toBeInTheDocument()
      expect(within(dialog).getByText(/managed resource group name/)).toBeInTheDocument()
    })

    test('does not show AWS-specific content', () => {
      const dialog = renderModal(Provider.azure)
      expect(within(dialog).queryByText(/--sts-creds/)).not.toBeInTheDocument()
      expect(within(dialog).queryByText(/--role-arn/)).not.toBeInTheDocument()
    })

    test('shows the destroy infrastructure step with warning text', () => {
      const dialog = renderModal(Provider.azure)
      expect(within(dialog).getByText('Destroy the infrastructure')).toBeInTheDocument()
      expect(
        within(dialog).getByText('This step can only be completed after the hosted cluster is destroyed.')
      ).toBeInTheDocument()
    })

    test('shows destroy infrastructure commands', () => {
      const dialog = renderModal(Provider.azure)
      expect(within(dialog).getByText(/--location \$LOCATION/)).toBeInTheDocument()
      expect(within(dialog).getByText('hcp destroy infra azure --help')).toBeInTheDocument()
    })

    test('shows the destroy workload identities step with warning text', () => {
      const dialog = renderModal(Provider.azure)
      expect(within(dialog).getByText(/Destroy workload identities/)).toBeInTheDocument()
      expect(within(dialog).getByText(/Skip this step if reusing IAM for future clusters/)).toBeInTheDocument()
    })

    test('shows destroy workload identities commands', () => {
      const dialog = renderModal(Provider.azure)
      expect(within(dialog).getByText(/--workload-identities-file/)).toBeInTheDocument()
      expect(within(dialog).getByText('hcp destroy iam azure --help')).toBeInTheDocument()
    })

    test('quotes path arguments in shell commands', () => {
      const dialog = renderModal(Provider.azure)
      const matches = within(dialog).getAllByText(/--azure-creds "\$AZURE_CREDS"/)
      expect(matches.length).toBeGreaterThanOrEqual(2)
      expect(within(dialog).getByText(/--workload-identities-file "\$WORKLOAD_IDENTITIES_FILE"/)).toBeInTheDocument()
    })
  })

  describe('unknown provider (generic fallback)', () => {
    test('shows generic destroy instructions', () => {
      const dialog = renderModal(Provider.gcp)
      expect(within(dialog).getByText(/hcp destroy cluster <platform>/)).toBeInTheDocument()
      expect(within(dialog).getByText('hcp destroy cluster --help')).toBeInTheDocument()
    })

    test('shows generic credential guidance', () => {
      const dialog = renderModal(Provider.gcp)
      expect(
        within(dialog).getByText(/Find the credentials that you used to create your hosted cluster/)
      ).toBeInTheDocument()
    })

    test('falls back to generic when provider is undefined', () => {
      const dialog = renderModal()
      expect(within(dialog).getByText(/hcp destroy cluster <platform>/)).toBeInTheDocument()
    })

    test('does not show AWS or Azure-specific content', () => {
      const dialog = renderModal(Provider.gcp)
      expect(within(dialog).queryByText(/--sts-creds/)).not.toBeInTheDocument()
      expect(within(dialog).queryByText(/--azure-creds/)).not.toBeInTheDocument()
    })
  })
})
