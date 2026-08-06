/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import type { TopologyNode } from '../types'
import { analyzeTopologyDeployments } from './analyzeTopologyDeployments'
import { TopologyAlertActionType, type TopologyAlert } from './utils'
import { CLUSTER_NAME, NAMESPACE, createAppSetNode } from './__fixtures__/topologyAnalysisFixtures'

describe('analyzeTopologyDeployments', () => {
  it('creates red alerts for red-pulse resources on non-green nodes', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode()
    const deployment: TopologyNode = {
      name: 'nginx',
      namespace: NAMESPACE,
      type: 'deployment',
      id: 'member--deployable--nginx',
      specs: {
        pulse: 'red',
        deploymentModel: {
          [CLUSTER_NAME]: [
            {
              name: 'nginx',
              namespace: NAMESPACE,
              cluster: CLUSTER_NAME,
              pulse: 'red',
              resStatus: '0/1',
            },
          ],
        },
      },
    }

    analyzeTopologyDeployments(appSet, [deployment], alerts, t)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe(`0/1 on ${CLUSTER_NAME}`)
    expect(alerts[0].status).toBe('red')
    expect(alerts[0].description?.message).toBe('Resource did not deploy: Deployment/nginx')
    expect(alerts[0].description?.bullets).toEqual([
      { title: '0/1', content: [] },
      { title: 'View YAML status for cause', content: [] },
    ])
    expect(alerts[0].actions?.map((action) => action.type)).toEqual([
      TopologyAlertActionType.editYaml,
      TopologyAlertActionType.launchArgo,
    ])
    expect(alerts[0].actions?.map((action) => action.label)).toEqual(['Edit YAML', 'Launch Argo editor'])
  })

  it('adds Show logs action for Pod resources', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode()
    const pod: TopologyNode = {
      name: 'nginx-pod',
      namespace: NAMESPACE,
      type: 'pod',
      id: 'member--deployable--nginx-pod',
      specs: {
        pulse: 'yellow',
        podModel: {
          [CLUSTER_NAME]: [
            {
              name: 'nginx-pod',
              namespace: NAMESPACE,
              cluster: CLUSTER_NAME,
              pulse: 'red',
              status: 'CrashLoopBackOff',
              resStatus: 'crashloopbackoff',
            },
          ],
        },
      },
    }

    analyzeTopologyDeployments(appSet, [pod], alerts, t)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe(`CrashLoopBackOff on ${CLUSTER_NAME}`)
    expect(alerts[0].description?.message).toBe('Resource did not deploy: Pod/nginx-pod')
    expect(alerts[0].description?.bullets).toEqual([
      { title: 'CrashLoopBackOff', content: [] },
      { title: 'View YAML status for cause', content: [] },
    ])
    expect(alerts[0].actions?.map((action) => action.type)).toEqual([
      TopologyAlertActionType.editYaml,
      TopologyAlertActionType.showLog,
      TopologyAlertActionType.launchArgo,
    ])
    expect(alerts[0].actions?.map((action) => action.label)).toContain('Show logs')
  })

  it('skips green nodes and non-red resource pulses', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode()
    const greenNode: TopologyNode = {
      name: 'nginx',
      namespace: NAMESPACE,
      type: 'deployment',
      specs: {
        pulse: 'green',
        deploymentModel: {
          [CLUSTER_NAME]: [{ name: 'nginx', cluster: CLUSTER_NAME, pulse: 'red', resStatus: '0/1' }],
        },
      },
    }
    const yellowNode: TopologyNode = {
      name: 'nginx',
      namespace: NAMESPACE,
      type: 'deployment',
      specs: {
        pulse: 'yellow',
        deploymentModel: {
          [CLUSTER_NAME]: [{ name: 'nginx', cluster: CLUSTER_NAME, pulse: 'yellow', resStatus: '1/2' }],
        },
      },
    }

    analyzeTopologyDeployments(appSet, [greenNode, yellowNode], alerts, t)

    expect(alerts).toEqual([])
  })
})
