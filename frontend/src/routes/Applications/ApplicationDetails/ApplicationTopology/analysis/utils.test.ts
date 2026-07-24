/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import type { TopologyNode } from '../types'
import {
  createTopologyAlert,
  createTopologyErrorAlert,
  extractConditionsErrors,
  filteredConditionErrors,
  isErrorCondition,
  setNodePulseForTypes,
  TopologyAlertActionType,
  type TopologyAlert,
} from './utils'
import {
  createCondition,
  createFilteredError,
  createResourceWithConditions,
  NAMESPACE,
} from './__fixtures__/topologyAnalysisFixtures'

describe('analysis/utils', () => {
  describe('isErrorCondition', () => {
    it('returns true when reason contains failed', () => {
      expect(isErrorCondition(createCondition({ reason: 'SyncFailed', type: 'Synced' }))).toBe(true)
    })

    it('returns true when type contains error and status is True', () => {
      expect(isErrorCondition({ type: 'ErrorOccurred', message: 'failed', status: 'True' })).toBe(true)
    })

    it('returns false when ErrorOccurred status is False (healthy ApplicationSet message)', () => {
      expect(
        isErrorCondition({
          type: 'ErrorOccurred',
          reason: 'ApplicationSetUpToDate',
          message: 'All applications have been generated successfully',
          status: 'False',
        })
      ).toBe(false)
    })

    it('returns true when status is False for a positive status type', () => {
      expect(
        isErrorCondition({
          type: 'PlacementSatisfied',
          reason: 'NotSatisfied',
          message: 'no match',
          status: 'False',
        })
      ).toBe(true)
    })

    it('returns false for a healthy condition', () => {
      expect(
        isErrorCondition({
          type: 'Ready',
          reason: 'Available',
          message: 'ok',
          status: 'True',
        })
      ).toBe(false)
    })
  })

  describe('setNodePulseForTypes', () => {
    it('sets pulse only on matching node types', () => {
      const nodes = [
        { name: 'a', namespace: 'ns', type: 'placement', specs: {} },
        { name: 'b', namespace: 'ns', type: 'cluster', specs: {} },
        { name: 'c', namespace: 'ns', type: 'deployment', specs: {} },
      ] as TopologyNode[]

      setNodePulseForTypes(nodes, ['placement', 'cluster'], 'none')

      expect(nodes[0].specs.pulse).toBe('none')
      expect(nodes[1].specs.pulse).toBe('none')
      expect(nodes[2].specs.pulse).toBeUndefined()
    })
  })

  describe('extractConditionsErrors', () => {
    it('returns empty array when there are no error conditions', () => {
      const resource = createResourceWithConditions('Placement', 'p1', [
        createCondition({ type: 'Ready', reason: 'Available', status: 'True', message: 'ok' }),
      ])
      expect(extractConditionsErrors([resource], t)).toEqual([])
    })

    it('groups a single resource error condition', () => {
      const resource = createResourceWithConditions('Placement', 'p1', [
        createCondition({
          type: 'PlacementSatisfied',
          reason: 'NotSatisfied',
          status: 'False',
          message: 'No ManagedCluster matches any of the cluster predicate',
        }),
      ])

      const errors = extractConditionsErrors([resource], t)
      expect(errors).toHaveLength(1)
      expect(errors[0].kind).toBe('Placement')
      expect(errors[0].name).toBe('p1')
      expect(errors[0].errors[0].firstError.message).toBe('No ManagedCluster matches any of the cluster predicate')
    })

    it('creates per-resource errors when message is shared by a subset of resources', () => {
      const sharedMessage = 'shared failure'
      const resources = [
        createResourceWithConditions('Application', 'a1', [
          createCondition({ message: sharedMessage, reason: 'Failed', type: 'Error' }),
        ]),
        createResourceWithConditions('Application', 'a2', [
          createCondition({ message: sharedMessage, reason: 'Failed', type: 'Error' }),
        ]),
        createResourceWithConditions('Application', 'a3', [
          createCondition({ message: 'other', reason: 'Available', type: 'Ready', status: 'True' }),
        ]),
      ]

      const errors = extractConditionsErrors(resources, t)
      expect(errors).toHaveLength(2)
      expect(errors.map((error) => error.name).sort()).toEqual(['a1', 'a2'])
    })
  })

  describe('filteredConditionErrors', () => {
    it('returns undefined when there are no errors', () => {
      expect(
        filteredConditionErrors(
          {
            kind: 'Placement',
            resource: createResourceWithConditions('Placement', 'p1', []),
            errors: [],
          },
          t
        )
      ).toBeUndefined()
    })

    it('rewrites succeed messages as failed', () => {
      const result = filteredConditionErrors(
        {
          kind: 'Application',
          name: 'app',
          namespace: NAMESPACE,
          resource: createResourceWithConditions('Application', 'app', []),
          errors: [
            {
              message: 'sync attempt',
              reason: 'Succeeded',
              type: 'Synced',
            },
          ],
        },
        t
      )

      expect(result?.errors[0].firstError.message).toBe('sync attempt failed')
    })
  })

  describe('createTopologyAlert', () => {
    it('creates a stable id from title and message', () => {
      const alert = createTopologyAlert('Title', 'red', { message: 'Message' }, [
        { label: 'Edit', type: TopologyAlertActionType.editAppSet },
      ])

      expect(alert).toEqual({
        id: 'Title::Message',
        status: 'red',
        title: 'Title',
        description: { message: 'Message' },
        actions: [{ label: 'Edit', type: TopologyAlertActionType.editAppSet }],
      })
    })
  })

  describe('createTopologyErrorAlert', () => {
    it('pushes an alert and does not duplicate the same id', () => {
      const alerts: TopologyAlert[] = []
      const filteredError = createFilteredError('sync failed', {
        kind: 'Application',
        reason: 'SyncFailed',
        type: 'Error',
      })

      createTopologyErrorAlert([{ title: 'Try again' }], [], alerts, filteredError, t)
      createTopologyErrorAlert([{ title: 'Try again' }], [], alerts, filteredError, t)

      expect(alerts).toHaveLength(1)
      expect(alerts[0].title).toBe('Application SyncFailed')
      expect(alerts[0].description?.message).toBe('sync failed')
      expect(alerts[0].description?.bullets?.[0].title).toBe('Try again')
      expect(alerts[0].isMajor).toBe(true)
    })

    it('includes namespace/name in the title when isUnique is true', () => {
      const alerts: TopologyAlert[] = []
      const filteredError = createFilteredError('unique failure', {
        kind: 'Application',
        name: 'my-app',
        namespace: 'my-ns',
        reason: 'Failed',
      })

      createTopologyErrorAlert([], [], alerts, filteredError, t, 'red', true, true)

      expect(alerts[0].title).toBe('Application Failed my-ns/my-app')
    })

    it('replaces succeed with Failed in the title', () => {
      const alerts: TopologyAlert[] = []
      const filteredError = createFilteredError('attempt', {
        kind: 'Application',
        reason: 'Succeed',
      })

      createTopologyErrorAlert([], [], alerts, filteredError, t)

      expect(alerts[0].title).toBe('Application Failed')
    })
  })
})
