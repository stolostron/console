/* Copyright Contributors to the Open Cluster Management project */

import { ActionGroup, Button, ButtonVariant, Checkbox, ModalVariant, SelectOption } from '@patternfly/react-core'
import { Table /* data-codemods */, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import {
  AgentK8sResource,
  AgentMachineK8sResource,
  HostedClusterK8sResource,
  NodePoolK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import {
  HostedClusterApiVersion,
  HostedClusterKind,
  IResource,
  NodePool,
  NodePoolApiVersion,
  NodePoolKind,
} from '../../../../../resources'
import { Cluster, IRequestResult, patchResource, ResourceError, resultsSettled } from '../../../../../resources/utils'
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
import { useSharedAtoms, useRecoilValue } from '../../../../../shared-recoil'
import _ from 'lodash'
import semver from 'semver'

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
      if (semver.gt(supportedVersions.versions[i] + '.0', latestSupportedVersion)) {
        latestSupportedVersion = supportedVersions.versions[i] + '.0'
      }
    }
  }

  const availableUpdateKeys = useMemo(() => {
    return Object.keys(props.availableUpdates)
      .filter((version) => {
        if (latestSupportedVersion === zeroVersion) {
          return true
        }
        return (
          semver.major(version) <= semver.major(latestSupportedVersion) &&
          semver.minor(version) <= semver.minor(latestSupportedVersion)
        )
      })
      .sort((a, b) => {
        if (semver.lt(a, b)) {
          return -1
        }
        if (semver.gt(a, b)) {
          return 1
        }
        return 0
      })
      .reverse()
  }, [props.availableUpdates, latestSupportedVersion])

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
    if (availableUpdateKeys.length === 0) {
      setControlPlaneCheckboxDisabled(true)
      setControlPlaneChecked(false)
      checkNodepoolErrors(props.controlPlane.distribution?.ocp?.version)
    }

    if (!controlPlaneNewVersion && availableUpdateKeys.length > 0) {
      setControlPlaneNewVersion(availableUpdateKeys[0])
      checkNodepoolsDisabled(availableUpdateKeys[0])
      checkNodepoolErrors(availableUpdateKeys[0])
    }

    if (availableUpdateKeys.length > 0 && availableUpdateKeys[0] === props.controlPlane.distribution?.ocp?.version) {
      setControlPlaneCheckboxDisabled(true)
      setControlPlaneChecked(false)
    }
    let initialNodepoolVer: string | undefined
    let isOverallNodepoolVersionSet = false
    const availableUpdateVersion = availableUpdateKeys[0] || props.controlPlane.distribution?.ocp?.version
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
      checkNodepoolErrors()
      setControlPlaneError(false)
      setNodepoolGroupChecked(true)
      setAllNodepoolsCheckState(true)
      if (countTrue(nodepoolErrors) === 0) {
        setAllNodepoolsDisableState(false)
        setNodepoolGroupDisabled(false)
      }
    }
  }

  const performUpgrade = (resourceType: string, resource: Cluster | NodePool, newVersion: string | undefined) => {
    let resourceYAML
    let resourceCastType
    const patchYAML = {
      spec: {
        release: {
          image: newVersion,
        },
      },
    }

    if (resourceType === 'Cluster') {
      resourceCastType = resource as Cluster
      resourceYAML = {
        apiVersion: HostedClusterApiVersion,
        kind: HostedClusterKind,
        metadata: {
          name: resourceCastType.name,
          namespace: resourceCastType.hypershift?.hostingNamespace,
        },
      } as HostedClusterK8sResource
    } else if (resourceType === 'NodePool') {
      resourceCastType = resource as NodePool
      resourceYAML = {
        apiVersion: NodePoolApiVersion,
        kind: NodePoolKind,
        metadata: {
          name: resourceCastType.metadata.name,
          namespace: resourceCastType.metadata.namespace,
        },
      } as NodePool
    }

    const patchResult = patchResource(resourceYAML as IResource, patchYAML)
    return {
      promise: new Promise((resolve, reject) => {
        patchResult.promise
          .then((data) => {
            return resolve(data)
          })
          .catch((err: ResourceError) => {
            reject(err)
          })
      }),
      abort: () => {
        patchResult.abort()
      },
    }
  }

  const columnNames = {
    name: 'Name',
    currentVersion: 'Current version',
    newVersion: 'New version',
  }
  const columnNamesTranslated = {
    name: t('Name'),
    currentVersion: t('Current version'),
    newVersion: t('New version'),
  }

  const paddingZero = { paddingLeft: 0, paddingRight: 0 }
  const borderNone = { border: 'none' }

  if (props.open === false) {
    return <></>
  }

  return (
    <AcmModal variant={ModalVariant.medium} title={t('Upgrade version')} isOpen={true} onClose={props.close}>
      <AcmForm style={{ gap: 0 }}>
        {patchErrors.length === 0 ? (
          <Fragment>
            {t(
              'Select the new versions for the cluster and node pools that you want to upgrade. This action is irreversible.'
            )}
            <Table aria-label={t('Hypershift upgrade table')} variant="compact">
              <Thead>
                <Tr>
                  <Th>{columnNamesTranslated.name}</Th>
                  <Th>{columnNamesTranslated.currentVersion}</Th>
                  <Th>{columnNamesTranslated.newVersion}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {controlPlaneCheckboxDisabled && (
                  <Tr key="hypershift-controlplane-error" style={{ borderBottom: '0px' }}>
                    <Td colSpan={3} style={paddingZero}>
                      <AcmAlert
                        isInline
                        noClose
                        variant="info"
                        title={t('Version availability')}
                        message={t(
                          'Hosted control plane is already upgraded to the latest version available. Cluster node pools can be upgraded to match the control plane.'
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
                      {availableUpdateKeys.map((version) => (
                        <SelectOption key={`${version}`} value={version}>
                          {version}
                        </SelectOption>
                      ))}
                    </AcmSelect>
                    <ReleaseNotesLink version={controlPlaneNewVersion} />
                  </Td>
                </Tr>
                {props.nodepools && props.nodepools?.length > 0 && (
                  <Fragment>
                    {countTrue(nodepoolErrors) > 0 && (
                      <Tr key="nodepool-error" style={borderNone}>
                        <Td colSpan={3} style={paddingZero}>
                          <AcmAlert
                            isInline
                            noClose
                            variant="info"
                            title={t('Version compatibility')}
                            message={t(
                              'Node pools must be upgraded to the same version as the control plane in order to avoid compatibility issues due to being unsupported.'
                            )}
                          />
                        </Td>
                      </Tr>
                    )}
                    {controlPlaneError && (
                      <Tr key="nodepool-error" style={borderNone}>
                        <Td colSpan={3} style={paddingZero}>
                          <AcmAlert
                            isInline
                            noClose
                            variant="info"
                            title={t('Version compatibility')}
                            message={t(
                              'Node pools cannot be upgraded to a later version than the control plane. If you wish to upgrade the node pool(s), you must select to upgrade your control plane first.'
                            )}
                          />
                        </Td>
                      </Tr>
                    )}
                    <Tr key="hypershift-nodepools">
                      <Td colSpan={nodepoolsExpanded ? 3 : undefined} dataLabel={columnNames.name} style={paddingZero}>
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
                          <Table
                            aria-label={t('Hypershift upgrade node pools table')}
                            borders={false}
                            variant="compact"
                          >
                            <Tbody>
                              {props.nodepools?.map((np) => {
                                return (
                                  <Tr key={np.metadata.name}>
                                    <Td style={{ width: nodepoolsNameTdWidth }}>
                                      <AcmExpandableCheckbox
                                        onToggle={() => handleNodepoolToggled(np.metadata.name || '')}
                                        expanded={isNodepoolToggled(np.metadata.name || '')}
                                        checked={isNodepoolChecked(np.metadata.name)}
                                        label={np.metadata.name || ''}
                                        onCheck={() => handleNodepoolsChecked(np.metadata.name || '')}
                                        isDisabled={isNodepoolDisabled(np.metadata.name || '')}
                                        additionalLabels={
                                          props.controlPlane.hypershift?.agent
                                            ? [`${np.spec.replicas} hosts`]
                                            : undefined
                                        }
                                        expandable={props.controlPlane.hypershift?.agent}
                                        id={np.metadata.name}
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
                                    <Td style={{ width: nodepoolsVersionTdWidth }}>{np.status?.version}</Td>
                                    <Td>
                                      {isNodepoolChecked(np.metadata.name) ? (
                                        <Fragment>
                                          {controlPlaneChecked ? (
                                            <span>{controlPlaneNewVersion}</span>
                                          ) : (
                                            <span>{props.controlPlane.distribution?.ocp?.version}</span>
                                          )}
                                        </Fragment>
                                      ) : (
                                        <span>-</span>
                                      )}
                                    </Td>
                                  </Tr>
                                )
                              })}
                            </Tbody>
                          </Table>
                        </AcmExpandableCheckbox>
                      </Td>
                      {!nodepoolsExpanded && (
                        <Fragment>
                          <Td dataLabel={columnNames.currentVersion}>
                            <span>{overallNodepoolVersion}</span>
                          </Td>
                          <Td dataLabel={columnNames.newVersion}>
                            <span>{nodepoolGroupChecked ? controlPlaneNewVersion : '-'}</span>
                          </Td>
                        </Fragment>
                      )}
                    </Tr>
                  </Fragment>
                )}
              </Tbody>
            </Table>
            <ActionGroup>
              <AcmSubmit
                key="submit-hypershift-upgrade-action"
                id="submit-button-hypershift-upgrade"
                isDisabled={!(controlPlaneChecked || countTrue(nodepoolsChecked) > 0) || controlPlaneError}
                variant={ButtonVariant.primary}
                onClick={async () => {
                  const errors: any[] = []
                  const resultArr: IRequestResult[] = []
                  if (controlPlaneChecked) {
                    resultArr.push(
                      performUpgrade(
                        'Cluster',
                        props.controlPlane,
                        props.availableUpdates[controlPlaneNewVersion || '']
                      )
                    )
                  }
                  props.nodepools?.forEach((np) => {
                    if (nodepoolsChecked[np.metadata.name || ''] === true) {
                      resultArr.push(
                        performUpgrade(
                          'NodePool',
                          np,
                          controlPlaneChecked
                            ? props.availableUpdates[controlPlaneNewVersion || '']
                            : props.controlPlane.distribution?.ocp?.desired?.image
                        )
                      )
                    }
                  })

                  const requestResult = resultsSettled(resultArr)
                  const promiseResults = await requestResult.promise
                  promiseResults.forEach((promiseResult) => {
                    if (promiseResult.status === 'rejected') {
                      errors.push({
                        msg: `${promiseResult.reason.code} ${promiseResult.reason.name} ${promiseResult.reason.message}`,
                      })
                    }
                  })

                  await new Promise((resolve) => setTimeout(resolve, 500))
                  setPatchErrors(errors)
                  if (errors.length === 0) {
                    props.close()
                  }
                }}
                label={t('Upgrade')}
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
