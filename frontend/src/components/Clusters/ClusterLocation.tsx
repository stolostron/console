/* Copyright Contributors to the Open Cluster Management project */

import { Content, ContentVariants, Tooltip } from '@patternfly/react-core'
import { BuildingIcon } from '@patternfly/react-icons'
import { getClusterLocation } from '~/lib/cluster-location'
import { useTranslation } from '~/lib/acm-i18next'

export function ClusterLocationLine(props: { labels?: Record<string, string> }) {
  const { t } = useTranslation()
  const { region, zone, datacenter } = getClusterLocation(props.labels)
  const regionZone = [region, zone].filter(Boolean).join(' · ')
  if (!regionZone && !datacenter) return null
  const datacenterLabel = datacenter ? `${t('cluster.location.datacenter')}: ${datacenter}` : undefined
  return (
    <Content component={ContentVariants.small}>
      {regionZone && <span>{regionZone}</span>}
      {datacenterLabel && (
        <Tooltip content={datacenterLabel}>
          <span role="img" aria-label={datacenterLabel}>
            {regionZone && ' '}
            <BuildingIcon />
          </span>
        </Tooltip>
      )}
    </Content>
  )
}
