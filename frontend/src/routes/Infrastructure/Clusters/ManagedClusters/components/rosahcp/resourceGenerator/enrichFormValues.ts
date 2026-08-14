/* Copyright Contributors to the Open Cluster Management project */

import type { VPC } from '~/resources'

const IAM_ROLE_NAME_MAX_LENGTH = 64

const HCP_OPERATOR_ROLES: ReadonlyArray<{
  field: string
  namespace: string
  name: string
}> = [
  { field: 'controlPlaneOperatorARN', namespace: 'kube-system', name: 'control-plane-operator' },
  { field: 'imageRegistryARN', namespace: 'openshift-image-registry', name: 'installer-cloud-credentials' },
  { field: 'ingressARN', namespace: 'openshift-ingress-operator', name: 'cloud-credentials' },
  { field: 'kmsProviderARN', namespace: 'kube-system', name: 'kms-provider' },
  { field: 'kubeCloudControllerARN', namespace: 'kube-system', name: 'kube-controller-manager' },
  { field: 'networkARN', namespace: 'openshift-cloud-network-config-controller', name: 'cloud-credentials' },
  { field: 'nodePoolManagementARN', namespace: 'kube-system', name: 'capa-controller-manager' },
  { field: 'storageARN', namespace: 'openshift-cluster-csi-drivers', name: 'ebs-cloud-credentials' },
]

export function deriveAvailabilityZones(formValues: Record<string, unknown>, vpcList: VPC[]): string[] | undefined {
  const selectedVpcField = formValues.selected_vpc
  const vpc =
    typeof selectedVpcField === 'string'
      ? vpcList.find((v) => v.id === selectedVpcField)
      : (selectedVpcField as VPC | undefined)

  const subnets = formValues.machine_pools_subnets as Array<{ machine_pool_subnet?: string }> | undefined

  if (!vpc?.aws_subnets?.length || !subnets?.length) return undefined

  const selectedIds = new Set(subnets.map((s) => s.machine_pool_subnet).filter(Boolean))
  const azs = [...new Set(vpc.aws_subnets.filter((s) => selectedIds.has(s.subnet_id)).map((s) => s.availability_zone))]
  return azs.length > 0 ? azs : undefined
}

/**
 * Derives the CAPA ROSAControlPlane `rolesRef` from the operator role prefix
 * and the AWS account ID (extracted from the installer role ARN). Uses the
 * ROSA HCP operator role naming convention:
 *   arn:aws:iam::<account>:role/<prefix>-<namespace>-<name>
 * with the role name portion truncated to 64 characters (IAM limit).
 */
export function deriveRolesRef(formValues: Record<string, unknown>): Record<string, string> | undefined {
  const prefix = formValues.custom_operator_roles_prefix as string | undefined
  const installerArn = formValues.installer_role_arn as string | undefined
  if (!prefix || !installerArn) return undefined

  const accountId = installerArn.match(/arn:aws:iam::(\d+):role\//)?.[1]
  if (!accountId) return undefined

  const rolesRef: Record<string, string> = {}
  for (const { field, namespace, name } of HCP_OPERATOR_ROLES) {
    const roleName = `${prefix}-${namespace}-${name}`.substring(0, IAM_ROLE_NAME_MAX_LENGTH)
    rolesRef[field] = `arn:aws:iam::${accountId}:role/${roleName}`
  }
  return rolesRef
}
