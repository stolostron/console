/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useSearchResultRelatedCountQuery } from '../routes/Search/search-sdk/search-sdk'
import { searchClient } from '../routes/Search/search-sdk/search-client'
import { useSharedSelectors } from '../shared-recoil'
import { useTranslation } from '../lib/acm-i18next'
import { OperatorAlert } from './OperatorAlert'
import { SupportedOperator, useOperatorCheck } from '../lib/operatorCheck'
import { useAllClusters } from '../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { useLocalHubName } from '../hooks/use-local-hub'
import { useClusterVersion } from '../hooks/use-cluster-version'
import { handleSemverOperatorComparison } from '../lib/search-utils'
import { SearchOperator } from '../ui-components/AcmSearchInput'
import { Button, Label, Popover, Tooltip } from '@patternfly/react-core'
import { ExternalLinkAltIcon, InfoCircleIcon } from '@patternfly/react-icons'
import { Link } from 'react-router-dom-v5-compat'
import { AcmActionGroup } from '../ui-components/AcmActionGroup/AcmActionGroup'
import { AcmButton } from '../ui-components'
import { useMultiClusterHubConsoleUrl } from '../lib/ocp-utils'
import { DOC_LINKS } from '../lib/doc-util'

export interface KubevirtProviderAlertProps {
  component: 'hint' | 'alert'
  variant: 'search' | 'clusterDetails'
  className?: string
  useLabelAlert?: boolean
  hideAlertWhenNoVMsExists?: boolean
}

/**
 * Utility function to check if a cluster version is less than 4.20
 * @param version - The cluster version string (e.g., "4.19.1", "OpenShift 4.19.2")
 * @returns boolean indicating if version is less than 4.20
 */
function isVersionLessThan420(version?: string): boolean {
  if (!version) return true // If no version, assume it's older

  return handleSemverOperatorComparison(version, '4.20.0', SearchOperator.LessThan)
}

/**
 * Custom hook to count the number of managed clusters that have VirtualMachine resources.
 * @returns Object containing the count of clusters with VMs and loading state
 */
function useClustersWithVirtualMachines() {
  // Search for VirtualMachine resources and get related cluster count
  const { data, loading, error } = useSearchResultRelatedCountQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [
        {
          filters: [
            {
              property: 'kind',
              values: ['virtualmachine'],
            },
          ],
          relatedKinds: ['cluster'],
        },
      ],
    },
    pollInterval: 120000, // Poll every 120 seconds
  })

  const clustersWithVMsCount = useMemo(() => {
    // Don't show positive result if there's an error searching
    if (error || !data?.searchResult?.[0]?.related) {
      return 0
    }

    // Find the cluster count from related resources
    const clusterRelated = data.searchResult[0].related.find((related) => related?.kind?.toLowerCase() === 'cluster')

    return clusterRelated?.count || 0
  }, [data, error])

  return {
    clustersWithVMsCount,
    isLoading: loading,
    error,
  }
}

export function KubevirtProviderAlert(
  props: Readonly<{
    component: 'hint' | 'alert'
    className?: string
    description?: string
    variant: 'search' | 'clusterDetails'
    useLabelAlert?: boolean
    hideAlertWhenNoVMsExists?: boolean
  }>
) {
  const { kubevirtOperatorSubscriptionsValue } = useSharedSelectors()
  const kubevirtOperator = useOperatorCheck(SupportedOperator.kubevirt, kubevirtOperatorSubscriptionsValue)
  const { clustersWithVMsCount, isLoading: isVMCountLoading } = useClustersWithVirtualMachines()

  // Check if hub cluster is less than OCP v4.20
  const localHubName = useLocalHubName()
  const allClusters = useAllClusters(true)
  const { version: clusterVersionFromAPI, isLoading: isClusterVersionLoading } = useClusterVersion()
  const isHubVersionLessThan420 = useMemo(() => {
    // First try to use the direct ClusterVersion API result
    if (clusterVersionFromAPI && !isClusterVersionLoading) {
      return isVersionLessThan420(clusterVersionFromAPI)
    }

    // Fallback to the existing method if API call is still loading or failed
    const hubCluster = allClusters.find((cluster) => cluster.name === localHubName)
    if (!hubCluster) return true // If hub cluster not found, assume older version

    const version = hubCluster.distribution?.displayVersion || hubCluster.distribution?.ocp?.version
    return isVersionLessThan420(version)
  }, [allClusters, localHubName, clusterVersionFromAPI, isClusterVersionLoading])

  const { component, className, hideAlertWhenNoVMsExists, variant } = props
  const multiClusterHubConsoleUrl = useMultiClusterHubConsoleUrl()

  const hideAlert = hideAlertWhenNoVMsExists && clustersWithVMsCount === 0
  const showInstallPrompt = !kubevirtOperator.installed && !hideAlert

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

  // Create action links based on hub version and variant
  const getActionLinks = () => {
    if (!variant) return undefined

    let primaryLink
    if (isHubVersionLessThan420) {
      primaryLink = (
        <Link to="/settings/cluster/" target="_blank">
          <Button variant="link" isInline>
            {t('Upgrade hub cluster')}
          </Button>
        </Link>
      )
    } else if (multiClusterHubConsoleUrl) {
      primaryLink = (
        <Link to={multiClusterHubConsoleUrl} target="_blank">
          <Button variant="link" isInline>
            {t('Edit MultiClusterHub')}
          </Button>
        </Link>
      )
    } else {
      primaryLink = (
        <Tooltip content={t('rbac.unauthorized')}>
          <span className="link-disabled">{t('Edit MultiClusterHub')}</span>
        </Tooltip>
      )
    }

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
            style={{ marginRight: '0.5em' }}
          >
            {t('Upgrade hub cluster')}
          </Button>
        )
      }

      return (
        <AcmButton
          variant="primary"
          isDisabled={!multiClusterHubConsoleUrl}
          onClick={() => window.open(multiClusterHubConsoleUrl ?? '', '_blank')}
          style={{ marginRight: '0.5em' }}
          tooltip={multiClusterHubConsoleUrl ? undefined : t('rbac.unauthorized')}
        >
          {t('Edit MultiClusterHub')}
        </AcmButton>
      )
    }

    const popoverActionLinks = (
      <div style={{ marginTop: '1em' }}>
        {getPopoverPrimaryButton()}
        <Link to={DOC_LINKS.VIRTUALIZATION_DOC_BASE_PATH} target={'_blank'} style={{ marginLeft: '1em' }}>
          <Button variant="link" icon={<ExternalLinkAltIcon />} iconPosition="right" isInline>
            {t('View documentation')}
          </Button>
        </Link>
      </div>
    )

    return (
      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        aria-label="Alert"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <Popover
          aria-label="Operator recommendation"
          headerContent={title}
          triggerAction="click"
          alertSeverityVariant="info"
          headerIcon={<InfoCircleIcon />}
          bodyContent={
            <div>
              <p>{message}</p>
              {popoverActionLinks}
            </div>
          }
          maxWidth="35em"
        >
          <Label color="blue" icon={<InfoCircleIcon />} isCompact>
            {t('Operator recommended')}
          </Label>
        </Popover>
      </button>
    )
  }

  const labelAlert = renderLabelAlert()
  if (labelAlert) return labelAlert

  // Default alert rendering
  return (
    <>
      {!kubevirtOperator.pending && !isVMCountLoading && showInstallPrompt && message && (
        <OperatorAlert {...{ component, message, operatorName, className, title, actionLinks }} isUpgrade={false} />
      )}
    </>
  )
}
