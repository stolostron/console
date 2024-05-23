/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { waitForNotText, waitForText } from '../../../lib/test-util'
import userEvent from '@testing-library/user-event'
import { DiffModal } from './DiffModal'

describe('DiffModal components test', () => {
  test('Should not render View diff button', async () => {
    render(<DiffModal name="ns-1" kind="Namespace" namespace="" diff={``} />)
    await waitForNotText('View diff')
  })
  test('Should render diffModal correctly', async () => {
    render(
      <DiffModal
        name="ns-1"
        kind="Namespace"
        namespace=""
        diff={`
        --- testing : existing
        +++ testing : updated
        @@ -5,10 +5,11 @@
             openshift.io/sa.scc.mcs: s0:c29,c4
             openshift.io/sa.scc.supplemental-groups: 1000820000/10000
             openshift.io/sa.scc.uid-range: 1000820000/10000
           creationTimestamp: "2024-05-28T20:32:17Z"
           labels:
        +    cat: cookie
             kubernetes.io/metadata.name: testing
             pod-security.kubernetes.io/audit: restricted
             pod-security.kubernetes.io/audit-version: v1.24
             pod-security.kubernetes.io/warn: restricted
             pod-security.kubernetes.io/warn-version: v1.24
    `}
      />
    )

    await waitForText('View diff')
    const viewDiffLink = screen.getByText('View diff')
    userEvent.click(viewDiffLink)
    await waitForText('Difference for the Namespace ns-1')

    const modal = screen.getByRole('dialog')
    expect(modal).toHaveTextContent('--- testing : existing')
  })
})
