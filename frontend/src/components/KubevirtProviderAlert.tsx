/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useFleetSearchPoll } from '@stolostron/multicluster-sdk'
import { useSharedSelectors } from '../shared-recoil'
import { useTranslation } from '../lib/acm-i18next'
import { OperatorAlert } from './OperatorAlert'
import { SupportedOperator, useOperatorCheck } from '../lib/operatorCheck'
import { useAllClusters } from '../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { useLocalHubName } from '../hooks/use-local-hub'
import { handleSemverOperatorComparison } from '../lib/search-utils'
import { SearchOperator } from '../ui-components/AcmSearchInput'
import { Button, Label, Popover } from '@patternfly/react-core'
import { ExternalLinkAltIcon, InfoCircleIcon } from '@patternfly/react-icons'
import { Link } from 'react-router-dom-v5-compat'
import { AcmActionGroup } from '../ui-components/AcmActionGroup/AcmActionGroup'
import { useMultiClusterHubConsoleUrl } from '../lib/ocp-utils'
import { DOC_LINKS } from '../lib/doc-util'

export interface KubevirtProviderAlertProps {
  component: 'hint' | 'alert'
  variant: 'search' | 'clusterDetails'
  className?: string
  useLabelAlert?: boolean
}

/**
 * Utility function to check if a cluster version is less than 4.20
 * @param version - The cluster version string (e.g., "4.19.1", "OpenShift 4.19.2")
 * @returns boolean indicating if version is less than 4.20
 */
function isVersionLessThan420(version?: string): boolean {
  if (!version) return true // If no version, assume it's older

  // Use existing repository helper function for semver comparison
  return handleSemverOperatorComparison(version, '4.20.0', SearchOperator.LessThan)
}

/**
 * Custom hook to count the number of managed clusters that have VirtualMachine resources.
 * @returns Object containing the count of clusters with VMs and loading state
 */
function useClustersWithVirtualMachines() {
  // Search for VirtualMachine resources across all clusters
  const [virtualMachines, loaded, vmSearchError] = useFleetSearchPoll(
    {
      groupVersionKind: {
        group: 'kubevirt.io',
        version: 'v1',
        kind: 'VirtualMachine',
      },
      isList: true,
    },
    undefined, // No cluster filter - search all clusters
    30 // Poll every 30 seconds
  )

  const clustersWithVMsCount = useMemo(() => {
    // Don't show positive result if there's an error searching
    if (vmSearchError || !Array.isArray(virtualMachines)) {
      return 0
    }

    // Extract unique cluster names from VirtualMachine resources
    const uniqueClusters = new Set<string>()
    virtualMachines.forEach((vm: any) => {
      if (vm?.cluster) {
        uniqueClusters.add(vm.cluster)
      }
    })

    return uniqueClusters.size
  }, [virtualMachines, vmSearchError])

  return {
    clustersWithVMsCount,
    isLoading: !loaded,
    error: vmSearchError,
  }
}

export function KubevirtProviderAlert(
  props: Readonly<{
    component: 'hint' | 'alert'
    className?: string
    description?: string
    variant?: 'search' | 'clusterDetails'
    useLabelAlert?: boolean
  }>
) {
  const { kubevirtOperatorSubscriptionsValue } = useSharedSelectors()
  const kubevirtOperator = useOperatorCheck(SupportedOperator.kubevirt, kubevirtOperatorSubscriptionsValue)
  const { clustersWithVMsCount, isLoading: isVMCountLoading } = useClustersWithVirtualMachines()

  // Check if hub cluster is less than OCP v4.20
  const localHubName = useLocalHubName()
  const allClusters = useAllClusters(true)
  const isHubVersionLessThan420 = useMemo(() => {
    const hubCluster = allClusters.find((cluster) => cluster.name === localHubName)
    if (!hubCluster) return true // If hub cluster not found, assume older version

    const version = hubCluster.distribution?.displayVersion || hubCluster.distribution?.ocp?.version
    return isVersionLessThan420(version)
  }, [allClusters, localHubName])

  const { component, className, variant } = props
  const multiClusterHubConsoleUrl = useMultiClusterHubConsoleUrl()

  const showInstallPrompt = !kubevirtOperator.installed

  const { t } = useTranslation()

  const operatorName = 'OpenShift Virtualization'
  const upgradeHubTitle = t('Upgrade hub cluster to centrally manage VMs')
  const centrallyManageVmsTitle = t('Centrally manage VMs with Fleet Virtualization')

  const clusterDetailsDescription = t(
    'To automatically install the recommended operators for managing your VMs in this cluster, enable the OpenShift Virtualization integration on your MultiClusterHub.'
  )

  const upgradeHubClusterDetailsDescription = t(
    'Upgrade to OCP version 4.20 or newer. Then, enable the OpenShift Virtualization integration to install recommended operators to manage your VMs in this cluster centrally.'
  )

  const getSearchDescription = (count: number) =>
    t(
      'To automatically install the recommended operators for managing your VMs in {{count}} managed cluster, enable the OpenShift Virtualization integration on your MultiClusterHub.',
      { count }
    )

  const getUpgradeHubSearchDescription = (count: number) =>
    t(
      'Upgrade to OCP version 4.20 or newer. Then, enable the OpenShift Virtualization integration to install recommended operators to manage your VMs in {{count}} cluster centrally.',
      { count }
    )
  let message = ''
  let title = ''

  // Use the actual cluster count and version-appropriate descriptions when variant is specified
  if (variant === 'search') {
    message = isHubVersionLessThan420
      ? getUpgradeHubSearchDescription(clustersWithVMsCount)
      : getSearchDescription(clustersWithVMsCount)
    title = isHubVersionLessThan420 ? upgradeHubTitle : centrallyManageVmsTitle
  } else if (variant === 'clusterDetails') {
    message = isHubVersionLessThan420 ? upgradeHubClusterDetailsDescription : clusterDetailsDescription
    title = isHubVersionLessThan420 ? upgradeHubTitle : centrallyManageVmsTitle
  }

  // Default message when no variant is set
  if (showInstallPrompt && !variant) {
    message = props.description || t('Install CNV to get more features.')
  }

  // Create action links based on hub version and variant
  const getActionLinks = () => {
    if (!variant) return undefined

    const primaryLink = isHubVersionLessThan420 ? (
      <Link to="/settings/cluster/" target="_blank">
        <Button variant="link" isInline>
          {t('Upgrade hub cluster')}
        </Button>
      </Link>
    ) : (
      <Link aria-disabled={!multiClusterHubConsoleUrl} to={multiClusterHubConsoleUrl ?? ''} target="_blank">
        <Button variant="link" isInline>
          {t('Edit MultiClusterHub')}
        </Button>
      </Link>
    )

    return (
      <AcmActionGroup>
        {primaryLink}
        <Link to={DOC_LINKS.VIRTUALIZATION_DOC_BASE_PATH} target="_blank">
          <Button variant="link" icon={<ExternalLinkAltIcon />} iconPosition="right" isInline>
            {t('View documentation')}
          </Button>
        </Link>
      </AcmActionGroup>
    )
  }

  const actionLinks = getActionLinks()

  // If useLabelAlert is true, render a label with popover instead of the alert
  const renderLabelAlert = () => {
    if (!props.useLabelAlert || kubevirtOperator.pending || isVMCountLoading || !showInstallPrompt || !variant) {
      return null
    }

    const getPopoverPrimaryButton = () => {
      if (isHubVersionLessThan420) {
        return (
          <Button
            variant="primary"
            onClick={() => window.open('/settings/cluster/', '_blank')}
            style={{ marginRight: '8px' }}
          >
            {t('Upgrade hub cluster')}
          </Button>
        )
      }

      return (
        <Button
          variant="primary"
          isDisabled={!multiClusterHubConsoleUrl}
          onClick={() => window.open(multiClusterHubConsoleUrl ?? '', '_blank')}
          style={{ marginRight: '8px' }}
        >
          {t('Edit MultiClusterHub')}
        </Button>
      )
    }

    const popoverActionLinks = (
      <div style={{ marginTop: '16px' }}>
        {getPopoverPrimaryButton()}
        <Link to={DOC_LINKS.VIRTUALIZATION_DOC_BASE_PATH} target={'_blank'}>
          <Button variant="link" icon={<ExternalLinkAltIcon />} iconPosition="right" isInline>
            {t('View documentation')}
          </Button>
        </Link>
      </div>
    )

    return (
      <Popover
        aria-label="Operator recommendation"
        headerContent={title}
        triggerAction="hover"
        alertSeverityVariant="info"
        headerIcon={<InfoCircleIcon />}
        bodyContent={
          <div>
            <p>{message}</p>
            {popoverActionLinks}
          </div>
        }
        minWidth="30em"
      >
        <Label color="blue" icon={<InfoCircleIcon />} isCompact>
          {t('Operator recommended')}
        </Label>
      </Popover>
    )
  }

  const labelAlert = renderLabelAlert()
  if (labelAlert) return labelAlert

  // Default alert rendering
  return (
    <>
      {!kubevirtOperator.pending && !isVMCountLoading && showInstallPrompt && (
        <OperatorAlert {...{ component, message, operatorName, className, title, actionLinks }} isUpgrade={false} />
      )}
    </>
  )
}
