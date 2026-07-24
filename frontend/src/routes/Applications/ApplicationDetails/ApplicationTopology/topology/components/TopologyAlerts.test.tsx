/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import type { TopologyNode } from '../../types'
import { TopologyAlertActionType, type TopologyAlert } from '../../analysis/utils'
import { TopologyAlerts } from './TopologyAlerts'

jest.mock('~/lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const createNode = (name = 'test-appset'): TopologyNode => ({
  name,
  namespace: 'openshift-gitops',
  type: 'applicationset',
  specs: {},
})

const createAlert = (overrides: Partial<TopologyAlert> = {}): TopologyAlert => ({
  id: overrides.id ?? 'alert-1::message',
  status: overrides.status ?? 'red',
  title: overrides.title ?? 'Alert title',
  description: overrides.description ?? {
    message: 'Alert message',
    bullets: [{ title: 'Suggestion', content: ['key: value'] }],
  },
  actions: overrides.actions,
  isMajor: overrides.isMajor,
})

describe('TopologyAlerts', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders the processing overlay', () => {
    render(<TopologyAlerts alerts={[]} currentAlertsKey="" isProcessingSave />)
    expect(screen.getByText('Progressing...')).toBeInTheDocument()
  })

  it('renders the analyzing overlay', () => {
    render(<TopologyAlerts alerts={[]} currentAlertsKey="" isAnalyzing />)
    expect(screen.getByText('Analyzing...')).toBeInTheDocument()
  })

  it('returns null when there are no alerts', () => {
    const { container } = render(<TopologyAlerts alerts={[]} currentAlertsKey="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders alerts, truncates long messages, and shows yaml bullets', async () => {
    const longMessage = 'x'.repeat(320)
    render(
      <TopologyAlerts
        alerts={[
          createAlert({ description: { message: longMessage, bullets: [{ title: 'YAML', content: ['a: 1'] }] } }),
        ]}
        currentAlertsKey="1"
      />
    )

    await act(async () => {
      jest.advanceTimersByTime(150)
    })

    expect(screen.getByText('Alert title')).toBeInTheDocument()
    expect(screen.getByText(`${'x'.repeat(312)}...`)).toBeInTheDocument()
    expect(screen.getByText('YAML')).toBeInTheDocument()
    expect(screen.getByText('a: 1')).toBeInTheDocument()
  })

  it('sorts major alerts before non-major and red before yellow', async () => {
    const { container } = render(
      <TopologyAlerts
        alerts={[
          createAlert({ id: 'yellow::msg', title: 'Yellow', status: 'yellow', isMajor: false }),
          createAlert({ id: 'red::msg', title: 'Red major', status: 'red', isMajor: true }),
          createAlert({ id: 'orange::msg', title: 'Orange', status: 'orange', isMajor: false }),
        ]}
        currentAlertsKey="sort"
      />
    )

    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    const alertIds = Array.from(container.querySelectorAll('[id$="::msg"]')).map((element) => element.id)
    expect(alertIds).toEqual(['red::msg', 'yellow::msg', 'orange::msg'])
  })

  it('invokes action callbacks for alert actions', async () => {
    const node = createNode()
    const onEditAppSet = jest.fn()
    const onEditYaml = jest.fn()
    const onSyncResources = jest.fn()
    const onLaunchArgo = jest.fn()
    const onViewLogs = jest.fn()

    render(
      <TopologyAlerts
        alerts={[
          createAlert({
            actions: [
              { label: 'Edit application', type: TopologyAlertActionType.editAppSet, node },
              {
                label: 'Edit YAML',
                type: TopologyAlertActionType.editYaml,
                node,
                highlightEditorPath: 'ApplicationSet.spec.generators',
              },
              { label: 'Sync resources', type: TopologyAlertActionType.syncResources, node },
              { label: 'Launch Argo editor', type: TopologyAlertActionType.launchArgo, node },
              { label: 'Show logs', type: TopologyAlertActionType.showLog, node },
            ],
          }),
        ]}
        currentAlertsKey="actions"
        onEditAppSet={onEditAppSet}
        onEditYaml={onEditYaml}
        onSyncResources={onSyncResources}
        onLaunchArgo={onLaunchArgo}
        onViewLogs={onViewLogs}
      />
    )

    await act(async () => {
      jest.advanceTimersByTime(150)
    })

    await userEvent.click(screen.getByText('Edit application'))
    await userEvent.click(screen.getByText('Edit YAML'))
    await userEvent.click(screen.getByText('Sync resources'))
    await userEvent.click(screen.getByText('Launch Argo editor'))
    await userEvent.click(screen.getByText('Show logs'))

    expect(onEditAppSet).toHaveBeenCalledWith(node)
    expect(onEditYaml).toHaveBeenCalledWith(node, 'ApplicationSet.spec.generators')
    expect(onSyncResources).toHaveBeenCalledWith(node)
    expect(onLaunchArgo).toHaveBeenCalledWith(node)
    expect(onViewLogs).toHaveBeenCalledWith(node)
  })

  it('dismisses alerts when the close button is clicked', async () => {
    render(<TopologyAlerts alerts={[createAlert()]} currentAlertsKey="close" />)

    await act(async () => {
      jest.advanceTimersByTime(150)
    })

    const closeButton = screen.getByRole('button', { name: /close/i })
    await userEvent.click(closeButton)

    await act(async () => {
      jest.advanceTimersByTime(600)
    })

    expect(screen.queryByText('Alert title')).not.toBeInTheDocument()
  })

  it('shows a previously dismissed alert again when currentAlertsKey changes', async () => {
    const alert = createAlert({ id: 'shared-id::message', title: 'Shared alert' })
    const { rerender } = render(<TopologyAlerts alerts={[alert]} currentAlertsKey="app-a" />)

    await act(async () => {
      jest.advanceTimersByTime(150)
    })

    await userEvent.click(screen.getByRole('button', { name: /close/i }))

    await act(async () => {
      jest.advanceTimersByTime(600)
    })

    expect(screen.queryByText('Shared alert')).not.toBeInTheDocument()

    rerender(<TopologyAlerts alerts={[alert]} currentAlertsKey="app-b" />)

    await act(async () => {
      jest.advanceTimersByTime(150)
    })

    expect(screen.getByText('Shared alert')).toBeInTheDocument()
  })

  it('does not re-add alerts from cancelled stagger timers after alerts are cleared', async () => {
    const alert = createAlert({ id: 'stagger::msg', title: 'Stagger alert' })
    const { rerender } = render(<TopologyAlerts alerts={[alert]} currentAlertsKey="stagger" />)

    rerender(<TopologyAlerts alerts={[]} currentAlertsKey="stagger" />)

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(screen.queryByText('Stagger alert')).not.toBeInTheDocument()
  })

  it('cancels pending dismissal when alerts input changes', async () => {
    const alert = createAlert({ id: 'dismiss::msg', title: 'Dismiss alert' })
    const { rerender } = render(<TopologyAlerts alerts={[alert]} currentAlertsKey="dismiss" />)

    await act(async () => {
      jest.advanceTimersByTime(150)
    })

    await userEvent.click(screen.getByRole('button', { name: /close/i }))

    // Change inputs before the 500ms dismissal timer completes
    rerender(<TopologyAlerts alerts={[alert]} currentAlertsKey="dismiss-next" />)

    await act(async () => {
      jest.advanceTimersByTime(600)
    })

    expect(screen.getByText('Dismiss alert')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    jest.useRealTimers()
    const { container } = render(
      <TopologyAlerts
        alerts={[
          createAlert({
            actions: [{ label: 'Edit application', type: TopologyAlertActionType.editAppSet, node: createNode() }],
          }),
        ]}
        currentAlertsKey="a11y"
      />
    )

    // Allow staggered alert render to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150))
    })

    expect(await axe(container)).toHaveNoViolations()
  })
})
