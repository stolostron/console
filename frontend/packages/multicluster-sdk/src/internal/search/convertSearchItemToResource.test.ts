/* Copyright Contributors to the Open Cluster Management project */

import { convertSearchItemToResource } from './convertSearchItemToResource'

// Helper to convert search items with proper typing for test assertions

const convert = (item: any): any => convertSearchItemToResource(item)

describe('convertSearchItemToResource', () => {
  const baseSearchItem = {
    cluster: 'test-cluster',
    apigroup: '',
    apiversion: 'v1',
    kind: 'Pod',
    name: 'test-pod',
    namespace: 'default',
    created: '2023-01-01T00:00:00Z',
    label: 'app=test;version=1.0',
  }

  describe('basic transformation', () => {
    it('should transform a basic search item to a resource', () => {
      const result = convert(baseSearchItem)

      expect(result).toEqual({
        cluster: 'test-cluster',
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          creationTimestamp: '2023-01-01T00:00:00Z',
          name: 'test-pod',
          namespace: 'default',
          labels: {
            app: 'test',
            version: '1.0',
          },
        },
      })
    })

    it('should handle apiVersion with group correctly', () => {
      const itemWithGroup = {
        ...baseSearchItem,
        apigroup: 'apps',
        apiversion: 'v1',
        kind: 'Deployment',
      }

      const result = convert(itemWithGroup)
      expect(result.apiVersion).toBe('apps/v1')
    })

    it('should handle apiVersion without group correctly', () => {
      const itemWithoutGroup = {
        ...baseSearchItem,
        apigroup: '',
        apiversion: 'v1',
        kind: 'Pod',
      }

      const result = convert(itemWithoutGroup)
      expect(result.apiVersion).toBe('v1')
    })
  })

  describe('label parsing', () => {
    it('should parse labels correctly', () => {
      const itemWithLabels = {
        ...baseSearchItem,
        label: 'app=test;version=1.0;environment=prod',
      }

      const result = convert(itemWithLabels)
      expect(result.metadata?.labels).toEqual({
        app: 'test',
        version: '1.0',
        environment: 'prod',
      })
    })

    it('should handle empty labels', () => {
      const itemWithoutLabels = {
        ...baseSearchItem,
        label: '',
      }

      const result = convert(itemWithoutLabels)
      expect(result.metadata?.labels).toBeUndefined()
    })

    it('should handle undefined labels', () => {
      const itemWithUndefinedLabels = {
        ...baseSearchItem,
        label: undefined,
      }

      const result = convert(itemWithUndefinedLabels)
      expect(result.metadata?.labels).toBeUndefined()
    })

    it('should handle labels with spaces', () => {
      const itemWithSpacedLabels = {
        ...baseSearchItem,
        label: ' app=test; version=1.0',
      }

      const result = convert(itemWithSpacedLabels)
      expect(result.metadata?.labels).toEqual({
        app: 'test',
        version: '1.0',
      })
    })
  })

  describe('annotation parsing', () => {
    it('should parse annotations correctly', () => {
      const itemWithAnnotations = {
        ...baseSearchItem,
        annotation: 'description=My resource;owner=team-a;priority=high',
      }

      const result = convert(itemWithAnnotations)
      expect(result.metadata?.annotations).toEqual({
        description: 'My resource',
        owner: 'team-a',
        priority: 'high',
      })
    })

    it('should handle empty annotations', () => {
      const itemWithEmptyAnnotations = {
        ...baseSearchItem,
        annotation: '',
      }

      const result = convert(itemWithEmptyAnnotations)
      expect(result.metadata?.annotations).toBeUndefined()
    })

    it('should handle undefined annotations', () => {
      const itemWithUndefinedAnnotations = {
        ...baseSearchItem,
        annotation: undefined,
      }

      const result = convert(itemWithUndefinedAnnotations)
      expect(result.metadata?.annotations).toBeUndefined()
    })

    it('should handle annotations with spaces', () => {
      const itemWithSpacedAnnotations = {
        ...baseSearchItem,
        annotation: ' description=Test annotation; owner=team-b',
      }

      const result = convert(itemWithSpacedAnnotations)
      expect(result.metadata?.annotations).toEqual({
        description: 'Test annotation',
        owner: 'team-b',
      })
    })
  })

  describe('_uid field handling', () => {
    it('should process _uid field in "<cluster>/<uid>" format correctly', () => {
      const itemWithClusterUid = {
        ...baseSearchItem,
        _uid: 'test-cluster/abc-123-def-456',
      }

      const result = convert(itemWithClusterUid)
      expect(result.metadata?.uid).toBe('abc-123-def-456')
    })

    it('should process _uid field in "<uid>" format correctly', () => {
      const itemWithDirectUid = {
        ...baseSearchItem,
        _uid: 'xyz-789-ghi-012',
      }

      const result = convert(itemWithDirectUid)
      expect(result.metadata?.uid).toBe('xyz-789-ghi-012')
    })

    it('should handle undefined _uid field correctly', () => {
      const itemWithoutUid = {
        ...baseSearchItem,
        _uid: undefined,
      }

      const result = convert(itemWithoutUid)
      expect(result.metadata?.uid).toBeUndefined()
    })

    it('should handle empty string _uid field correctly', () => {
      const itemWithEmptyUid = {
        ...baseSearchItem,
        _uid: '',
      }

      const result = convert(itemWithEmptyUid)
      expect(result.metadata?.uid).toBeUndefined()
    })
  })

  describe('condition parsing', () => {
    it('should parse condition string correctly', () => {
      const itemWithConditions = {
        ...baseSearchItem,
        condition: 'Ready=True;Available=True',
      }

      const result = convert(itemWithConditions)
      expect(result.status?.conditions).toEqual([
        { type: 'Ready', status: 'True' },
        { type: 'Available', status: 'True' },
      ])
    })

    it('should handle empty condition string', () => {
      const itemWithEmptyCondition = {
        ...baseSearchItem,
        condition: '',
      }

      const result = convert(itemWithEmptyCondition)
      expect(result.status?.conditions).toBeUndefined()
    })

    it('should handle undefined condition', () => {
      const itemWithUndefinedCondition = {
        ...baseSearchItem,
        condition: undefined,
      }

      const result = convert(itemWithUndefinedCondition)
      expect(result.status?.conditions).toBeUndefined()
    })

    it('should handle malformed condition string', () => {
      const itemWithMalformedCondition = {
        ...baseSearchItem,
        condition: 'invalid;also-invalid',
      }

      const result = convert(itemWithMalformedCondition)
      expect(result.status?.conditions).toBeUndefined()
    })

    it('should filter out invalid conditions', () => {
      const itemWithMixedConditions = {
        ...baseSearchItem,
        condition: 'Ready=True;invalid;Available=False',
      }

      const result = convert(itemWithMixedConditions)
      expect(result.status?.conditions).toEqual([
        { type: 'Ready', status: 'True' },
        { type: 'Available', status: 'False' },
      ])
    })
  })

  describe('ClusterServiceVersion.operators.coreos.com', () => {
    it('should handle ClusterServiceVersion resource transformation', () => {
      const csvItem = {
        ...baseSearchItem,
        kind: 'ClusterServiceVersion',
        apigroup: 'operators.coreos.com',
        version: '1.0.0',
        display: 'Test Operator',
        phase: 'Succeeded',
      }

      const result = convert(csvItem)

      expect(result.spec).toEqual({
        version: '1.0.0',
        displayName: 'Test Operator',
      })
      expect(result.status).toEqual({
        phase: 'Succeeded',
      })
    })

    it('should handle ClusterServiceVersion with partial fields', () => {
      const csvItem = {
        ...baseSearchItem,
        kind: 'ClusterServiceVersion',
        apigroup: 'operators.coreos.com',
        version: '2.0.0',
      }

      const result = convert(csvItem)

      expect(result.spec?.version).toBe('2.0.0')
      expect(result.spec?.displayName).toBeUndefined()
      expect(result.status?.phase).toBeUndefined()
    })
  })

  describe('ClusterOperator.config.openshift.io', () => {
    it('should handle ClusterOperator resource transformation', () => {
      const clusterOperatorItem = {
        ...baseSearchItem,
        kind: 'ClusterOperator',
        apigroup: 'config.openshift.io',
        version: '4.12.0',
        available: 'True',
        progressing: 'False',
        degraded: 'False',
      }

      const result = convert(clusterOperatorItem)

      expect(result.status?.versions).toEqual([{ name: 'operator', version: '4.12.0' }])
      expect(result.status?.conditions).toEqual([
        { type: 'Available', status: 'True' },
        { type: 'Progressing', status: 'False' },
        { type: 'Degraded', status: 'False' },
      ])
    })

    it('should handle ClusterOperator with only version', () => {
      const clusterOperatorItem = {
        ...baseSearchItem,
        kind: 'ClusterOperator',
        apigroup: 'config.openshift.io',
        version: '4.12.0',
      }

      const result = convert(clusterOperatorItem)

      expect(result.status?.versions).toEqual([{ name: 'operator', version: '4.12.0' }])
      expect(result.status?.conditions).toBeUndefined()
    })

    it('should use condition string over individual conditions if provided', () => {
      const clusterOperatorItem = {
        ...baseSearchItem,
        kind: 'ClusterOperator',
        apigroup: 'config.openshift.io',
        version: '4.12.0',
        available: 'True',
        progressing: 'False',
        degraded: 'False',
        condition: 'Available=False;Degraded=True',
      }

      const result = convert(clusterOperatorItem)

      // When condition string is provided, it takes precedence
      expect(result.status?.conditions).toEqual([
        { type: 'Available', status: 'False' },
        { type: 'Degraded', status: 'True' },
      ])
    })
  })

  describe('ConfigMap', () => {
    it('should handle ConfigMap resource transformation with network latency test config', () => {
      const configMapItem = {
        ...baseSearchItem,
        kind: 'ConfigMap',
        apigroup: '',
        configParamMaxDesiredLatency: '1000',
        configParamNADNamespace: 'openshift-cnv',
        configParamNADName: 'my-nad',
        configParamTargetNode: 'worker-1',
        configParamSourceNode: 'worker-2',
        configParamSampleDuration: '30',
        configTimeout: '60',
        configCompletionTimestamp: '2025-01-15T12:00:00Z',
        configStartTimestamp: '2025-01-15T11:59:00Z',
        configSucceeded: 'true',
        configStatusAVGLatencyNano: '500000',
        configStatusMaxLatencyNano: '800000',
        configStatusMinLatencyNano: '200000',
        configStatusMeasurementDuration: '30',
        configStatusTargetNode: 'worker-1',
        configStatusSourceNode: 'worker-2',
      }

      const result = convert(configMapItem)

      expect(result.data?.spec?.param?.maxDesiredLatencyMilliseconds).toBe('1000')
      expect(result.data?.spec?.param?.networkAttachmentDefinitionNamespace).toBe('openshift-cnv')
      expect(result.data?.spec?.param?.networkAttachmentDefinitionName).toBe('my-nad')
      expect(result.data?.spec?.param?.targetNode).toBe('worker-1')
      expect(result.data?.spec?.param?.sourceNode).toBe('worker-2')
      expect(result.data?.spec?.param?.sampleDurationSeconds).toBe('30')
      expect(result.data?.spec?.timeout).toBe('60')
      expect(result.data?.status?.completionTimestamp).toBe('2025-01-15T12:00:00Z')
      expect(result.data?.status?.startTimestamp).toBe('2025-01-15T11:59:00Z')
      expect(result.data?.status?.succeeded).toBe('true')
      expect(result.data?.status?.result?.avgLatencyNanoSec).toBe('500000')
      expect(result.data?.status?.result?.maxLatencyNanoSec).toBe('800000')
      expect(result.data?.status?.result?.minLatencyNanoSec).toBe('200000')
      expect(result.data?.status?.result?.measurementDurationSec).toBe('30')
      expect(result.data?.status?.result?.targetNode).toBe('worker-1')
      expect(result.data?.status?.result?.sourceNode).toBe('worker-2')
    })

    it('should handle ConfigMap with failure reason', () => {
      const configMapItem = {
        ...baseSearchItem,
        kind: 'ConfigMap',
        apigroup: '',
        configParamTargetNode: 'worker-1',
        configParamSourceNode: 'worker-2',
        configStartTimestamp: '2025-01-15T11:59:00Z',
        configFailureReason: 'Connection timeout',
        configSucceeded: 'false',
      }

      const result = convert(configMapItem)

      expect(result.data?.spec?.param?.targetNode).toBe('worker-1')
      expect(result.data?.spec?.param?.sourceNode).toBe('worker-2')
      expect(result.data?.status?.startTimestamp).toBe('2025-01-15T11:59:00Z')
      expect(result.data?.status?.failureReason).toBe('Connection timeout')
      expect(result.data?.status?.succeeded).toBe('false')
    })

    it('should handle ConfigMap with partial fields', () => {
      const configMapItem = {
        ...baseSearchItem,
        kind: 'ConfigMap',
        apigroup: '',
        configParamTargetNode: 'worker-1',
      }

      const result = convert(configMapItem)

      expect(result.data?.spec?.param?.targetNode).toBe('worker-1')
      expect(result.data?.spec?.param?.sourceNode).toBeUndefined()
      expect(result.data?.status?.result).toBeUndefined()
    })
  })

  describe('DataImportCron.cdi.kubevirt.io', () => {
    it('should handle DataImportCron resource transformation', () => {
      const dataImportCronItem = {
        ...baseSearchItem,
        kind: 'DataImportCron',
        apigroup: 'cdi.kubevirt.io',
        managedDataSource: 'fedora-image',
      }

      const result = convert(dataImportCronItem)

      expect(result.spec?.managedDataSource).toBe('fedora-image')
    })

    it('should handle DataImportCron with undefined managedDataSource', () => {
      const dataImportCronItem = {
        ...baseSearchItem,
        kind: 'DataImportCron',
        apigroup: 'cdi.kubevirt.io',
      }

      const result = convert(dataImportCronItem)

      expect(result.spec?.managedDataSource).toBeUndefined()
    })
  })

  describe('DataSource.cdi.kubevirt.io', () => {
    it('should handle DataSource resource transformation with PVC source', () => {
      const dataSourceItem = {
        ...baseSearchItem,
        kind: 'DataSource',
        apigroup: 'cdi.kubevirt.io',
        pvcName: 'my-pvc',
        pvcNamespace: 'my-namespace',
      }

      const result = convert(dataSourceItem)

      expect(result.spec?.source?.pvc?.name).toBe('my-pvc')
      expect(result.spec?.source?.pvc?.namespace).toBe('my-namespace')
    })

    it('should handle DataSource resource transformation with snapshot source', () => {
      const dataSourceItem = {
        ...baseSearchItem,
        kind: 'DataSource',
        apigroup: 'cdi.kubevirt.io',
        snapshotName: 'my-snapshot',
        snapshotNamespace: 'snapshot-namespace',
      }

      const result = convert(dataSourceItem)

      expect(result.spec?.source?.snapshot?.name).toBe('my-snapshot')
      expect(result.spec?.source?.snapshot?.namespace).toBe('snapshot-namespace')
    })

    it('should handle DataSource with partial fields', () => {
      const dataSourceItem = {
        ...baseSearchItem,
        kind: 'DataSource',
        apigroup: 'cdi.kubevirt.io',
        pvcName: 'only-pvc-name',
      }

      const result = convert(dataSourceItem)

      expect(result.spec?.source?.pvc?.name).toBe('only-pvc-name')
      expect(result.spec?.source?.pvc?.namespace).toBeUndefined()
      expect(result.spec?.source?.snapshot?.name).toBeUndefined()
    })
  })

  describe('DataVolume.cdi.kubevirt.io', () => {
    it('should handle DataVolume resource transformation', () => {
      const dataVolumeItem = {
        ...baseSearchItem,
        kind: 'DataVolume',
        apigroup: 'cdi.kubevirt.io',
        size: '10Gi',
        storageClassName: 'ssd-csi',
        phase: 'Succeeded',
      }

      const result = convert(dataVolumeItem)

      expect(result.spec?.storage?.resources?.requests?.storage).toBe('10Gi')
      expect(result.spec?.storage?.storageClassName).toBe('ssd-csi')
      expect(result.status?.phase).toBe('Succeeded')
    })

    it('should handle DataVolume with PVC source', () => {
      const dataVolumeItem = {
        ...baseSearchItem,
        kind: 'DataVolume',
        apigroup: 'cdi.kubevirt.io',
        pvcName: 'source-pvc',
        pvcNamespace: 'source-namespace',
        size: '10Gi',
      }

      const result = convert(dataVolumeItem)

      expect(result.spec?.source?.pvc?.name).toBe('source-pvc')
      expect(result.spec?.source?.pvc?.namespace).toBe('source-namespace')
      expect(result.spec?.storage?.resources?.requests?.storage).toBe('10Gi')
    })

    it('should handle DataVolume with snapshot source', () => {
      const dataVolumeItem = {
        ...baseSearchItem,
        kind: 'DataVolume',
        apigroup: 'cdi.kubevirt.io',
        snapshotName: 'source-snapshot',
        snapshotNamespace: 'snapshot-namespace',
        size: '20Gi',
      }

      const result = convert(dataVolumeItem)

      expect(result.spec?.source?.snapshot?.name).toBe('source-snapshot')
      expect(result.spec?.source?.snapshot?.namespace).toBe('snapshot-namespace')
      expect(result.spec?.storage?.resources?.requests?.storage).toBe('20Gi')
    })

    it('should handle DataVolume with partial fields', () => {
      const dataVolumeItem = {
        ...baseSearchItem,
        kind: 'DataVolume',
        apigroup: 'cdi.kubevirt.io',
        size: '20Gi',
      }

      const result = convert(dataVolumeItem)

      expect(result.spec?.storage?.resources?.requests?.storage).toBe('20Gi')
      expect(result.spec?.storage?.storageClassName).toBeUndefined()
      expect(result.spec?.source?.pvc?.name).toBeUndefined()
      expect(result.spec?.source?.snapshot?.name).toBeUndefined()
      expect(result.status?.phase).toBeUndefined()
    })
  })

  describe('MigrationPolicy.migrations.kubevirt.io', () => {
    it('should handle MigrationPolicy resource transformation', () => {
      const migrationPolicyItem = {
        ...baseSearchItem,
        kind: 'MigrationPolicy',
        apigroup: 'migrations.kubevirt.io',
        allowAutoConverge: 'true',
        allowPostCopy: 'false',
        bandwidthPerMigration: '1073741824',
        completionTimeoutPerGiB: '800',
        _namespaceSelector: 'environment=production;team=backend',
        _virtualMachineInstanceSelector: 'app=database;tier=critical',
      }

      const result = convert(migrationPolicyItem)

      expect(result.spec?.allowAutoConverge).toBe(true)
      expect(result.spec?.allowPostCopy).toBe(false)
      expect(result.spec?.bandwidthPerMigration).toBe(1073741824)
      expect(result.spec?.completionTimeoutPerGiB).toBe(800)
      expect(result.spec?.selectors?.namespaceSelector).toEqual({
        environment: 'production',
        team: 'backend',
      })
      expect(result.spec?.selectors?.virtualMachineInstanceSelector).toEqual({
        app: 'database',
        tier: 'critical',
      })
    })

    it('should handle MigrationPolicy with partial fields', () => {
      const migrationPolicyItem = {
        ...baseSearchItem,
        kind: 'MigrationPolicy',
        apigroup: 'migrations.kubevirt.io',
        allowAutoConverge: true,
      }

      const result = convert(migrationPolicyItem)

      expect(result.spec?.allowAutoConverge).toBe(true)
      expect(result.spec?.allowPostCopy).toBeUndefined()
      expect(result.spec?.bandwidthPerMigration).toBeUndefined()
      expect(result.spec?.completionTimeoutPerGiB).toBeUndefined()
      expect(result.spec?.selectors?.namespaceSelector).toBeUndefined()
      expect(result.spec?.selectors?.virtualMachineInstanceSelector).toBeUndefined()
    })

    it('should handle MigrationPolicy with only namespaceSelector', () => {
      const migrationPolicyItem = {
        ...baseSearchItem,
        kind: 'MigrationPolicy',
        apigroup: 'migrations.kubevirt.io',
        _namespaceSelector: 'environment=staging',
      }

      const result = convert(migrationPolicyItem)

      expect(result.spec?.selectors?.namespaceSelector).toEqual({
        environment: 'staging',
      })
      expect(result.spec?.selectors?.virtualMachineInstanceSelector).toBeUndefined()
    })

    it('should handle MigrationPolicy with only virtualMachineInstanceSelector', () => {
      const migrationPolicyItem = {
        ...baseSearchItem,
        kind: 'MigrationPolicy',
        apigroup: 'migrations.kubevirt.io',
        _virtualMachineInstanceSelector: 'workload=server',
      }

      const result = convert(migrationPolicyItem)

      expect(result.spec?.selectors?.namespaceSelector).toBeUndefined()
      expect(result.spec?.selectors?.virtualMachineInstanceSelector).toEqual({
        workload: 'server',
      })
    })

    it('should handle MigrationPolicy with empty selector strings', () => {
      const migrationPolicyItem = {
        ...baseSearchItem,
        kind: 'MigrationPolicy',
        apigroup: 'migrations.kubevirt.io',
        _namespaceSelector: '',
        _virtualMachineInstanceSelector: '',
      }

      const result = convert(migrationPolicyItem)

      expect(result.spec?.selectors?.namespaceSelector).toBeUndefined()
      expect(result.spec?.selectors?.virtualMachineInstanceSelector).toBeUndefined()
    })
  })

  describe('Namespace', () => {
    it('should handle Namespace resource transformation', () => {
      const namespaceItem = {
        ...baseSearchItem,
        kind: 'Namespace',
        apigroup: '',
        status: 'Active',
      }

      const result = convert(namespaceItem)

      expect(result.status?.phase).toBe('Active')
    })

    it('should handle Namespace with Terminating status', () => {
      const namespaceItem = {
        ...baseSearchItem,
        kind: 'Namespace',
        apigroup: '',
        status: 'Terminating',
      }

      const result = convert(namespaceItem)

      expect(result.status?.phase).toBe('Terminating')
    })
  })

  describe('Node', () => {
    it('should handle Node resource transformation', () => {
      const nodeItem = {
        ...baseSearchItem,
        kind: 'Node',
        apigroup: '',
        ipAddress: '192.168.1.100',
        memoryAllocatable: '8Gi',
        memoryCapacity: '16Gi',
        architecture: 'amd64',
      }

      const result = convert(nodeItem)

      expect(result.status?.addresses).toEqual([{ type: 'InternalIP', address: '192.168.1.100' }])
      expect(result.status?.allocatable?.memory).toBe('8Gi')
      expect(result.status?.capacity?.memory).toBe('16Gi')
      expect(result.status?.nodeInfo?.architecture).toBe('amd64')
    })

    it('should handle Node with conditions', () => {
      const nodeItem = {
        ...baseSearchItem,
        kind: 'Node',
        apigroup: '',
        ipAddress: '127.0.0.1',
        memoryAllocatable: '5Gi',
        memoryCapacity: '10Gi',
        condition: 'Ready=True;MemoryPressure=False',
      }

      const result = convert(nodeItem)

      expect(result.status?.addresses).toEqual([{ type: 'InternalIP', address: '127.0.0.1' }])
      expect(result.status?.conditions).toEqual([
        { type: 'Ready', status: 'True' },
        { type: 'MemoryPressure', status: 'False' },
      ])
    })

    it('should handle Node with partial fields', () => {
      const nodeItem = {
        ...baseSearchItem,
        kind: 'Node',
        apigroup: '',
        ipAddress: '10.0.0.1',
      }

      const result = convert(nodeItem)

      expect(result.status?.addresses).toEqual([{ type: 'InternalIP', address: '10.0.0.1' }])
      expect(result.status?.allocatable?.memory).toBeUndefined()
      expect(result.status?.capacity?.memory).toBeUndefined()
    })
  })

  describe('PersistentVolumeClaim', () => {
    it('should handle PersistentVolumeClaim resource transformation', () => {
      const pvcItem = {
        ...baseSearchItem,
        kind: 'PersistentVolumeClaim',
        apigroup: '',
        requestedStorage: '5Gi',
        storageClassName: 'gp3-csi',
        volumeMode: 'Filesystem',
        status: 'Bound',
        capacity: '5Gi',
      }

      const result = convert(pvcItem)

      expect(result.spec).toEqual({
        resources: {
          requests: {
            storage: '5Gi',
          },
        },
        storageClassName: 'gp3-csi',
        volumeMode: 'Filesystem',
      })
      expect(result.status).toEqual({
        phase: 'Bound',
        capacity: { storage: '5Gi' },
      })
    })

    it('should handle PersistentVolumeClaim with Pending status', () => {
      const pvcItem = {
        ...baseSearchItem,
        kind: 'PersistentVolumeClaim',
        apigroup: '',
        requestedStorage: '10Gi',
        status: 'Pending',
      }

      const result = convert(pvcItem)

      expect(result.spec?.resources?.requests?.storage).toBe('10Gi')
      expect(result.status?.phase).toBe('Pending')
      expect(result.status?.capacity).toBeUndefined()
    })
  })

  describe('Pod', () => {
    it('should handle Pod resource transformation with ownerReferences and initContainers', () => {
      const podItem = {
        ...baseSearchItem,
        kind: 'Pod',
        apigroup: '',
        _ownerUID: 'test-cluster/abc-123-def-456',
        initContainer: 'init-db;init-config',
      }

      const result = convert(podItem)

      expect(result.metadata?.ownerReferences).toEqual([{ uid: 'abc-123-def-456' }])
      expect(result.spec?.initContainers).toEqual([{ name: 'init-db' }, { name: 'init-config' }])
    })

    it('should handle Pod with only ownerReferences', () => {
      const podItem = {
        ...baseSearchItem,
        kind: 'Pod',
        apigroup: '',
        _ownerUID: 'local-cluster/owner-uid-789',
      }

      const result = convert(podItem)

      expect(result.metadata?.ownerReferences).toEqual([{ uid: 'owner-uid-789' }])
      expect(result.spec?.initContainers).toBeUndefined()
    })

    it('should handle Pod with single initContainer', () => {
      const podItem = {
        ...baseSearchItem,
        kind: 'Pod',
        apigroup: '',
        initContainer: 'init-setup',
      }

      const result = convert(podItem)

      expect(result.spec?.initContainers).toEqual([{ name: 'init-setup' }])
      expect(result.metadata?.ownerReferences).toBeUndefined()
    })

    it('should handle Pod with _ownerUID in direct format', () => {
      const podItem = {
        ...baseSearchItem,
        kind: 'Pod',
        apigroup: '',
        _ownerUID: 'direct-owner-uid',
      }

      const result = convert(podItem)

      expect(result.metadata?.ownerReferences).toEqual([{ uid: 'direct-owner-uid' }])
    })

    it('should handle Pod with no special fields', () => {
      const podItem = {
        ...baseSearchItem,
        kind: 'Pod',
        apigroup: '',
      }

      const result = convert(podItem)

      expect(result.metadata?.ownerReferences).toBeUndefined()
      expect(result.spec?.initContainers).toBeUndefined()
    })

    it('should handle Pod with empty initContainer string', () => {
      const podItem = {
        ...baseSearchItem,
        kind: 'Pod',
        apigroup: '',
        initContainer: '',
      }

      const result = convert(podItem)

      expect(result.spec?.initContainers).toBeUndefined()
    })
  })

  describe('StorageClass.storage.k8s.io', () => {
    it('should handle StorageClass resource transformation', () => {
      const storageClassItem = {
        ...baseSearchItem,
        kind: 'StorageClass',
        apigroup: 'storage.k8s.io',
        allowVolumeExpansion: true,
        provisioner: 'kubernetes.io/aws-ebs',
        reclaimPolicy: 'Delete',
        volumeBindingMode: 'WaitForFirstConsumer',
      }

      const result = convert(storageClassItem)

      expect(result.allowVolumeExpansion).toBe(true)
      expect(result.provisioner).toBe('kubernetes.io/aws-ebs')
      expect(result.reclaimPolicy).toBe('Delete')
      expect(result.volumeBindingMode).toBe('WaitForFirstConsumer')
    })

    it('should handle StorageClass with partial fields', () => {
      const storageClassItem = {
        ...baseSearchItem,
        kind: 'StorageClass',
        apigroup: 'storage.k8s.io',
        provisioner: 'kubernetes.io/gce-pd',
      }

      const result = convert(storageClassItem)

      expect(result.provisioner).toBe('kubernetes.io/gce-pd')
      expect(result.allowVolumeExpansion).toBeUndefined()
      expect(result.reclaimPolicy).toBeUndefined()
    })
  })

  describe('Subscription.operators.coreos.com', () => {
    it('should handle Subscription resource transformation', () => {
      const subscriptionItem = {
        ...baseSearchItem,
        kind: 'Subscription',
        apigroup: 'operators.coreos.com',
        source: 'redhat-operators',
        package: 'elasticsearch-operator',
        channel: 'stable',
        installplan: 'elasticsearch-operator.v5.8.0',
        phase: 'AtLatestKnown',
      }

      const result = convert(subscriptionItem)

      expect(result.spec).toEqual({
        source: 'redhat-operators',
        name: 'elasticsearch-operator',
        channel: 'stable',
      })
      expect(result.status).toEqual({
        installedCSV: 'elasticsearch-operator.v5.8.0',
        state: 'AtLatestKnown',
      })
    })

    it('should handle Subscription with partial fields', () => {
      const subscriptionItem = {
        ...baseSearchItem,
        kind: 'Subscription',
        apigroup: 'operators.coreos.com',
        source: 'community-operators',
        package: 'my-operator',
      }

      const result = convert(subscriptionItem)

      expect(result.spec?.source).toBe('community-operators')
      expect(result.spec?.name).toBe('my-operator')
      expect(result.spec?.channel).toBeUndefined()
      expect(result.status?.installedCSV).toBeUndefined()
    })
  })

  describe('VirtualMachine.kubevirt.io', () => {
    it('should handle VirtualMachine resource transformation', () => {
      const vmItem = {
        ...baseSearchItem,
        kind: 'VirtualMachine',
        apigroup: 'kubevirt.io',
        cpu: '4',
        memory: '8Gi',
        ready: 'True',
        status: 'Running',
        flavor: 'large',
        osName: 'rhel8',
        workload: 'server',
        runStrategy: 'Always',
        architecture: 'amd64',
        instancetype: 'u1.medium',
        preference: 'rhel.9',
      }

      const result = convert(vmItem)

      expect(result.spec).toEqual({
        instancetype: { name: 'u1.medium' },
        preference: { name: 'rhel.9' },
        runStrategy: 'Always',
        template: {
          spec: {
            architecture: 'amd64',
            domain: {
              cpu: { cores: 4 },
              memory: { guest: '8Gi' },
            },
          },
          metadata: {
            annotations: {
              'vm.kubevirt.io/flavor': 'large',
              'vm.kubevirt.io/os': 'rhel8',
              'vm.kubevirt.io/workload': 'server',
            },
          },
        },
      })
      expect(result.status?.printableStatus).toBe('Running')
      expect(result.status?.conditions).toEqual([{ type: 'Ready', status: 'True' }])
    })

    it('should handle VirtualMachine with dataVolumeNames', () => {
      const vmItem = {
        ...baseSearchItem,
        kind: 'VirtualMachine',
        apigroup: 'kubevirt.io',
        dataVolumeNames: 'volume1;volume2;volume3',
      }

      const result = convert(vmItem)

      expect(result.spec?.template?.spec?.volumes).toEqual([
        { dataVolume: { name: 'volume1' } },
        { dataVolume: { name: 'volume2' } },
        { dataVolume: { name: 'volume3' } },
      ])
    })

    it('should handle VirtualMachine with pvcClaimNames', () => {
      const vmItem = {
        ...baseSearchItem,
        kind: 'VirtualMachine',
        apigroup: 'kubevirt.io',
        pvcClaimNames: 'pvc1;pvc2',
      }

      const result = convert(vmItem)

      expect(result.spec?.template?.spec?.volumes).toEqual([
        { persistentVolumeClaim: { claimName: 'pvc1' } },
        { persistentVolumeClaim: { claimName: 'pvc2' } },
      ])
    })

    it('should handle VirtualMachine with both dataVolumeNames and pvcClaimNames', () => {
      const vmItem = {
        ...baseSearchItem,
        kind: 'VirtualMachine',
        apigroup: 'kubevirt.io',
        dataVolumeNames: 'dv1;dv2',
        pvcClaimNames: 'pvc1;pvc2',
      }

      const result = convert(vmItem)

      expect(result.spec?.template?.spec?.volumes).toEqual([
        { dataVolume: { name: 'dv1' } },
        { dataVolume: { name: 'dv2' } },
        { persistentVolumeClaim: { claimName: 'pvc1' } },
        { persistentVolumeClaim: { claimName: 'pvc2' } },
      ])
    })

    it('should handle VirtualMachine with agentConnected condition', () => {
      const vmItem = {
        ...baseSearchItem,
        kind: 'VirtualMachine',
        apigroup: 'kubevirt.io',
        ready: 'True',
        agentConnected: 'True',
      }

      const result = convert(vmItem)

      expect(result.status?.conditions).toEqual([
        { type: 'Ready', status: 'True' },
        { type: 'AgentConnected', status: 'True' },
      ])
    })

    it('should use condition string over individual conditions if provided', () => {
      const vmItem = {
        ...baseSearchItem,
        kind: 'VirtualMachine',
        apigroup: 'kubevirt.io',
        ready: 'False',
        agentConnected: 'False',
        condition: 'Ready=True;AgentConnected=True',
      }

      const result = convert(vmItem)

      // When condition string is provided, it takes precedence
      expect(result.status?.conditions).toEqual([
        { type: 'Ready', status: 'True' },
        { type: 'AgentConnected', status: 'True' },
      ])
    })

    it('should handle empty dataVolumeNames and pvcClaimNames', () => {
      const vmItem = {
        ...baseSearchItem,
        kind: 'VirtualMachine',
        apigroup: 'kubevirt.io',
        dataVolumeNames: '',
        pvcClaimNames: '',
      }

      const result = convert(vmItem)

      expect(result.spec?.template?.spec?.volumes).toBeUndefined()
    })

    it('should handle dataVolumeNames with extra spaces', () => {
      const vmItem = {
        ...baseSearchItem,
        kind: 'VirtualMachine',
        apigroup: 'kubevirt.io',
        dataVolumeNames: ' volume1 ; volume2 ',
      }

      const result = convert(vmItem)

      expect(result.spec?.template?.spec?.volumes).toEqual([
        { dataVolume: { name: 'volume1' } },
        { dataVolume: { name: 'volume2' } },
      ])
    })
  })

  describe('VirtualMachineClone.clone.kubevirt.io', () => {
    it('should handle VirtualMachineClone resource transformation', () => {
      const vmCloneItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineClone',
        apigroup: 'clone.kubevirt.io',
        sourceKind: 'VirtualMachine',
        sourceName: 'source-vm',
        targetKind: 'VirtualMachine',
        targetName: 'cloned-vm',
        phase: 'Succeeded',
      }

      const result = convert(vmCloneItem)

      expect(result.spec?.source?.kind).toBe('VirtualMachine')
      expect(result.spec?.source?.name).toBe('source-vm')
      expect(result.spec?.target?.kind).toBe('VirtualMachine')
      expect(result.spec?.target?.name).toBe('cloned-vm')
      expect(result.status?.phase).toBe('Succeeded')
    })

    it('should handle VirtualMachineClone with partial fields', () => {
      const vmCloneItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineClone',
        apigroup: 'clone.kubevirt.io',
        sourceKind: 'VirtualMachine',
        sourceName: 'my-vm',
        phase: 'Running',
      }

      const result = convert(vmCloneItem)

      expect(result.spec?.source?.kind).toBe('VirtualMachine')
      expect(result.spec?.source?.name).toBe('my-vm')
      expect(result.spec?.target?.kind).toBeUndefined()
      expect(result.spec?.target?.name).toBeUndefined()
      expect(result.status?.phase).toBe('Running')
    })
  })

  describe('VirtualMachineInstance.kubevirt.io', () => {
    it('should handle VirtualMachineInstance resource transformation', () => {
      const vmiItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstance',
        apigroup: 'kubevirt.io',
        cpu: '4',
        cpuSockets: '2',
        cpuThreads: '2',
        memory: '8Gi',
        liveMigratable: 'True',
        ready: 'True',
        ipaddress: '10.128.0.50',
        node: 'worker-1',
        phase: 'Running',
        osVersion: 'Red Hat Enterprise Linux 8.6',
      }

      const result = convert(vmiItem)

      expect(result.spec).toEqual({
        domain: {
          cpu: {
            cores: 4,
            sockets: 2,
            threads: 2,
          },
          memory: { guest: '8Gi' },
        },
      })
      expect(result.status).toEqual({
        conditions: [
          { type: 'LiveMigratable', status: 'True' },
          { type: 'Ready', status: 'True' },
        ],
        interfaces: [{ ipAddress: '10.128.0.50', name: 'default' }],
        nodeName: 'worker-1',
        phase: 'Running',
        guestOSInfo: { version: 'Red Hat Enterprise Linux 8.6' },
      })
    })

    it('should handle VirtualMachineInstance with partial fields', () => {
      const vmiItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstance',
        apigroup: 'kubevirt.io',
        cpu: '2',
        memory: '4Gi',
        phase: 'Running',
      }

      const result = convert(vmiItem)

      expect(result.spec?.domain?.cpu?.cores).toBe(2)
      expect(result.spec?.domain?.memory?.guest).toBe('4Gi')
      expect(result.status?.phase).toBe('Running')
      expect(result.status?.interfaces).toBeUndefined()
    })

    it('should use condition string over individual conditions if provided', () => {
      const vmiItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstance',
        apigroup: 'kubevirt.io',
        liveMigratable: 'True',
        ready: 'True',
        condition: 'LiveMigratable=False;Ready=False',
      }

      const result = convert(vmiItem)

      expect(result.status?.conditions).toEqual([
        { type: 'LiveMigratable', status: 'False' },
        { type: 'Ready', status: 'False' },
      ])
    })

    it('should set spec.domain.devices.gpus from gpuName', () => {
      const vmiItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstance',
        apigroup: 'kubevirt.io',
        gpuName: 'nvidia.com/GPU',
      }

      const result = convert(vmiItem)

      expect(result.spec?.domain?.devices?.gpus).toEqual([{ name: 'nvidia.com/GPU' }])
    })

    it('should set spec.domain.devices.hostDevices from hostDeviceName', () => {
      const vmiItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstance',
        apigroup: 'kubevirt.io',
        hostDeviceName: 'host-device-1;host-device-2',
      }

      const result = convert(vmiItem)

      expect(result.spec?.domain?.devices?.hostDevices).toEqual([{ name: 'host-device-1' }, { name: 'host-device-2' }])
    })

    it('should set spec.domain.devices.interfaces from interfaceName', () => {
      const vmiItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstance',
        apigroup: 'kubevirt.io',
        interfaceName: 'bridge;masquerade',
      }

      const result = convert(vmiItem)

      expect(result.spec?.domain?.devices?.interfaces).toEqual([{ name: 'bridge' }, { name: 'masquerade' }])
    })

    it('should parse _interface with name and interfaceName into status.interfaces', () => {
      const vmiItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstance',
        apigroup: 'kubevirt.io',
        phase: 'Running',
        _interface: 'default/eth0[0]=10.0.0.1',
      }

      const result = convert(vmiItem)

      expect(result.status?.interfaces).toEqual([
        {
          name: 'default',
          interfaceName: 'eth0',
          ipAddress: '10.0.0.1',
          ipAddresses: ['10.0.0.1'],
        },
      ])
    })

    it('should parse _interface when one entry has no name (only interfaceName and ipAddress)', () => {
      const vmiItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstance',
        apigroup: 'kubevirt.io',
        phase: 'Running',
        _interface: 'default/eth0[0]=10.0.0.1; /eth1[0]=10.0.0.2',
      }

      const result = convert(vmiItem)

      expect(result.status?.interfaces).toHaveLength(2)
      expect(result.status?.interfaces?.[0]).toEqual({
        name: 'default',
        interfaceName: 'eth0',
        ipAddress: '10.0.0.1',
        ipAddresses: ['10.0.0.1'],
      })
      // Second interface has no name—only interfaceName and ipAddress (e.g. " /eth1[0]=10.0.0.2")
      expect(result.status?.interfaces?.[1]).toEqual({
        interfaceName: 'eth1',
        ipAddress: '10.0.0.2',
        ipAddresses: ['10.0.0.2'],
      })
    })

    it('should parse _interface when one entry has no interfaceName (only optional name and ipAddress)', () => {
      const vmiItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstance',
        apigroup: 'kubevirt.io',
        phase: 'Running',
        _interface: 'default/[0]=10.0.0.1; /[0]=10.0.0.2',
      }

      const result = convert(vmiItem)

      expect(result.status?.interfaces).toHaveLength(2)
      expect(result.status?.interfaces?.[0]).toEqual({
        name: 'default',
        ipAddress: '10.0.0.1',
        ipAddresses: ['10.0.0.1'],
      })
      // Second interface has neither name nor interfaceName
      expect(result.status?.interfaces?.[1]).toEqual({
        ipAddress: '10.0.0.2',
        ipAddresses: ['10.0.0.2'],
      })
    })

    it('should parse _interface with multiple ipAddresses for same interface', () => {
      const vmiItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstance',
        apigroup: 'kubevirt.io',
        phase: 'Running',
        _interface: 'default/eth0[0]=10.0.0.1; default/eth0[1]=10.0.0.3',
      }

      const result = convert(vmiItem)

      expect(result.status?.interfaces).toEqual([
        {
          name: 'default',
          interfaceName: 'eth0',
          ipAddress: '10.0.0.1',
          ipAddresses: ['10.0.0.1', '10.0.0.3'],
        },
      ])
    })
  })

  describe('VirtualMachineInstanceMigration.kubevirt.io', () => {
    it('should handle VirtualMachineInstanceMigration resource transformation', () => {
      const vmimItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstanceMigration',
        apigroup: 'kubevirt.io',
        phase: 'Succeeded',
        endTime: '2025-01-15T10:30:00Z',
        vmiName: 'test-vm-instance',
        deleted: '2025-01-15T10:30:00Z',
        migrationPolicyName: 'test-migration-policy',
        sourceNode: 'test-source-node',
        sourcePod: 'test-source-pod',
        targetNode: 'test-target-node',
      }

      const result = convert(vmimItem)

      expect(result.metadata.deletionTimestamp).toBe('2025-01-15T10:30:00Z')
      expect(result.status).toEqual({
        phase: 'Succeeded',
        migrationState: {
          endTimestamp: '2025-01-15T10:30:00Z',
          migrationPolicyName: 'test-migration-policy',
          sourceNode: 'test-source-node',
          sourcePod: 'test-source-pod',
          targetNode: 'test-target-node',
        },
      })
      expect(result.spec).toEqual({
        vmiName: 'test-vm-instance',
      })
    })

    it('should handle VirtualMachineInstanceMigration in Running phase', () => {
      const vmimItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstanceMigration',
        apigroup: 'kubevirt.io',
        phase: 'Running',
        vmiName: 'migrating-vm',
      }

      const result = convert(vmimItem)

      expect(result.status?.phase).toBe('Running')
      expect(result.status?.migrationState?.endTimestamp).toBeUndefined()
      expect(result.spec?.vmiName).toBe('migrating-vm')
    })
  })

  describe('VirtualMachineInstancetype.instancetype.kubevirt.io and VirtualMachineClusterInstancetype.instancetype.kubevirt.io', () => {
    it('should handle VirtualMachineInstancetype resource transformation', () => {
      const instancetypeItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstancetype',
        apigroup: 'instancetype.kubevirt.io',
        cpuGuest: '4',
        memoryGuest: '8589934592',
      }

      const result = convert(instancetypeItem)

      expect(result.spec?.cpu?.guest).toBe(4)
      expect(result.spec?.memory?.guest).toBe(8589934592)
    })

    it('should handle VirtualMachineInstancetype with partial fields', () => {
      const instancetypeItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineInstancetype',
        apigroup: 'instancetype.kubevirt.io',
        cpuGuest: '2',
      }

      const result = convert(instancetypeItem)

      expect(result.spec?.cpu?.guest).toBe(2)
      expect(result.spec?.memory?.guest).toBeUndefined()
    })

    it('should handle VirtualMachineClusterInstancetype resource transformation', () => {
      const clusterInstancetypeItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineClusterInstancetype',
        apigroup: 'instancetype.kubevirt.io',
        cpuGuest: '8',
        memoryGuest: '17179869184',
      }

      const result = convert(clusterInstancetypeItem)

      expect(result.spec?.cpu?.guest).toBe(8)
      expect(result.spec?.memory?.guest).toBe(17179869184)
    })

    it('should handle VirtualMachineClusterInstancetype with partial fields', () => {
      const clusterInstancetypeItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineClusterInstancetype',
        apigroup: 'instancetype.kubevirt.io',
        memoryGuest: '4294967296',
      }

      const result = convert(clusterInstancetypeItem)

      expect(result.spec?.cpu?.guest).toBeUndefined()
      expect(result.spec?.memory?.guest).toBe(4294967296)
    })
  })

  describe('VirtualMachineSnapshot.snapshot.kubevirt.io', () => {
    it('should handle VirtualMachineSnapshot resource transformation', () => {
      const snapshotItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineSnapshot',
        apigroup: 'snapshot.kubevirt.io',
        ready: 'True',
        phase: 'Succeeded',
        indications: 'Online;NoGuestAgent',
        sourceKind: 'VirtualMachine',
        sourceName: 'source-vm',
        readyToUse: true,
      }

      const result = convert(snapshotItem)

      expect(result.status?.conditions).toEqual([{ type: 'Ready', status: 'True' }])
      expect(result.status?.phase).toBe('Succeeded')
      expect(result.status?.indications).toEqual(['Online', 'NoGuestAgent'])
      expect(result.spec?.source?.kind).toBe('VirtualMachine')
      expect(result.spec?.source?.name).toBe('source-vm')
      expect(result.status?.readyToUse).toBe(true)
    })

    it('should handle VirtualMachineSnapshot with single indication', () => {
      const snapshotItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineSnapshot',
        apigroup: 'snapshot.kubevirt.io',
        indications: 'Online',
      }

      const result = convert(snapshotItem)

      expect(result.status?.indications).toEqual(['Online'])
    })

    it('should handle VirtualMachineSnapshot with partial fields', () => {
      const snapshotItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineSnapshot',
        apigroup: 'snapshot.kubevirt.io',
        phase: 'InProgress',
        sourceKind: 'VirtualMachine',
        sourceName: 'my-vm',
      }

      const result = convert(snapshotItem)

      expect(result.status?.phase).toBe('InProgress')
      expect(result.spec?.source?.kind).toBe('VirtualMachine')
      expect(result.spec?.source?.name).toBe('my-vm')
      expect(result.status?.conditions).toBeUndefined()
      expect(result.status?.indications).toBeUndefined()
      expect(result.status?.readyToUse).toBeUndefined()
    })

    it('should handle VirtualMachineSnapshot with readyToUse false', () => {
      const snapshotItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineSnapshot',
        apigroup: 'snapshot.kubevirt.io',
        ready: 'False',
        readyToUse: 'false',
      }

      const result = convert(snapshotItem)

      expect(result.status?.conditions).toEqual([{ type: 'Ready', status: 'False' }])
      expect(result.status?.readyToUse).toBe(false)
    })

    it('should use condition string over ready field if provided', () => {
      const snapshotItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineSnapshot',
        apigroup: 'snapshot.kubevirt.io',
        ready: 'True',
        condition: 'Ready=False;Progressing=True',
      }

      const result = convert(snapshotItem)

      expect(result.status?.conditions).toEqual([
        { type: 'Ready', status: 'False' },
        { type: 'Progressing', status: 'True' },
      ])
    })
  })

  describe('VirtualMachineRestore.snapshot.kubevirt.io', () => {
    it('should handle VirtualMachineRestore resource transformation', () => {
      const restoreItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineRestore',
        apigroup: 'snapshot.kubevirt.io',
        ready: 'True',
        restoreTime: '2025-01-15T12:00:00Z',
        complete: true,
        targetApiGroup: 'kubevirt.io',
        targetKind: 'VirtualMachine',
        targetName: 'restored-vm',
        virtualMachineSnapshotName: 'test-snapshot',
      }

      const result = convert(restoreItem)

      expect(result.status?.conditions).toEqual([{ type: 'Ready', status: 'True' }])
      expect(result.status?.restoreTime).toBe('2025-01-15T12:00:00Z')
      expect(result.status?.complete).toBe(true)
      expect(result.spec?.target?.apiGroup).toBe('kubevirt.io')
      expect(result.spec?.target?.kind).toBe('VirtualMachine')
      expect(result.spec?.target?.name).toBe('restored-vm')
      expect(result.spec?.virtualMachineSnapshotName).toBe('test-snapshot')
    })

    it('should handle VirtualMachineRestore in progress', () => {
      const restoreItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineRestore',
        apigroup: 'snapshot.kubevirt.io',
        ready: 'False',
        complete: false,
        targetKind: 'VirtualMachine',
        targetName: 'restoring-vm',
      }

      const result = convert(restoreItem)

      expect(result.status?.conditions).toEqual([{ type: 'Ready', status: 'False' }])
      expect(result.status?.restoreTime).toBeUndefined()
      expect(result.status?.complete).toBe(false)
    })

    it('should use condition string over ready field if provided', () => {
      const restoreItem = {
        ...baseSearchItem,
        kind: 'VirtualMachineRestore',
        apigroup: 'snapshot.kubevirt.io',
        ready: 'True',
        condition: 'Ready=False;Failed=True',
      }

      const result = convert(restoreItem)

      expect(result.status?.conditions).toEqual([
        { type: 'Ready', status: 'False' },
        { type: 'Failed', status: 'True' },
      ])
    })
  })

  describe('VolumeSnapshot.snapshot.storage.k8s.io', () => {
    it('should handle VolumeSnapshot resource transformation', () => {
      const volumeSnapshotItem = {
        ...baseSearchItem,
        kind: 'VolumeSnapshot',
        apigroup: 'snapshot.storage.k8s.io',
        volumeSnapshotClassName: 'csi-hostpath-snapclass',
        persistentVolumeClaimName: 'my-pvc',
        restoreSize: '10Gi',
      }

      const result = convert(volumeSnapshotItem)

      expect(result.spec?.volumeSnapshotClassName).toBe('csi-hostpath-snapclass')
      expect(result.spec?.source?.persistentVolumeClaimName).toBe('my-pvc')
      expect(result.status?.restoreSize).toBe('10Gi')
    })

    it('should handle VolumeSnapshot with partial fields', () => {
      const volumeSnapshotItem = {
        ...baseSearchItem,
        kind: 'VolumeSnapshot',
        apigroup: 'snapshot.storage.k8s.io',
        volumeSnapshotClassName: 'csi-aws-vsc',
      }

      const result = convert(volumeSnapshotItem)

      expect(result.spec?.volumeSnapshotClassName).toBe('csi-aws-vsc')
      expect(result.spec?.source?.persistentVolumeClaimName).toBeUndefined()
      expect(result.status?.restoreSize).toBeUndefined()
    })
  })

  describe('unknown resource types', () => {
    it('should handle unknown resource types with basic transformation', () => {
      const unknownItem = {
        ...baseSearchItem,
        kind: 'CustomResource',
        apigroup: 'example.com',
        customField: 'customValue',
      }

      const result = convert(unknownItem)

      // Basic transformation should still work
      expect(result.apiVersion).toBe('example.com/v1')
      expect(result.kind).toBe('CustomResource')
      expect(result.cluster).toBe('test-cluster')
      // Custom fields should not be mapped automatically
      expect((result as any).customField).toBeUndefined()
    })
  })
})
