/* Copyright Contributors to the Open Cluster Management project */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ControlPanelFinish, { REVIEW_EMPTY_VALUE } from './ControlPanelFinish'

const i18n = (key, params) => {
  if (!params) {
    return key
  }
  return Object.keys(params).reduce((result, param) => result.replace(`{{${param}}}`, String(params[param])), key)
}

const detailsFromControls = (controls, step = { id: 'step1', type: 'step', title: 'Step 1' }) => [
  {
    title: step,
    sections: [{ content: controls }],
  },
]

describe('ControlPanelFinish', () => {
  afterEach(cleanup)

  it('uses cards name for the review term instead of capitalizing the id', () => {
    render(
      <ControlPanelFinish
        details={detailsFromControls([
          {
            id: 'controlPlaneTopology',
            type: 'cards',
            name: 'Control plane configuration',
            active: 'HighlyAvailable',
            availableMap: {
              HighlyAvailable: { title: 'Highly available' },
            },
          },
        ])}
        startStep={0}
        renderNotifications={() => null}
        i18n={i18n}
      />
    )
    expect(screen.getByText('Control plane configuration')).toBeInTheDocument()
    expect(screen.queryByText('Controlplanetopology')).not.toBeInTheDocument()
    expect(screen.getByText('Highly available')).toBeInTheDocument()
  })

  it('skips controls marked omitFromReview', () => {
    render(
      <ControlPanelFinish
        details={detailsFromControls([
          { id: 'shown', type: 'text', name: 'Cluster name', active: 'demo' },
          { id: 'cpCores', type: 'number', name: 'Cores', active: '8', omitFromReview: true },
        ])}
        startStep={0}
        renderNotifications={() => null}
        i18n={i18n}
      />
    )
    expect(screen.getByText('Cluster name')).toBeInTheDocument()
    expect(screen.queryByText('Cores')).not.toBeInTheDocument()
  })

  it('does not mutate wizard step section content when filtering review controls', () => {
    const originalContent = [
      { id: 'shown', type: 'text', name: 'Cluster name', active: 'demo' },
      { id: 'cpCores', type: 'number', name: 'Cores', active: '8', omitFromReview: true },
    ]
    const sections = [{ content: originalContent }]
    render(
      <ControlPanelFinish
        details={[{ title: { id: 'step1', type: 'step', title: 'Step 1' }, sections }]}
        startStep={0}
        renderNotifications={() => null}
        i18n={i18n}
      />
    )
    expect(sections[0].content).toBe(originalContent)
    expect(sections[0].content).toHaveLength(2)
    expect(screen.getByText('Cluster name')).toBeInTheDocument()
    expect(screen.queryByText('Cores')).not.toBeInTheDocument()
  })

  it('ignores omitFromReview group-child exceptions for readiness', () => {
    render(
      <ControlPanelFinish
        reviewLayout="standalone"
        details={detailsFromControls(
          [
            {
              id: 'workerGroups',
              type: 'group',
              active: [
                [
                  {
                    id: 'hiddenSummary',
                    type: 'custom',
                    omitFromReview: true,
                    exception: 'ignored',
                    summary: () => [{ term: 'Size', desc: 'x', exception: 'too small' }],
                  },
                ],
              ],
            },
          ],
          { id: 'workerGroupsStep', type: 'step', title: 'Worker groups' }
        )}
        startStep={0}
        renderNotifications={() => null}
        i18n={i18n}
      />
    )
    expect(screen.getByText('Ready to create')).toBeInTheDocument()
    expect(screen.queryByText('Complete the configuration')).not.toBeInTheDocument()
  })

  it('skips omitted groups before rendering group members', () => {
    render(
      <ControlPanelFinish
        details={detailsFromControls([
          { id: 'shown', type: 'text', name: 'Cluster name', active: 'demo' },
          {
            id: 'hiddenGroup',
            type: 'group',
            omitFromReview: true,
            active: [[{ id: 'workerName', type: 'text', name: 'Worker name', active: 'compute' }]],
          },
        ])}
        startStep={0}
        renderNotifications={() => null}
        i18n={i18n}
      />
    )
    expect(screen.getByText('Cluster name')).toBeInTheDocument()
    expect(screen.queryByText('Worker name')).not.toBeInTheDocument()
  })

  it('shows Complete the configuration when a grouped summary row has an exception', () => {
    render(
      <ControlPanelFinish
        reviewLayout="standalone"
        details={detailsFromControls(
          [
            {
              id: 'workerGroups',
              type: 'group',
              active: [
                [
                  {
                    id: 'workerGroupSizeSummary',
                    type: 'custom',
                    summary: () => [{ term: 'Size', desc: 'invalid', exception: 'too small' }],
                  },
                ],
              ],
            },
          ],
          { id: 'workerGroupsStep', type: 'step', title: 'Worker groups' }
        )}
        startStep={0}
        renderNotifications={() => null}
        i18n={i18n}
      />
    )
    expect(screen.getByText('Complete the configuration')).toBeInTheDocument()
    expect(screen.queryByText('Ready to create')).not.toBeInTheDocument()
  })

  it('renders comment with the configured alert variant', () => {
    const { container } = render(
      <ControlPanelFinish
        details={[]}
        comment="Installation typically takes 30–40 minutes."
        commentVariant="info"
        startStep={0}
        renderNotifications={() => null}
        i18n={i18n}
      />
    )
    expect(container.querySelector('.pf-m-info')).toBeTruthy()
    expect(screen.getByText('Installation typically takes 30–40 minutes.')).toBeInTheDocument()
  })

  it('renders empty values as a dash from REVIEW_EMPTY_VALUE', () => {
    render(
      <ControlPanelFinish
        details={detailsFromControls([{ id: 'ssh', type: 'textarea', name: 'SSH public key', active: '' }])}
        startStep={0}
        renderNotifications={() => null}
        i18n={i18n}
      />
    )
    expect(screen.getByText(REVIEW_EMPTY_VALUE)).toBeInTheDocument()
    expect(screen.queryByText('-none-')).not.toBeInTheDocument()
  })

  it('renders standalone linked titles, readiness, and stacked rows', async () => {
    const onEditStep = jest.fn()
    const user = userEvent.setup()
    render(
      <ControlPanelFinish
        reviewLayout="standalone"
        onEditStep={onEditStep}
        details={[
          {
            title: { id: 'kubevirtStandaloneDetailStep', type: 'step', title: 'Cluster details' },
            sections: [{ content: [{ id: 'name', type: 'text', name: 'Cluster name', active: 'demo' }] }],
          },
          {
            title: { id: 'workerGroupsStep', type: 'step', title: 'Worker groups' },
            sections: [
              {
                content: [
                  {
                    id: 'controlPlaneTopology',
                    type: 'cards',
                    name: 'Control plane configuration',
                    active: 'ha',
                    availableMap: { ha: { title: 'Highly available' } },
                  },
                ],
              },
            ],
          },
          {
            title: { id: 'networkingStep', type: 'step', title: 'Networking & services' },
            sections: [
              {
                content: [
                  {
                    id: 'networkingMode',
                    type: 'cards',
                    name: 'Networking mode',
                    active: 'pod',
                    availableMap: { pod: { title: 'Pod networking' } },
                  },
                ],
              },
            ],
          },
        ]}
        comment="Installation typically takes 30–40 minutes."
        commentVariant="info"
        startStep={0}
        renderNotifications={() => null}
        i18n={i18n}
      />
    )

    expect(screen.getByRole('button', { name: 'Edit Cluster details' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Worker groups' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Networking & services' })).toBeInTheDocument()
    expect(screen.getByText('Ready to create')).toBeInTheDocument()
    expect(screen.queryByText('1')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit Networking & services' }))
    expect(onEditStep).toHaveBeenCalledWith('networkingStep')
  })

  it('shows Complete the configuration when a reviewed control has an exception', () => {
    render(
      <ControlPanelFinish
        reviewLayout="standalone"
        details={detailsFromControls(
          [{ id: 'name', type: 'text', name: 'Cluster name', active: '', exception: 'required' }],
          { id: 'kubevirtStandaloneDetailStep', type: 'step', title: 'Cluster details' }
        )}
        startStep={0}
        renderNotifications={() => null}
        i18n={i18n}
      />
    )
    expect(screen.getByText('Complete the configuration')).toBeInTheDocument()
    expect(screen.queryByText('Ready to create')).not.toBeInTheDocument()
  })
})
