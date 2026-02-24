/* Copyright Contributors to the Open Cluster Management project */

import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import {
  AgentK8sResource,
  AgentMachineK8sResource,
  HostedClusterK8sResource,
  NodePoolK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Checkbox,
  SelectOption,
  FormHelperText,
  Popover,
} from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { ExclamationTriangleIcon } from '@patternfly/react-icons'
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import _ from 'lodash'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import semver from 'semver'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { ClusterCurator, ClusterCuratorDefinition, NodePool } from '../../../../../resources'
import {
  Cluster,
  createResource,
  IRequestResult,
  patchResource,
  ResourceError,
  ResourceErrorCode,
} from '../../../../../resources/utils'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import {
  AcmAlert,
  AcmExpandableCheckbox,
  AcmForm,
  AcmModal,
  AcmSelect,
  AcmSubmit,
  AcmTable,
} from '../../../../../ui-components'
import { getNodepoolAgents } from '../utils/nodepool'
import { ReleaseNotesLink } from './ReleaseNotesLink'
import { isMinorOrMajorUpgrade } from './utils/version-utils'

// Helper: Check if version is within supported range
// Only check minor version if major versions are equal
function isWithinSupportedVersion(version: string, latestSupportedVersion: string, zeroVersion: string): boolean {
  if (latestSupportedVersion === zeroVersion) return true
  try {
    const versionMajor = semver.major(version)
    const versionMinor = semver.minor(version)
    const supportedMajor = semver.major(latestSupportedVersion)
    const supportedMinor = semver.minor(latestSupportedVersion)
    // Only check minor if major versions are equal
    if (versionMajor !== supportedMajor) {
      return versionMajor <= supportedMajor
    }
    return versionMinor <= supportedMinor
  } catch {
    return false
  }
}

// Helper: Sort versions in descending order using semver.compare
function sortVersionsDescending(versions: string[]): string[] {
  return versions
    .sort((a, b) => {
      try {
        return semver.compare(a, b)
      } catch {
        return 0
      }
    })
    .reverse()
}

// Helper: Check if a version should show an upgrade alert
// Returns true if upgradeableCondition is False AND the version is a minor/major upgrade
function hasUpgradeAlert(
  upgradeableCondition: V1CustomResourceDefinitionCondition | undefined,
  currentVersion: string | undefined,
  targetVersion: string | undefined
): boolean {
  if (!targetVersion) return false
  const isMinorMajor = isMinorOrMajorUpgrade(currentVersion, targetVersion)
  return upgradeableCondition?.status === 'False' && isMinorMajor
}

export function HypershiftUpgradeModal(props: {
  close: () => void
  open: boolean
  controlPlane: Cluster
  nodepools: NodePool[]
  availableUpdates: Record<string, string>
  agents?: AgentK8sResource[]
  agentMachines?: AgentMachineK8sResource[]
  hostedCluster?: HostedClusterK8sResource
}): JSX.Element {
  const { t } = useTranslation()
  const [nodepoolErrors, setNodepoolErrors] = useState<any>({})
  const [controlPlaneChecked, setControlPlaneChecked] = useState<boolean>(true)
  const [nodepoolGroupChecked, setNodepoolGroupChecked] = useState<boolean | null>(true)
  const [nodepoolsExpanded, setNodepoolsExpanded] = useState<boolean>(false)
  const [nodepoolsChecked, setNodepoolsChecked] = useState<any>({})
  const [nodepoolsToggled, setNodepoolsToggled] = useState<any>({})
  const [controlPlaneNewVersion, setControlPlaneNewVersion] = useState<string>()
  const [nodepoolsNameTdWidth, setNodepoolsNameTdWidth] = useState<number>()
  const [nodepoolsVersionTdWidth, setNodepoolsVersionTdWidth] = useState<number>()
  const [controlPlaneCheckboxSpanWidth, setControlPlaneCheckboxSpanWidth] = useState<number>()
  const [controlPlaneError, setControlPlaneError] = useState<boolean>(false)
  const [overallNodepoolVersion, setOverallNodepoolVersion] = useState<string>()
  const [nodepoolGroupDisabled, setNodepoolGroupDisabled] = useState<boolean>(false)
  const [nodepoolsDisabled, setNodepoolsDisabled] = useState<any>({})
  const [controlPlaneCheckboxDisabled, setControlPlaneCheckboxDisabled] = useState<boolean>(false)
  const [patchErrors, setPatchErrors] = useState<any[]>([])
  const zeroVersion = '0.0.0'

  const { configMapsState } = useSharedAtoms()
  const configMaps = useRecoilValue(configMapsState)
  const hypershiftSupportedVersionsConfigMap = configMaps.find(
    (cm) => cm.metadata?.name === 'supported-versions' && cm.metadata?.namespace === 'hypershift'
  )
  const supportedVersions = JSON.parse(_.get(hypershiftSupportedVersionsConfigMap, 'data.supported-versions', '{}'))

  let latestSupportedVersion =
    supportedVersions.versions && supportedVersions.versions.length > 0
      ? supportedVersions.versions[0] + '.0'
      : zeroVersion
  if (supportedVersions.versions) {
    for (let i = 1; i < supportedVersions.versions.length; i++) {
      try {
        if (semver.gt(supportedVersions.versions[i] + '.0', latestSupportedVersion)) {
          latestSupportedVersion = supportedVersions.versions[i] + '.0'
        }
      } catch {
        // Skip invalid versions
      }
    }
  }

  // Single dropdown: dynamically filter based on what's checked
  // - If control plane checked: show versions > current CP version
  // - If only nodepools checked: show versions > max nodepool AND <= current CP version
  const availableUpdateKeys = useMemo(() => {
    const currentCPVersion = props.controlPlane.distribution?.ocp?.version || '0.0.0'

    // If control plane is checked, show versions > CP version
    if (controlPlaneChecked) {
      const filtered = Object.keys(props.availableUpdates).filter((version) => {
        try {
          if (!isWithinSupportedVersion(version, latestSupportedVersion, zeroVersion)) return false
          return semver.gt(version, currentCPVersion)
        } catch {
          return false
        }
      })
      return sortVersionsDescending(filtered)
    }

    // Only nodepools checked: show versions > max nodepool AND <= CP version
    let maxNodepoolVersion = '0.0.0'
    props.nodepools?.forEach((np) => {
      const npVersion = np.status?.version || '0.0.0'
      try {
        if (semver.gt(npVersion, maxNodepoolVersion)) {
          maxNodepoolVersion = npVersion
        }
      } catch {
        // Skip invalid versions
      }
    })

    const versions = Object.keys(props.availableUpdates).filter((version) => {
      try {
        if (!isWithinSupportedVersion(version, latestSupportedVersion, zeroVersion)) return false
        if (!semver.gt(version, maxNodepoolVersion)) return false
        return semver.lte(version, currentCPVersion)
      } catch {
        return false
      }
    })

    // Include current CP version as option
    try {
      if (
        currentCPVersion !== '0.0.0' &&
        !versions.includes(currentCPVersion) &&
        semver.gt(currentCPVersion, maxNodepoolVersion)
      ) {
        versions.push(currentCPVersion)
      }
    } catch {
      // Skip if invalid version
    }

    return sortVersionsDescending(versions)
  }, [
    props.availableUpdates,
    latestSupportedVersion,
    props.controlPlane.distribution?.ocp?.version,
    props.nodepools,
    controlPlaneChecked,
  ])

  const controlPlaneNameTdRef = useRef<HTMLTableCellElement>(null)
  const controlPlaneVersionTdRef = useRef<HTMLTableCellElement>(null)

  if (
    controlPlaneNameTdRef.current?.offsetWidth && // ensure defined and > 0
    controlPlaneNameTdRef.current.offsetWidth !== nodepoolsNameTdWidth
  ) {
    setNodepoolsNameTdWidth(controlPlaneNameTdRef.current?.offsetWidth)
  }

  if (
    controlPlaneVersionTdRef.current?.offsetWidth && // ensure defined and > 0
    controlPlaneVersionTdRef.current.offsetWidth !== nodepoolsVersionTdWidth
  ) {
    setNodepoolsVersionTdWidth(controlPlaneVersionTdRef.current?.offsetWidth)
  }

  const controlPlaneCheckboxSpanRef = useCallback((node: HTMLSpanElement | null) => {
    if (node) {
      setControlPlaneCheckboxSpanWidth(node.offsetWidth)
    }
  }, [])

  const checkNodepoolErrors = useCallback(
    (version?: string) => {
      const currentCPVersion = version || controlPlaneNewVersion
      const npErrors: any = {}
      props.nodepools?.forEach((np) => {
        if (isTwoVersionsGreater(currentCPVersion, np.status?.version)) {
          npErrors[np.metadata.name || ''] = true
        } else {
          npErrors[np.metadata.name || ''] = false
        }
      })
      setNodepoolErrors({ ...npErrors })
    },
    [controlPlaneNewVersion, props.nodepools]
  )

  const checkNodepoolsDisabled = useCallback(
    (version?: string) => {
      const cpVersion = version || controlPlaneNewVersion
      const npsDisabled: any = {}
      props.nodepools?.forEach((np) => {
        if (isTwoVersionsGreater(cpVersion, np.status?.version) || cpVersion === np.status?.version) {
          npsDisabled[np.metadata.name || ''] = true
        } else {
          npsDisabled[np.metadata.name || ''] = false
        }
      })

      if (countTrue(npsDisabled) > 0) {
        setNodepoolGroupDisabled(true)
      } else {
        setNodepoolGroupDisabled(false)
      }

      setNodepoolsDisabled({ ...npsDisabled })
    },
    [controlPlaneNewVersion, props.nodepools]
  )

  useEffect(() => {
    setPatchErrors([])

    // Calculate available updates for both scenarios (to determine if anything is available)
    const currentCPVersion = props.controlPlane.distribution?.ocp?.version || '0.0.0'

    // CP updates: versions > CP version
    const cpUpdates = sortVersionsDescending(
      Object.keys(props.availableUpdates).filter((version) => {
        try {
          if (!isWithinSupportedVersion(version, latestSupportedVersion, zeroVersion)) return false
          return semver.gt(version, currentCPVersion)
        } catch {
          return false
        }
      })
    )

    // NP updates: versions > max nodepool AND <= CP version
    let maxNodepoolVersion = '0.0.0'
    props.nodepools?.forEach((np) => {
      const npVersion = np.status?.version || '0.0.0'
      try {
        if (semver.gt(npVersion, maxNodepoolVersion)) {
          maxNodepoolVersion = npVersion
        }
      } catch {
        // Skip invalid versions
      }
    })

    const npUpdates = Object.keys(props.availableUpdates).filter((version) => {
      try {
        if (!isWithinSupportedVersion(version, latestSupportedVersion, zeroVersion)) return false
        if (!semver.gt(version, maxNodepoolVersion)) return false
        return semver.lte(version, currentCPVersion)
      } catch {
        return false
      }
    })

    // Include current CP version as option for NP updates
    try {
      if (
        currentCPVersion !== '0.0.0' &&
        !npUpdates.includes(currentCPVersion) &&
        semver.gt(currentCPVersion, maxNodepoolVersion)
      ) {
        npUpdates.push(currentCPVersion)
      }
    } catch {
      // Skip if invalid version
    }

    const npUpdatesSorted = sortVersionsDescending(npUpdates)

    if (cpUpdates.length === 0 && npUpdatesSorted.length === 0) {
      setControlPlaneCheckboxDisabled(true)
      setControlPlaneChecked(false)
      checkNodepoolErrors(props.controlPlane.distribution?.ocp?.version)
    }

    // Initialize version: prefer control plane updates, fallback to nodepool updates
    if (!controlPlaneNewVersion) {
      const initialVersion =
        cpUpdates.length > 0 ? cpUpdates[0] : npUpdatesSorted.length > 0 ? npUpdatesSorted[0] : undefined

      if (initialVersion) {
        setControlPlaneNewVersion(initialVersion)
        checkNodepoolsDisabled(initialVersion)
        checkNodepoolErrors(initialVersion)
      }
    }

    // Disable control plane if no updates available for it
    if (cpUpdates.length === 0) {
      setControlPlaneCheckboxDisabled(true)
      setControlPlaneChecked(false)
    }

    let initialNodepoolVer: string | undefined
    let isOverallNodepoolVersionSet = false
    const availableUpdateVersion = cpUpdates[0] || npUpdatesSorted[0] || props.controlPlane.distribution?.ocp?.version
    if (Object.keys(nodepoolsChecked).length === 0) {
      const npsChecked: any = {}
      const npsDisabled: any = {}
      props.nodepools?.forEach((np, i) => {
        if (i === 0) {
          initialNodepoolVer = np.status?.version
        }
        if (i > 0 && !isOverallNodepoolVersionSet) {
          if (np.status?.version !== initialNodepoolVer) {
            setOverallNodepoolVersion('-')
            isOverallNodepoolVersionSet = true
          }
        }
        if (isVersionGreater(availableUpdateVersion, np.status?.version)) {
          npsChecked[np.metadata.name || ''] = true
          if (isTwoVersionsGreater(availableUpdateVersion, np.status?.version)) {
            npsDisabled[np.metadata.name || ''] = true
          }
        } else {
          npsDisabled[np.metadata.name || ''] = true
        }
      })

      const npsCheckCount = countTrue(npsChecked)
      if (npsCheckCount === props.nodepools?.length) {
        setNodepoolGroupChecked(true)
      } else if (npsCheckCount < props.nodepools?.length) {
        setNodepoolGroupChecked(null)
      } else if (npsCheckCount === 0) {
        setNodepoolGroupChecked(false)
      }

      const npsDisabledCount = countTrue(npsDisabled)
      if (npsDisabledCount > 0) {
        setNodepoolGroupDisabled(true)
      } else {
        setNodepoolGroupDisabled(false)
      }

      setNodepoolsChecked({ ...npsChecked })
      setNodepoolsDisabled({ ...npsDisabled })
    }

    if (!isOverallNodepoolVersionSet && !overallNodepoolVersion) {
      setOverallNodepoolVersion(initialNodepoolVer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open])

  const isNodepoolChecked = (name: string | undefined) => {
    if (!name) {
      return false
    }
    if (nodepoolsChecked[name] !== undefined) {
      return nodepoolsChecked[name]
    }
    return false
  }

  const isNodepoolDisabled = (name: string | undefined) => {
    if (!name) {
      return false
    }
    if (nodepoolsDisabled[name] !== undefined) {
      return nodepoolsDisabled[name]
    }
    return false
  }

  const isNodepoolToggled = (name: string) => {
    if (nodepoolsToggled[name] !== undefined) {
      return nodepoolsToggled[name]
    }
    return false
  }

  const handleNodepoolGroupChecked = () => {
    setNodepoolGroupChecked(!nodepoolGroupChecked)

    if (!nodepoolGroupChecked) {
      props.nodepools?.forEach((np) => {
        nodepoolsChecked[np.metadata.name || ''] = true
      })
    } else {
      props.nodepools?.forEach((np) => {
        nodepoolsChecked[np.metadata.name || ''] = false
      })
    }
    setNodepoolsChecked({ ...nodepoolsChecked })
    checkNodepoolErrors()
  }

  const handleNodepoolToggled = (name: string) => {
    if (nodepoolsToggled[name] !== undefined) {
      nodepoolsToggled[name] = !nodepoolsToggled[name]
    } else {
      nodepoolsToggled[name] = true
    }
    setNodepoolsToggled({ ...nodepoolsToggled })
  }

  const countTrue = (booleanMap: any) => {
    let count = 0
    Object.values(booleanMap).forEach((val) => {
      if (val) {
        count++
      }
    })

    return count
  }

  const isTwoVersionsGreater = (cpVersion: string | undefined, npVersion: string | undefined) => {
    if (!cpVersion || !npVersion) {
      return false
    }
    const cpVersionParts = cpVersion.split('.')
    const npVersionParts = npVersion.split('.')

    if (cpVersionParts[0] > npVersionParts[0]) {
      return true
    }
    if (Number(cpVersionParts[1]) - Number(npVersionParts[1]) > 2) {
      return true
    }

    return false
  }

  const isVersionGreater = (cpVersion: string | undefined, npVersion: string | undefined) => {
    if (!cpVersion || !npVersion) {
      return false
    }
    const cpVersionParts = cpVersion.split('.')
    const npVersionParts = npVersion.split('.')

    if (cpVersionParts[0] > npVersionParts[0]) {
      return true
    }
    if (Number(cpVersionParts[1]) > Number(npVersionParts[1])) {
      return true
    }
    if (Number(cpVersionParts[2]) > Number(npVersionParts[2])) {
      return true
    }

    return false
  }

  const handleNodepoolsChecked = (name: string) => {
    if (nodepoolsChecked[name] != undefined) {
      nodepoolsChecked[name] = !nodepoolsChecked[name]
    } else {
      nodepoolsChecked[name] = true
    }
    const numNodepoolsChecked = countTrue(nodepoolsChecked)
    if (numNodepoolsChecked === props.nodepools?.length) {
      setNodepoolGroupChecked(true)
    }
    if (numNodepoolsChecked > 0 && numNodepoolsChecked < props.nodepools?.length) {
      setNodepoolGroupChecked(null)
    }
    if (numNodepoolsChecked === 0) {
      setNodepoolGroupChecked(false)
    }
    setNodepoolsChecked({ ...nodepoolsChecked })

    checkNodepoolErrors(controlPlaneChecked ? controlPlaneNewVersion : props.controlPlane.distribution?.ocp?.version)
  }

  const setAllNodepoolsCheckState = (checked: boolean) => {
    props.nodepools?.forEach((np) => {
      nodepoolsChecked[np.metadata.name || ''] = checked
    })
    setNodepoolsChecked({ ...nodepoolsChecked })
  }

  const setAllNodepoolsDisableState = (disabled: boolean) => {
    props.nodepools?.forEach((np) => {
      nodepoolsDisabled[np.metadata.name || ''] = disabled
    })
    setNodepoolsDisabled({ ...nodepoolsDisabled })
  }

  // Check if nodepools version will be greater than control plane version after upgrade
  const handleControlPlaneChecked = () => {
    setControlPlaneChecked(!controlPlaneChecked)
    const npErrors: any = {}
    if (!controlPlaneChecked === false) {
      if (nodepoolGroupChecked || countTrue(nodepoolsChecked) > 0) {
        if (isVersionGreater(controlPlaneNewVersion, props.controlPlane.distribution?.ocp?.version)) {
          let cpError = true

          //uncheck nodepools if same version as control plane
          const npsDisabled: any = {}
          const npsChecked: any = {}
          props.nodepools?.forEach((np) => {
            if (isVersionGreater(props.controlPlane.distribution?.ocp?.version, np.status?.version)) {
              npsChecked[np.metadata.name || ''] = true
              cpError = false

              if (isTwoVersionsGreater(props.controlPlane.distribution?.ocp?.version, np.status?.version)) {
                npsDisabled[np.metadata.name || ''] = true
                npErrors[np.metadata.name || ''] = true
              }
            } else if ((np.status?.version || '') === (props.controlPlane.distribution?.ocp?.version || '')) {
              npsChecked[np.metadata.name || ''] = false
              npsDisabled[np.metadata.name || ''] = true
            }
          })
          setNodepoolsDisabled(npsDisabled)
          setNodepoolsChecked({ ...npsChecked })
          setNodepoolErrors({ ...npErrors })
          const npsCheckedCount = countTrue(npsChecked)
          if (npsCheckedCount === 0) {
            setNodepoolGroupChecked(false)
          } else if (npsCheckedCount < props.nodepools?.length) {
            setNodepoolGroupChecked(null)
          } else if (npsCheckedCount === props.nodepools?.length) {
            setNodepoolGroupChecked(true)
          }

          const npDisableCount = countTrue(npsDisabled)
          if (npDisableCount > 0) {
            setNodepoolGroupDisabled(true)
          }
          setControlPlaneError(cpError)
        }
      }
    }
    if (!controlPlaneChecked) {
      // Set the version to the first available upgrade when checkbox is enabled
      // Calculate CP updates (versions > CP version) directly from availableUpdates
      const currentCPVersion = props.controlPlane.distribution?.ocp?.version || '0.0.0'
      const cpUpdates = sortVersionsDescending(
        Object.keys(props.availableUpdates).filter((version) => {
          try {
            if (!isWithinSupportedVersion(version, latestSupportedVersion, zeroVersion)) return false
            return semver.gt(version, currentCPVersion)
          } catch {
            return false
          }
        })
      )

      if (cpUpdates.length > 0) {
        const firstVersion = cpUpdates[0]
        setControlPlaneNewVersion(firstVersion)
        checkNodepoolErrors(firstVersion)
        checkNodepoolsDisabled(firstVersion)

        // Auto-check nodepools that are 2+ minor versions behind
        props.nodepools?.forEach((np) => {
          if (isTwoVersionsGreater(firstVersion, np.status?.version)) {
            nodepoolsChecked[np.metadata.name || ''] = true
          }
        })
        setNodepoolsChecked({ ...nodepoolsChecked })
        if (countTrue(nodepoolsChecked) === props.nodepools?.length) {
          setNodepoolGroupChecked(true)
        }
      } else {
        checkNodepoolErrors()
      }
      setControlPlaneError(false)
      setNodepoolGroupChecked(true)
      setAllNodepoolsCheckState(true)
      if (countTrue(nodepoolErrors) === 0) {
        setAllNodepoolsDisableState(false)
        setNodepoolGroupDisabled(false)
      }
    }
  }

  const performUpgrade = (
    cluster: Cluster,
    desiredVersion: string,
    upgradeType?: 'ControlPlane' | 'NodePools',
    nodePoolNames?: string[]
  ) => {
    const patchSpec = {
      spec: {
        desiredCuration: 'upgrade',
        upgrade: {
          channel: '', // Empty to use version only
          desiredUpdate: desiredVersion,
          ...(upgradeType && { upgradeType }),
          ...(nodePoolNames && nodePoolNames.length > 0 && { nodePoolNames }),
        },
      },
    }

    const clusterCurator = {
      apiVersion: ClusterCuratorDefinition.apiVersion,
      kind: ClusterCuratorDefinition.kind,
      metadata: {
        name: cluster.name,
        namespace: cluster.namespace,
      },
    } as ClusterCurator

    const patchCuratorResult = patchResource(clusterCurator, patchSpec)
    let createCuratorResult: IRequestResult<ClusterCurator> | undefined = undefined

    return {
      promise: new Promise((resolve, reject) => {
        patchCuratorResult.promise
          .then((data) => {
            return resolve(data)
          })
          .catch((err: ResourceError) => {
            if (err.code === ResourceErrorCode.NotFound) {
              // Create ClusterCurator if it doesn't exist
              createCuratorResult = createResource({ ...clusterCurator, ...patchSpec })
              createCuratorResult.promise.then((data) => resolve(data)).catch((err) => reject(err))
            } else {
              reject(err)
            }
          })
      }),
      abort: () => {
        patchCuratorResult.abort()
        if (createCuratorResult) {
          createCuratorResult.abort()
        }
      },
    }
  }

  const columnNames = {
    name: 'Name',
    currentVersion: 'Current version',
    newVersion: 'Target version',
  }
  const columnNamesTranslated = {
    name: t('Name'),
    currentVersion: t('Current version'),
    newVersion: t('Target version'),
  }

  const paddingZero = { paddingLeft: 0, paddingRight: 0 }

  if (props.open === false) {
    return <></>
  }

  const upgradeableCondition = props.controlPlane.distribution?.upgradeInfo?.upgradeableCondition
  const currentVersion = props.controlPlane.distribution?.ocp?.version
  const showUpgradeAlert = hasUpgradeAlert(upgradeableCondition, currentVersion, controlPlaneNewVersion)

  return (
    <AcmModal variant={ModalVariant.large} title={t('Update version')} isOpen={true} onClose={props.close}>
      <AcmForm style={{ gap: 0 }}>
        {patchErrors.length === 0 ? (
          <Fragment>
            {showUpgradeAlert && (
              <AcmAlert
                isInline
                noClose
                variant="warning"
                title={t('Cluster version update risks detected')}
                message={t(
                  'Clusters with warnings have version-specific risks that may cause update failure. Resolve these risks or choose a different target version.'
                )}
                style={{ marginBottom: '16px' }}
              />
            )}
            {t(
              'Select the new versions for the cluster and node pools that you want to update. This action is irreversible.'
            )}
            <Table aria-label={t('HyperShift update table')} variant="compact" borders={false}>
              <Thead>
                <Tr>
                  <Th width={20}>{columnNamesTranslated.name}</Th>
                  <Th width={15}>{columnNamesTranslated.currentVersion}</Th>
                  <Th width={60}>{columnNamesTranslated.newVersion}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {controlPlaneCheckboxDisabled && (
                  <Tr key="hypershift-controlplane-error">
                    <Td colSpan={3} style={paddingZero}>
                      <AcmAlert
                        isInline
                        noClose
                        variant="info"
                        title={t('Version availability')}
                        message={t(
                          'Hosted control plane is already updated to the latest version available. Cluster node pools can be updated to match the control plane.'
                        )}
                      />
                    </Td>
                  </Tr>
                )}
                <Tr key="hypershift-controlplane">
                  <Td dataLabel={columnNames.name} ref={controlPlaneNameTdRef}>
                    <div>
                      <span style={{ paddingRight: '10px' }} ref={controlPlaneCheckboxSpanRef}>
                        <Checkbox
                          isChecked={controlPlaneChecked}
                          id="controlplane-checkbox"
                          name={props.controlPlane.name}
                          onChange={() => handleControlPlaneChecked()}
                          isDisabled={controlPlaneCheckboxDisabled}
                        />
                      </span>
                      {props.controlPlane.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6A6E73' }}>
                      <span style={{ paddingLeft: controlPlaneCheckboxSpanWidth }}>{t('Hosted control plane')}</span>
                    </div>
                  </Td>
                  <Td dataLabel={columnNames.currentVersion} ref={controlPlaneVersionTdRef}>
                    {props.controlPlane.distribution?.ocp?.version}
                  </Td>
                  <Td dataLabel={columnNames.newVersion}>
                    <AcmSelect
                      id="controlplane-version-dropdown"
                      onChange={(version) => {
                        // Handle clearing the dropdown (undefined or empty string)
                        if (!version) {
                          setControlPlaneNewVersion(undefined)
                          return
                        }

                        setControlPlaneNewVersion(version)
                        checkNodepoolErrors(version)
                        checkNodepoolsDisabled(version)
                        props.nodepools?.forEach((np) => {
                          if (isTwoVersionsGreater(version, np.status?.version)) {
                            nodepoolsChecked[np.metadata.name || ''] = true
                          }
                        })
                        setNodepoolsChecked({ ...nodepoolsChecked })
                        if (countTrue(nodepoolsChecked) === props.nodepools?.length) {
                          setNodepoolGroupChecked(true)
                        }
                      }}
                      value={controlPlaneNewVersion || ''}
                      label=""
                      maxHeight={'10em'}
                      isDisabled={!controlPlaneChecked}
                    >
                      {availableUpdateKeys.map((version) => {
                        const hasWarning = hasUpgradeAlert(upgradeableCondition, currentVersion, version)
                        return (
                          <SelectOption key={`${version}`} value={version}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                              }}
                            >
                              <span>{version}</span>
                              {hasWarning && (
                                <ExclamationTriangleIcon style={{ color: 'var(--pf-v5-global--warning-color--100)' }} />
                              )}
                            </div>
                          </SelectOption>
                        )
                      })}
                    </AcmSelect>
                    {showUpgradeAlert ? (
                      <FormHelperText>
                        <ExclamationTriangleIcon
                          style={{
                            marginRight: '4px',
                            verticalAlign: 'middle',
                            color: 'var(--pf-v5-global--warning-color--100)',
                          }}
                        />
                        {t('Cluster version update risk detected for {{version}}', {
                          version: controlPlaneNewVersion,
                        })}{' '}
                        -{' '}
                        <Popover
                          headerContent={t('Cluster version update risk')}
                          bodyContent={upgradeableCondition?.message}
                        >
                          <Button variant="link" isInline style={{ padding: 0, fontSize: 'inherit' }}>
                            {t('View alert details')}
                          </Button>
                        </Popover>
                        {' | '}
                        <ReleaseNotesLink version={controlPlaneNewVersion} />
                      </FormHelperText>
                    ) : (
                      <ReleaseNotesLink version={controlPlaneNewVersion} />
                    )}
                  </Td>
                </Tr>
                {props.nodepools && props.nodepools?.length > 0 && (
                  <Fragment>
                    {countTrue(nodepoolErrors) > 0 && (
                      <Tr key="nodepool-error">
                        <Td colSpan={3} style={paddingZero}>
                          <AcmAlert
                            isInline
                            noClose
                            variant="info"
                            title={t('Version compatibility')}
                            message={t(
                              'Node pools must be updated to the same version as the control plane in order to avoid compatibility issues due to being unsupported.'
                            )}
                          />
                        </Td>
                      </Tr>
                    )}
                    {controlPlaneError && (
                      <Tr key="nodepool-error">
                        <Td colSpan={3} style={paddingZero}>
                          <AcmAlert
                            isInline
                            noClose
                            variant="info"
                            title={t('Version compatibility')}
                            message={t(
                              'Node pools cannot be updated to a later version than the control plane. If you wish to update the node pool(s), you must select to update your control plane first.'
                            )}
                          />
                        </Td>
                      </Tr>
                    )}
                    <Tr key="hypershift-nodepools">
                      <Td dataLabel={columnNames.name} style={paddingZero}>
                        <AcmExpandableCheckbox
                          onToggle={() => setNodepoolsExpanded(!nodepoolsExpanded)}
                          expanded={nodepoolsExpanded}
                          checked={nodepoolGroupChecked}
                          label={t('Cluster node pools')}
                          onCheck={() => handleNodepoolGroupChecked()}
                          isDisabled={nodepoolGroupDisabled}
                          expandable={true}
                          id="nodepoolgroup"
                        >
                          <Fragment />
                        </AcmExpandableCheckbox>
                      </Td>
                      <Td dataLabel={columnNames.currentVersion}>
                        <span>{overallNodepoolVersion}</span>
                      </Td>
                      <Td dataLabel={columnNames.newVersion}>
                        {countTrue(nodepoolsChecked) > 0 && controlPlaneNewVersion ? (
                          <span>{controlPlaneNewVersion}</span>
                        ) : (
                          <span>-</span>
                        )}
                      </Td>
                    </Tr>
                    {nodepoolsExpanded &&
                      props.nodepools?.map((np) => {
                        return (
                          <Tr key={np.metadata.name}>
                            <Td dataLabel={columnNames.name} style={paddingZero}>
                              <AcmExpandableCheckbox
                                onToggle={() => handleNodepoolToggled(np.metadata.name || '')}
                                expanded={isNodepoolToggled(np.metadata.name || '')}
                                checked={isNodepoolChecked(np.metadata.name)}
                                label={np.metadata.name || ''}
                                onCheck={() => handleNodepoolsChecked(np.metadata.name || '')}
                                isDisabled={isNodepoolDisabled(np.metadata.name || '')}
                                additionalLabels={
                                  props.controlPlane.hypershift?.agent ? [`${np.spec.replicas} hosts`] : undefined
                                }
                                expandable={props.controlPlane.hypershift?.agent}
                                id={np.metadata.name}
                                data-testid={`${np.metadata.name}-checkbox`}
                              >
                                {props.controlPlane.hypershift?.agent &&
                                  getNodepoolAgents(
                                    np as NodePoolK8sResource,
                                    props.agents,
                                    props.agentMachines,
                                    props.hostedCluster!
                                  ).map((agent) => {
                                    const hostName = agent.spec.hostname || agent.status?.inventory.hostname
                                    return (
                                      <div key={hostName}>
                                        <span
                                          style={{
                                            paddingLeft: controlPlaneCheckboxSpanWidth,
                                          }}
                                        >
                                          {hostName}
                                        </span>
                                      </div>
                                    )
                                  })}
                              </AcmExpandableCheckbox>
                            </Td>
                            <Td dataLabel={columnNames.currentVersion}>{np.status?.version}</Td>
                            <Td dataLabel={columnNames.newVersion}>
                              {isNodepoolChecked(np.metadata.name) ? (
                                <span>{controlPlaneNewVersion}</span>
                              ) : (
                                <span>-</span>
                              )}
                            </Td>
                          </Tr>
                        )
                      })}
                  </Fragment>
                )}
              </Tbody>
            </Table>
            <ActionGroup>
              <AcmSubmit
                key="submit-hypershift-upgrade-action"
                id="submit-button-hypershift-upgrade"
                isDisabled={
                  !(controlPlaneChecked || countTrue(nodepoolsChecked) > 0) ||
                  controlPlaneError ||
                  !controlPlaneNewVersion
                }
                variant={ButtonVariant.primary}
                onClick={async () => {
                  const errors: any[] = []

                  // Determine which nodepools are selected
                  const selectedNodePoolNames: string[] = []
                  props.nodepools?.forEach((np) => {
                    if (nodepoolsChecked[np.metadata.name || ''] === true) {
                      selectedNodePoolNames.push(np.metadata.name || '')
                    }
                  })

                  const allNodePoolsSelected = selectedNodePoolNames.length === props.nodepools?.length
                  const anyNodePoolsSelected = selectedNodePoolNames.length > 0

                  // Determine upgradeType and nodePoolNames based on selection
                  let upgradeType: 'ControlPlane' | 'NodePools' | undefined
                  let nodePoolNames: string[] | undefined

                  if (controlPlaneChecked && !anyNodePoolsSelected) {
                    // Control plane only
                    upgradeType = 'ControlPlane'
                  } else if (!controlPlaneChecked && anyNodePoolsSelected) {
                    // NodePools only (all or selective)
                    upgradeType = 'NodePools'
                    // If not all nodepools selected, specify which ones
                    if (!allNodePoolsSelected) {
                      nodePoolNames = selectedNodePoolNames
                    }
                  } else if (controlPlaneChecked && anyNodePoolsSelected) {
                    // Both control plane and nodepools
                    // If all nodepools selected, omit upgradeType (upgrades both)
                    // If selective nodepools, specify nodePoolNames
                    if (!allNodePoolsSelected) {
                      nodePoolNames = selectedNodePoolNames
                    }
                    // upgradeType remains undefined for "both"
                  }

                  // Determine the target version - always use the selected version from dropdown
                  const desiredVersion = controlPlaneNewVersion || ''

                  // Perform the upgrade via ClusterCurator
                  const upgradeResult = performUpgrade(props.controlPlane, desiredVersion, upgradeType, nodePoolNames)

                  try {
                    await upgradeResult.promise
                  } catch (err: any) {
                    errors.push({
                      msg: `${err.code || ''} ${err.name || ''} ${err.message || ''}`,
                    })
                  }

                  await new Promise((resolve) => setTimeout(resolve, 500))
                  setPatchErrors(errors)
                  if (errors.length === 0) {
                    props.close()
                  }
                }}
                label={t('Update')}
                processingLabel={t('Processing')}
              />
              <Button variant="link" onClick={props.close} key="cancel-hypershift-upgrade">
                {t('cancel')}
              </Button>
            </ActionGroup>
          </Fragment>
        ) : (
          <Fragment>
            <AcmAlert isInline noClose variant="danger" title={t('there.were.errors')} />
            <AcmTable
              items={patchErrors}
              emptyState={undefined} // only shown when patchErrors.length > 0
              columns={[
                {
                  header: t('Error'),
                  cell: (error) => {
                    return error.msg
                  },
                },
              ]}
              keyFn={(error) => error.name as string}
              tableActions={[]}
              rowActions={[]}
              perPageOptions={[]}
              autoHidePagination
            />
            <Button variant="link" onClick={props.close} key="hypershift-upgrade-error-close">
              {t('Close')}
            </Button>
          </Fragment>
        )}
      </AcmForm>
    </AcmModal>
  )
}
