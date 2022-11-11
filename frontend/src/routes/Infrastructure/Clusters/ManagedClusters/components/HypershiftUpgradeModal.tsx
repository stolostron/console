/* Copyright Contributors to the Open Cluster Management project */

import { ActionGroup, Button, ButtonVariant, Checkbox, ModalVariant, SelectOption } from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { AgentK8sResource, AgentMachineK8sResource, HostedClusterK8sResource } from 'openshift-assisted-ui-lib/cim'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import {
    Cluster,
    HostedClusterApiVersion,
    HostedClusterKind,
    IRequestResult,
    NodePool,
    NodePoolApiVersion,
    NodePoolKind,
    patchResource,
    ResourceError,
    resultsSettled,
} from '../../../../../resources'
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

    const availableUpdateKeys = useMemo(() => {
        return Object.keys(props.availableUpdates).sort().reverse()
    }, [props.availableUpdates])

    const useControlPlaneNameTdRefCallback = () => {
        const setRef = useCallback((node) => {
            if (node) {
                setNodepoolsNameTdWidth(node.offsetWidth)
            }
        }, [])

        return [setRef]
    }

    const useControlPlaneVersionTdRefCallback = () => {
        const setRef = useCallback((node) => {
            if (node) {
                setNodepoolsVersionTdWidth(node.offsetWidth)
            }
        }, [])

        return [setRef]
    }

    const useControlPlaneCheckboxSpanRefCallback = () => {
        const setRef = useCallback((node) => {
            if (node) {
                setControlPlaneCheckboxSpanWidth(node.offsetWidth)
            }
        }, [])

        return [setRef]
    }

    const [controlPlaneNameTdRef] = useControlPlaneNameTdRefCallback()
    const [controlPlaneVersionTdRef] = useControlPlaneVersionTdRefCallback()
    const [controlPlaneCheckboxSpanRef] = useControlPlaneCheckboxSpanRefCallback()

    const checkNodepoolErrors = useCallback(
        (version?: string) => {
            const currentCPVersion = version || controlPlaneNewVersion
            props.nodepools.forEach((np) => {
                if (isTwoVersionsGreater(currentCPVersion, np.status?.version)) {
                    nodepoolErrors[np.metadata.name || ''] = true
                } else {
                    nodepoolErrors[np.metadata.name || ''] = false
                }
            })
            setNodepoolErrors({ ...nodepoolErrors })
        },
        [controlPlaneNewVersion, nodepoolErrors, props.nodepools]
    )

    const checkNodepoolsDisabled = useCallback(
        (version?: string) => {
            const cpVersion = version || controlPlaneNewVersion
            props.nodepools.forEach((np) => {
                if (isTwoVersionsGreater(cpVersion, np.status?.version) || cpVersion === np.status?.version) {
                    nodepoolsDisabled[np.metadata.name || ''] = true
                } else {
                    nodepoolsDisabled[np.metadata.name || ''] = false
                }
            })

            if (countTrue(nodepoolsDisabled) > 0) {
                setNodepoolGroupDisabled(true)
            } else {
                setNodepoolGroupDisabled(false)
            }

            setNodepoolsDisabled({ ...nodepoolsDisabled })
        },
        [controlPlaneNewVersion, nodepoolsDisabled, props.nodepools]
    )

    useEffect(() => {
        setPatchErrors([])
        if (availableUpdateKeys.length === 0) {
            setControlPlaneCheckboxDisabled(true)
            setControlPlaneChecked(false)
        }

        if (!controlPlaneNewVersion && availableUpdateKeys.length > 0) {
            setControlPlaneNewVersion(availableUpdateKeys[0])
            checkNodepoolsDisabled(availableUpdateKeys[0])
            checkNodepoolErrors(availableUpdateKeys[0])
        }

        if (
            availableUpdateKeys.length > 0 &&
            availableUpdateKeys[0] === props.controlPlane.distribution?.ocp?.version
        ) {
            setControlPlaneCheckboxDisabled(true)
            setControlPlaneChecked(false)
        }
        let initialNodepoolVer: string | undefined
        let isOverallNodepoolVersionSet = false
        const availableUpdateVersion = availableUpdateKeys[0] || props.controlPlane.distribution?.ocp?.version
        if (Object.keys(nodepoolsChecked).length === 0) {
            props.nodepools.forEach((np, i) => {
                if (i === 0) {
                    initialNodepoolVer = np.status?.version
                }
                if (i > 0 && !isOverallNodepoolVersionSet) {
                    if (np.status?.version !== initialNodepoolVer) {
                        setOverallNodepoolVersion('-')
                        isOverallNodepoolVersionSet = true
                    }
                }
                if ((np.status?.version || '') < (availableUpdateVersion || '')) {
                    nodepoolsChecked[np.metadata.name || ''] = true
                } else {
                    nodepoolsDisabled[np.metadata.name || ''] = true
                    setNodepoolGroupDisabled(true)
                    setNodepoolGroupChecked(null)
                }
            })

            setNodepoolsChecked({ ...nodepoolsChecked })
            setNodepoolsDisabled({ ...nodepoolsDisabled })
        }

        if (!isOverallNodepoolVersionSet && !overallNodepoolVersion) {
            setOverallNodepoolVersion(initialNodepoolVer)
        }
    }, [
        controlPlaneNewVersion,
        nodepoolGroupChecked,
        availableUpdateKeys,
        props.nodepools,
        nodepoolsChecked,
        checkNodepoolErrors,
        checkNodepoolsDisabled,
        overallNodepoolVersion,
        props.controlPlane.distribution?.ocp?.version,
        nodepoolsDisabled,
    ])

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
            props.nodepools.forEach((np) => {
                nodepoolsChecked[np.metadata.name || ''] = true
            })
        } else {
            props.nodepools.forEach((np) => {
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

    const handleNodepoolsChecked = (name: string) => {
        if (nodepoolsChecked[name] != undefined) {
            nodepoolsChecked[name] = !nodepoolsChecked[name]
        } else {
            nodepoolsChecked[name] = true
        }
        const numNodepoolsChecked = countTrue(nodepoolsChecked)
        if (numNodepoolsChecked === props.nodepools.length) {
            setNodepoolGroupChecked(true)
        }
        if (numNodepoolsChecked > 0 && numNodepoolsChecked < props.nodepools.length) {
            setNodepoolGroupChecked(null)
        }
        if (numNodepoolsChecked === 0) {
            setNodepoolGroupChecked(false)
        }
        setNodepoolsChecked({ ...nodepoolsChecked })

        checkNodepoolErrors()
    }

    const setAllNodepoolsCheckState = (checked: boolean) => {
        props.nodepools.forEach((np) => {
            nodepoolsChecked[np.metadata.name || ''] = checked
        })
        setNodepoolsChecked({ ...nodepoolsChecked })
    }

    const setAllNodepoolsDisableState = (disabled: boolean) => {
        props.nodepools.forEach((np) => {
            nodepoolsDisabled[np.metadata.name || ''] = disabled
        })
        setNodepoolsDisabled({ ...nodepoolsDisabled })
    }

    // Check if nodepools version will be greater than control plane version after upgrade
    const handleControlPlaneChecked = () => {
        setControlPlaneChecked(!controlPlaneChecked)

        if (!controlPlaneChecked === false) {
            if (nodepoolGroupChecked || countTrue(nodepoolsChecked) > 0) {
                if ((controlPlaneNewVersion || '') > (props.controlPlane.distribution?.ocp?.version || '')) {
                    setControlPlaneError(true)
                    setNodepoolErrors({})
                    //uncheck nodepools if same version as control plane

                    props.nodepools.forEach((np) => {
                        if ((np.status?.version || '') < (props.controlPlane.distribution?.ocp?.version || '')) {
                            nodepoolsChecked[np.metadata.name || ''] = true
                            setControlPlaneError(false)
                        } else {
                            nodepoolsChecked[np.metadata.name || ''] = false
                        }
                    })
                    setNodepoolsChecked({ ...nodepoolsChecked })
                    const npChecked = countTrue(nodepoolsChecked)
                    if (npChecked === 0) {
                        setNodepoolGroupChecked(false)
                    } else if (npChecked < props.nodepools.length) {
                        setNodepoolGroupChecked(null)
                    }

                    setNodepoolGroupDisabled(true)
                    setAllNodepoolsDisableState(true)
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

        const patchResult = patchResource(resourceYAML, patchYAML)
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
                        <TableComposable aria-label={t('Hypershift upgrade table')} variant="compact">
                            <Thead>
                                <Tr>
                                    <Th>{t(columnNames.name)}</Th>
                                    <Th>{t(columnNames.currentVersion)}</Th>
                                    <Th>{t(columnNames.newVersion)}</Th>
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
                                                    'Hosted control plane is already upgrade to the latest version available. Cluster node pools can be upgraded to match the control plane.'
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
                                            <span style={{ paddingLeft: controlPlaneCheckboxSpanWidth }}>
                                                {t('Hosted control plane')}
                                            </span>
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
                                                props.nodepools.forEach((np) => {
                                                    if (isTwoVersionsGreater(version, np.status?.version)) {
                                                        nodepoolsChecked[np.metadata.name || ''] = true
                                                    }
                                                })
                                                setNodepoolsChecked({ ...nodepoolsChecked })
                                                if (countTrue(nodepoolsChecked) === props.nodepools.length) {
                                                    setNodepoolGroupChecked(true)
                                                }
                                            }}
                                            value={controlPlaneNewVersion || ''}
                                            label=""
                                            maxHeight={'10em'}
                                            isRequired
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
                                {props.nodepools && props.nodepools.length > 0 && (
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
                                                            'Nodepools must be upgraded to the same version as the control plane in order to avoid compatibility issues due to being unsupported.'
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
                                                            'Nodepools cannot be upgraded to a later version than the control plane. If you wish to upgrade the nodepool(s), you must select to upgrade your control plane first.'
                                                        )}
                                                    />
                                                </Td>
                                            </Tr>
                                        )}
                                        <Tr key="hypershift-nodepools">
                                            <Td
                                                colSpan={nodepoolsExpanded ? 3 : undefined}
                                                dataLabel={columnNames.name}
                                                style={paddingZero}
                                            >
                                                <AcmExpandableCheckbox
                                                    onToggle={() => setNodepoolsExpanded(!nodepoolsExpanded)}
                                                    expanded={nodepoolsExpanded}
                                                    checked={nodepoolGroupChecked}
                                                    label={t('Cluster nodepools')}
                                                    onCheck={() => handleNodepoolGroupChecked()}
                                                    isDisabled={nodepoolGroupDisabled}
                                                    expandable={true}
                                                    id="nodepoolgroup"
                                                >
                                                    <TableComposable
                                                        aria-label={t('Hypershift upgrade nodepools table')}
                                                        borders={false}
                                                        variant="compact"
                                                    >
                                                        <Tbody>
                                                            {props.nodepools.map((np) => {
                                                                return (
                                                                    <Tr key={np.metadata.name}>
                                                                        <Td style={{ width: nodepoolsNameTdWidth }}>
                                                                            <AcmExpandableCheckbox
                                                                                onToggle={() =>
                                                                                    handleNodepoolToggled(
                                                                                        np.metadata.name || ''
                                                                                    )
                                                                                }
                                                                                expanded={isNodepoolToggled(
                                                                                    np.metadata.name || ''
                                                                                )}
                                                                                checked={isNodepoolChecked(
                                                                                    np.metadata.name
                                                                                )}
                                                                                label={np.metadata.name || ''}
                                                                                onCheck={() =>
                                                                                    handleNodepoolsChecked(
                                                                                        np.metadata.name || ''
                                                                                    )
                                                                                }
                                                                                isDisabled={isNodepoolDisabled(
                                                                                    np.metadata.name || ''
                                                                                )}
                                                                                additionalLabels={
                                                                                    props.controlPlane.hypershift?.agent
                                                                                        ? [`${np.spec.replicas} hosts`]
                                                                                        : undefined
                                                                                }
                                                                                expandable={
                                                                                    props.controlPlane.hypershift?.agent
                                                                                }
                                                                                id={np.metadata.name}
                                                                            >
                                                                                {props.controlPlane.hypershift?.agent &&
                                                                                    getNodepoolAgents(
                                                                                        np,
                                                                                        props.agents,
                                                                                        props.agentMachines,
                                                                                        props.hostedCluster
                                                                                    ).map((agent) => {
                                                                                        const hostName =
                                                                                            agent.spec.hostname ||
                                                                                            agent.status?.inventory
                                                                                                .hostname
                                                                                        return (
                                                                                            <div key={hostName}>
                                                                                                <span
                                                                                                    style={{
                                                                                                        paddingLeft:
                                                                                                            controlPlaneCheckboxSpanWidth,
                                                                                                    }}
                                                                                                >
                                                                                                    {hostName}
                                                                                                </span>
                                                                                            </div>
                                                                                        )
                                                                                    })}
                                                                            </AcmExpandableCheckbox>
                                                                        </Td>
                                                                        <Td style={{ width: nodepoolsVersionTdWidth }}>
                                                                            {np.status?.version}
                                                                        </Td>
                                                                        <Td>
                                                                            {isNodepoolChecked(np.metadata.name) ? (
                                                                                <Fragment>
                                                                                    {controlPlaneChecked ? (
                                                                                        <span>
                                                                                            {controlPlaneNewVersion}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span>
                                                                                            {
                                                                                                props.controlPlane
                                                                                                    .distribution?.ocp
                                                                                                    ?.version
                                                                                            }
                                                                                        </span>
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
                                                    </TableComposable>
                                                </AcmExpandableCheckbox>
                                            </Td>
                                            {!nodepoolsExpanded && (
                                                <Fragment>
                                                    <Td dataLabel={columnNames.currentVersion}>
                                                        <span>{overallNodepoolVersion}</span>
                                                    </Td>
                                                    <Td dataLabel={columnNames.newVersion}>
                                                        <span>
                                                            {nodepoolGroupChecked ? controlPlaneNewVersion : '-'}
                                                        </span>
                                                    </Td>
                                                </Fragment>
                                            )}
                                        </Tr>
                                    </Fragment>
                                )}
                            </Tbody>
                        </TableComposable>
                        <ActionGroup>
                            <AcmSubmit
                                key="submit-hypershift-upgrade-action"
                                id="submit-button-hypershift-upgrade"
                                isDisabled={
                                    !(controlPlaneChecked || countTrue(nodepoolsChecked) > 0) || controlPlaneError
                                }
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
                                    props.nodepools.forEach((np) => {
                                        if (nodepoolsChecked[np.metadata.name || ''] === true) {
                                            resultArr.push(
                                                performUpgrade(
                                                    'NodePool',
                                                    np,
                                                    controlPlaneChecked
                                                        ? props.availableUpdates[controlPlaneNewVersion || '']
                                                        : props.availableUpdates[
                                                              props.controlPlane.distribution?.ocp?.version || ''
                                                          ]
                                                )
                                            )
                                        }
                                    })

                                    const requestResult = resultsSettled(resultArr)
                                    const promiseResults = await requestResult.promise
                                    promiseResults.forEach((promiseResult, index) => {
                                        if (promiseResult.status === 'rejected') {
                                            errors.push({
                                                name:
                                                    index === 0
                                                        ? props.controlPlane.name
                                                        : props.nodepools[index - 1].metadata.name,
                                                type: index === 0 ? 'HostedCluster' : 'NodePool',
                                                msg: promiseResult.reason,
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
                            plural=""
                            items={patchErrors}
                            columns={[
                                {
                                    header: t('Name'),
                                    cell: (error) => {
                                        return error.name
                                    },
                                },
                                {
                                    header: t('Type'),
                                    cell: (error) => {
                                        return error.type
                                    },
                                },
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
                            {t('close')}
                        </Button>
                    </Fragment>
                )}
            </AcmForm>
        </AcmModal>
    )
}
