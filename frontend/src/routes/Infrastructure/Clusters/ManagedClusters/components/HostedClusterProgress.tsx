/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { ExpandableSectionToggle, ProgressStep, Spinner, Stack, StackItem } from '@patternfly/react-core'
import { global_palette_green_500 as okColor } from '@patternfly/react-tokens'
import { CheckCircleIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { HostedClusterK8sResource } from 'openshift-assisted-ui-lib/cim'
import { useTranslation } from '../../../../../lib/acm-i18next'
import ConditionsTable from './ConditionsTable'
import { AcmButton } from '../../../../../ui-components'
import './HypershiftClusterInstallProgress.css'

type HostedClusterProgressProps = {
    hostedCluster: HostedClusterK8sResource
    launchToOCP: (urlSuffix: string, newTab: boolean) => void
}

const HostedClusterProgress = ({ hostedCluster, launchToOCP }: HostedClusterProgressProps) => {
    const { t } = useTranslation()
    const [isExpanded, setExpanded] = React.useState(true)

    const hostedClusterAvailable =
        hostedCluster.status?.conditions?.find((c: any) => c.type === 'Available')?.status === 'True'

    return (
        <ProgressStep icon={hostedClusterAvailable ? <CheckCircleIcon color={okColor.value} /> : <Spinner size="md" />}>
            <Stack hasGutter>
                <StackItem>
                    <ExpandableSectionToggle
                        isExpanded={isExpanded}
                        onToggle={setExpanded}
                        className="nodepool-progress-item__header"
                    >
                        {t('Control plane')}
                    </ExpandableSectionToggle>
                </StackItem>
                {isExpanded && (
                    <>
                        <StackItem className="nodepool-progress-item__body">
                            <ConditionsTable conditions={hostedCluster.status?.conditions} />
                        </StackItem>
                        <StackItem className="nodepool-progress-item__body">
                            <AcmButton
                                variant="link"
                                isInline
                                onClick={() =>
                                    launchToOCP(
                                        `k8s/ns/${hostedCluster.metadata?.namespace || ''}-${
                                            hostedCluster.metadata?.name || ''
                                        }/pods`,
                                        true
                                    )
                                }
                                icon={<ExternalLinkAltIcon />}
                                iconPosition="right"
                            >
                                {t('Control plane pods')}
                            </AcmButton>
                        </StackItem>
                    </>
                )}
            </Stack>
        </ProgressStep>
    )
}

export default HostedClusterProgress
