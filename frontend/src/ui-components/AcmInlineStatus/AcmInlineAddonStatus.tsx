/* Copyright Contributors to the Open Cluster Management project */

import { Label, LabelGroup } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, UnknownIcon, InProgressIcon } from '@patternfly/react-icons'
import { AddonStatus, ClusterManagementAddOn, getDisplayStatus, ManagedClusterAddOn } from '../../resources'

type AcmInlineAddonStatusGroupProps = {
  clusterManagementAddOns: ClusterManagementAddOn[]
  managedClusterAddOns: ManagedClusterAddOn[]
}

function statusLabel(clusterManagementAddOn: ClusterManagementAddOn, managedClusterAddOns: ManagedClusterAddOn[]) {
  const addonName = clusterManagementAddOn.metadata.name
  const addonStatus = getDisplayStatus(clusterManagementAddOn, managedClusterAddOns)

  switch (addonStatus) {
    case AddonStatus.Available:
      return (
        <Label color="green" icon={<CheckCircleIcon />}>
          {addonName}
        </Label>
      )
    case AddonStatus.Progressing:
      return (
        <Label color="grey" icon={<InProgressIcon />}>
          {addonName}
        </Label>
      )
    case AddonStatus.Degraded:
      return (
        <Label color="red" icon={<ExclamationCircleIcon />}>
          {addonName}
        </Label>
      )
    case AddonStatus.Unknown:
      return (
        <Label variant="outline" icon={<UnknownIcon />}>
          {addonName}
        </Label>
      )
    case AddonStatus.Disabled:
    default:
      return undefined
  }
}

export function AcmInlineAddonStatusGroup(props: AcmInlineAddonStatusGroupProps) {
  const { managedClusterAddOns, clusterManagementAddOns } = props
  const statusLabels = clusterManagementAddOns
    .map((clusterManagementAddOn) => statusLabel(clusterManagementAddOn, managedClusterAddOns))
    .filter((element) => element != undefined)
  return (
    <LabelGroup defaultIsOpen isClosable={false} numLabels={4}>
      {statusLabels ? statusLabels : '-'}
    </LabelGroup>
  )
}
