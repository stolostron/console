/* Copyright Contributors to the Open Cluster Management project */
import { useState } from 'react'
import { ExpandableSectionToggle, Icon, ProgressStep, Spinner, Stack, StackItem } from '@patternfly/react-core'
import { CheckCircleIcon, ExternalLinkAltIcon } from '@patternfly/react-icons'
import { HostedClusterK8sResource } from '@openshift-assisted/ui-lib/cim'
import { useTranslation } from '../../../../../lib/acm-i18next'
import ConditionsTable from './ConditionsTable'
import { AcmButton } from '../../../../../ui-components'
import './HypershiftClusterInstallProgress.css'
import { useClusterDetailsContext } from '../ClusterDetails/ClusterDetails'
import { DistributionField } from './DistributionField'
import { onToggle } from '../utils/utils'
import { launchToOCP } from '../../../../../lib/ocp-utils'

type HostedClusterProgressProps = {
  hostedCluster: HostedClusterK8sResource
  handleModalToggle: () => void
}

const HostedClusterProgress = ({ hostedCluster, handleModalToggle }: HostedClusterProgressProps) => {
  const { t } = useTranslation()
  const { cluster } = useClusterDetailsContext()
  const hostedClusterProgressID = `${window.location.href}hosted-cluster-progress`
  if (!localStorage.getItem(hostedClusterProgressID)) {
    localStorage.setItem(hostedClusterProgressID, 'show')
  }
  const [expanded, setExpanded] = useState(localStorage.getItem(hostedClusterProgressID) === 'show')

  const hostedClusterAvailable =
    hostedCluster?.status?.conditions?.find((c: any) => c.type === 'Available')?.status === 'True'

  return (
    <ProgressStep
      icon={
        <Icon status="success" isInProgress={!hostedClusterAvailable} progressIcon={<Spinner size="md" />}>
          <CheckCircleIcon />
        </Icon>
      }
    >
      <Stack hasGutter>
        <StackItem>
          <ExpandableSectionToggle
            isExpanded={expanded}
            onToggle={() => onToggle(hostedClusterProgressID, expanded, setExpanded)}
            className="nodepool-progress-item__header"
          >
            {t('Control plane')}
          </ExpandableSectionToggle>
        </StackItem>
        {expanded && (
          <>
            <StackItem className="nodepool-progress-item__body">
              <DistributionField
                cluster={cluster}
                clusterCurator={undefined}
                hostedCluster={hostedCluster}
                resource={'hostedcluster'}
              />
            </StackItem>
            <StackItem className="nodepool-progress-item__body">
              <ConditionsTable conditions={hostedCluster?.status?.conditions} handleModalToggle={handleModalToggle} />
            </StackItem>
            <StackItem className="nodepool-progress-item__body">
              <AcmButton
                variant="link"
                isInline
                onClick={() =>
                  launchToOCP(
                    `k8s/ns/${hostedCluster?.metadata?.namespace || ''}-${hostedCluster?.metadata?.name || ''}/pods`
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
