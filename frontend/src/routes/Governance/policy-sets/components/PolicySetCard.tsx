/* Copyright Contributors to the Open Cluster Management project */

import {
    Card,
    CardActions,
    CardBody,
    CardHeader,
    CardTitle,
    Dropdown,
    DropdownItem,
    DropdownSeparator,
    KebabToggle,
    Stack,
} from '@patternfly/react-core'
import { AcmAlert, AcmDrawerContext } from '@stolostron/ui-components'
import { useContext, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { ConfirmModal, IConfirmModalProps } from '../../../../components/ConfirmModal'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { deleteResource, PolicySet } from '../../../../resources'
import { ClusterPolicyViolationIcons } from '../../components/ClusterPolicyViolations'
import { PolicyViolationIcons } from '../../components/PolicyViolations'
import { IPolicyRisks } from '../../useGovernanceData'
import { PolicySetDetailSidebar } from '../components/PolicySetDetailSidebar'
import { IPolicySetSummary, usePolicySetSummary } from '../usePolicySetSummary'

const deletePolicySetMessage =
    'Are you sure you want to delete <emphasis>{{name}}</emphasis>  in namespace <emphasis>{{namespace}}</emphasis>?'

function getClusterRisks(policySetSummary: IPolicySetSummary) {
    const clusterViolationCount = policySetSummary.clusterViolations
    const clusterNonViolationCount = policySetSummary.clusterCount - clusterViolationCount
    const clusterRisks: IPolicyRisks = {
        synced: clusterNonViolationCount,
        high: clusterViolationCount,
        medium: 0,
        low: 0,
        unknown: 0,
    }
    return clusterRisks
}

function getPolicyRisks(policySetSummary: IPolicySetSummary) {
    const policyViolationCount = policySetSummary.policyViolations
    const policyUnknownCount = policySetSummary.policyUnknownStatusCount
    const policyNonViolationCount = policySetSummary.policyCount - policyViolationCount - policyUnknownCount
    const policyRisks: IPolicyRisks = {
        synced: policyNonViolationCount,
        high: policyViolationCount,
        medium: 0,
        low: 0,
        unknown: policyUnknownCount,
    }
    return policyRisks
}

export default function PolicySetCard(props: { policySet: PolicySet }) {
    const { policySet } = props
    const { t } = useTranslation()
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const [isKebabOpen, setIsKebabOpen] = useState<boolean>(false)
    const history = useHistory()
    const [modalProps, setModalProps] = useState<IConfirmModalProps>({
        open: false,
        confirm: () => {},
        cancel: () => {},
        title: 'deleteModal',
        message: '',
    })
    const policySetSummary = usePolicySetSummary(policySet)

    const { clusterRisks, policyRisks } = useMemo(() => {
        const clusterRisks = getClusterRisks(policySetSummary)
        const policyRisks = getPolicyRisks(policySetSummary)
        return { policySetSummary, clusterRisks, policyRisks }
    }, [policySetSummary])

    function onClick(event: React.MouseEvent) {
        if (!event.currentTarget.contains(event.target as Node)) {
            return
        }
        setDrawerContext({
            isExpanded: true,
            onCloseClick: () => setDrawerContext(undefined),
            panelContent: <PolicySetDetailSidebar policySet={policySet} />,
            panelContentProps: { defaultSize: '40%' },
            isInline: true,
            isResizable: true,
        })
    }

    function onToggle(
        isOpen: boolean,
        event: MouseEvent | KeyboardEvent | React.KeyboardEvent<any> | React.MouseEvent<HTMLButtonElement>
    ) {
        event.stopPropagation()
        setIsKebabOpen(isOpen)
    }

    function onSelectOverflow(event?: React.SyntheticEvent<HTMLDivElement>) {
        event?.stopPropagation()
        setIsKebabOpen(false)
    }

    return (
        <Card
            isRounded
            isHoverable
            isFullHeight
            id={`policyset-${policySet.metadata.namespace}-${policySet.metadata.name}`}
            key={`policyset-${policySet.metadata.namespace}-${policySet.metadata.name}`}
            style={{ transition: 'box-shadow 0.25s', cursor: 'pointer' }}
            onClick={onClick}
        >
            <ConfirmModal {...modalProps} />
            <CardHeader isToggleRightAligned={true}>
                <CardActions>
                    <Dropdown
                        onSelect={onSelectOverflow}
                        toggle={<KebabToggle onToggle={onToggle} />}
                        isOpen={isKebabOpen}
                        isPlain
                        dropdownItems={[
                            <DropdownItem
                                key="view details"
                                onClick={() => {
                                    setDrawerContext({
                                        isExpanded: true,
                                        onCloseClick: () => setDrawerContext(undefined),
                                        panelContent: <PolicySetDetailSidebar policySet={policySet} />,
                                        panelContentProps: { defaultSize: '40%' },
                                        isInline: true,
                                        isResizable: true,
                                    })
                                }}
                            >
                                {t('View details')}
                            </DropdownItem>,
                            <DropdownItem
                                key="edit"
                                onClick={() => {
                                    history.push(
                                        NavigationPath.editPolicySet
                                            .replace(':namespace', policySet.metadata.namespace)
                                            .replace(':name', policySet.metadata.name)
                                    )
                                }}
                            >
                                {t('Edit')}
                            </DropdownItem>,
                            <DropdownSeparator key="separator" />,
                            <DropdownItem
                                key="delete"
                                onClick={() => {
                                    setIsKebabOpen(false)
                                    setModalProps({
                                        open: true,
                                        title: t('Delete policy set'),
                                        confirm: async () => {
                                            deleteResource({
                                                apiVersion: 'policy.open-cluster-management.io/v1',
                                                kind: 'PolicySet',
                                                metadata: {
                                                    name: policySet.metadata.name,
                                                    namespace: policySet.metadata.namespace,
                                                },
                                            })
                                                .promise.then(() => {
                                                    setModalProps({
                                                        open: false,
                                                        confirm: () => {},
                                                        cancel: () => {},
                                                        title: '',
                                                        message: '',
                                                    })
                                                    setDrawerContext(undefined)
                                                })
                                                .catch((err) => {
                                                    setModalProps((currentModalProps) => {
                                                        const copy = { ...currentModalProps }
                                                        copy.message = (
                                                            <div>
                                                                <Trans
                                                                    i18nKey={t(deletePolicySetMessage)}
                                                                    components={{ emphasis: <em /> }}
                                                                    values={{
                                                                        name: policySet.metadata.name,
                                                                        namespace: policySet.metadata.namespace,
                                                                    }}
                                                                />
                                                                <AcmAlert
                                                                    isInline
                                                                    noClose
                                                                    variant="danger"
                                                                    title={t('Error ocurred while deleting PolicySet')}
                                                                    message={err.message}
                                                                />
                                                            </div>
                                                        )
                                                        return copy
                                                    })
                                                })
                                        },
                                        confirmText: 'Delete',
                                        message: (
                                            <div>
                                                <Trans
                                                    i18nKey={t(deletePolicySetMessage)}
                                                    components={{ emphasis: <em /> }}
                                                    values={{
                                                        name: policySet.metadata.name,
                                                        namespace: policySet.metadata.namespace,
                                                    }}
                                                />
                                            </div>
                                        ),
                                        isDanger: true,
                                        cancel: () => {
                                            setModalProps({
                                                open: false,
                                                confirm: () => {},
                                                cancel: () => {},
                                                title: '',
                                                message: '',
                                            })
                                        },
                                    })
                                }}
                            >
                                {t('Delete')}
                            </DropdownItem>,
                        ]}
                        position={'right'}
                    />
                </CardActions>
                <CardTitle>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {policySet.metadata.name}
                        <div style={{ fontSize: 'small', opacity: 0.6, fontWeight: 'normal' }}>
                            {`Namespace: ${policySet.metadata.namespace}`}
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardBody>
                <Stack hasGutter>
                    {policySet.spec.description && <div>{policySet.spec.description ?? ''}</div>}
                    {policySetSummary.clusterCount > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span>
                                <strong>{policySetSummary.clusterCount}</strong> clusters
                            </span>
                            <div style={{ paddingLeft: 16 }}>
                                <ClusterPolicyViolationIcons risks={clusterRisks} />
                            </div>
                        </div>
                    )}
                    {policySetSummary.policyCount > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span>
                                <strong>{policySetSummary.policyCount}</strong> policies
                            </span>
                            <div style={{ paddingLeft: 16 }}>
                                <PolicyViolationIcons risks={policyRisks} />
                            </div>
                        </div>
                    )}
                </Stack>
            </CardBody>
        </Card>
    )
}
