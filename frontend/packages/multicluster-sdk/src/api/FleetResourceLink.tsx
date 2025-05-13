/* Copyright Contributors to the Open Cluster Management project */
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk'
import { FleetResourceLinkProps } from '../types/fleet'
import { useFleetSupport } from '../internal/hooks/useFleetSupport'

export const FleetResourceLink: React.FC<FleetResourceLinkProps> = ({ cluster, ...props }) => {
  const fleetSupport = useFleetSupport()
  // not using shouldUseFleetSupport check here so that we always link to pages within "All Clusters" perspective
  if (fleetSupport) {
    const {
      sdkProvider: { FleetResourceLink },
    } = fleetSupport
    return <FleetResourceLink cluster={cluster} {...props} />
  } else {
    return <ResourceLink {...props} />
  }
}
