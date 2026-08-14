/* Copyright Contributors to the Open Cluster Management project */

import type { VPC } from '~/resources'
import { deriveAvailabilityZones, deriveRolesRef } from './enrichFormValues'

const mockVpcs: VPC[] = [
  {
    name: 'test-vpc',
    red_hat_managed: false,
    id: 'vpc-abc123',
    cidr_block: '10.0.0.0/16',
    aws_subnets: [
      {
        subnet_id: 'subnet-a1',
        name: 'private-1a',
        red_hat_managed: false,
        public: false,
        availability_zone: 'us-east-1a',
        cidr_block: '10.0.0.0/19',
      },
      {
        subnet_id: 'subnet-b1',
        name: 'private-1b',
        red_hat_managed: false,
        public: false,
        availability_zone: 'us-east-1b',
        cidr_block: '10.0.32.0/19',
      },
      {
        subnet_id: 'subnet-c1',
        name: 'private-1c',
        red_hat_managed: false,
        public: false,
        availability_zone: 'us-east-1c',
        cidr_block: '10.0.64.0/19',
      },
      {
        subnet_id: 'subnet-pub-a1',
        name: 'public-1a',
        red_hat_managed: false,
        public: true,
        availability_zone: 'us-east-1a',
        cidr_block: '10.0.128.0/19',
      },
    ],
  },
]

describe('deriveAvailabilityZones', () => {
  it('derives unique AZs from selected subnets when selected_vpc is a string ID', () => {
    const formValues = {
      selected_vpc: 'vpc-abc123',
      machine_pools_subnets: [{ machine_pool_subnet: 'subnet-a1' }, { machine_pool_subnet: 'subnet-b1' }],
    }
    expect(deriveAvailabilityZones(formValues, mockVpcs)).toEqual(['us-east-1a', 'us-east-1b'])
  })

  it('derives AZs when selected_vpc is a full VPC object', () => {
    const formValues = {
      selected_vpc: mockVpcs[0],
      machine_pools_subnets: [{ machine_pool_subnet: 'subnet-c1' }],
    }
    expect(deriveAvailabilityZones(formValues, mockVpcs)).toEqual(['us-east-1c'])
  })

  it('deduplicates AZs when multiple subnets share the same zone', () => {
    const formValues = {
      selected_vpc: 'vpc-abc123',
      machine_pools_subnets: [{ machine_pool_subnet: 'subnet-a1' }, { machine_pool_subnet: 'subnet-pub-a1' }],
    }
    expect(deriveAvailabilityZones(formValues, mockVpcs)).toEqual(['us-east-1a'])
  })

  it('returns undefined when no VPC is selected', () => {
    const formValues = {
      machine_pools_subnets: [{ machine_pool_subnet: 'subnet-a1' }],
    }
    expect(deriveAvailabilityZones(formValues, mockVpcs)).toBeUndefined()
  })

  it('returns undefined when no subnets are selected', () => {
    const formValues = {
      selected_vpc: 'vpc-abc123',
    }
    expect(deriveAvailabilityZones(formValues, mockVpcs)).toBeUndefined()
  })

  it('returns undefined when machine_pools_subnets is empty', () => {
    const formValues = {
      selected_vpc: 'vpc-abc123',
      machine_pools_subnets: [],
    }
    expect(deriveAvailabilityZones(formValues, mockVpcs)).toBeUndefined()
  })

  it('returns undefined when VPC ID does not match any VPC in the list', () => {
    const formValues = {
      selected_vpc: 'vpc-nonexistent',
      machine_pools_subnets: [{ machine_pool_subnet: 'subnet-a1' }],
    }
    expect(deriveAvailabilityZones(formValues, mockVpcs)).toBeUndefined()
  })

  it('returns undefined when selected subnet IDs do not match any VPC subnets', () => {
    const formValues = {
      selected_vpc: 'vpc-abc123',
      machine_pools_subnets: [{ machine_pool_subnet: 'subnet-unknown' }],
    }
    expect(deriveAvailabilityZones(formValues, mockVpcs)).toBeUndefined()
  })
})

describe('deriveRolesRef', () => {
  const baseFormValues = {
    custom_operator_roles_prefix: 'my-cluster-x1y2',
    installer_role_arn: 'arn:aws:iam::123456789012:role/my-cluster-Installer-Role',
  }

  it('derives all 8 operator role ARNs from prefix and installer ARN', () => {
    const rolesRef = deriveRolesRef(baseFormValues)
    expect(rolesRef).toBeDefined()
    expect(Object.keys(rolesRef!)).toHaveLength(8)

    expect(rolesRef!.controlPlaneOperatorARN).toBe(
      'arn:aws:iam::123456789012:role/my-cluster-x1y2-kube-system-control-plane-operator'
    )
    expect(rolesRef!.ingressARN).toBe(
      'arn:aws:iam::123456789012:role/my-cluster-x1y2-openshift-ingress-operator-cloud-credentials'
    )
    expect(rolesRef!.imageRegistryARN).toBe(
      'arn:aws:iam::123456789012:role/my-cluster-x1y2-openshift-image-registry-installer-cloud-credent'
    )
    expect(rolesRef!.kmsProviderARN).toBe('arn:aws:iam::123456789012:role/my-cluster-x1y2-kube-system-kms-provider')
    expect(rolesRef!.kubeCloudControllerARN).toBe(
      'arn:aws:iam::123456789012:role/my-cluster-x1y2-kube-system-kube-controller-manager'
    )
    expect(rolesRef!.networkARN).toMatch(/^arn:aws:iam::123456789012:role\/my-cluster-x1y2-openshift-cloud-network/)
    expect(rolesRef!.nodePoolManagementARN).toBe(
      'arn:aws:iam::123456789012:role/my-cluster-x1y2-kube-system-capa-controller-manager'
    )
    expect(rolesRef!.storageARN).toMatch(/^arn:aws:iam::123456789012:role\/my-cluster-x1y2-openshift-cluster-csi/)
  })

  it('truncates role names to 64 characters', () => {
    const rolesRef = deriveRolesRef(baseFormValues)!
    for (const arn of Object.values(rolesRef)) {
      const roleName = arn.split(':role/')[1]
      expect(roleName.length).toBeLessThanOrEqual(64)
    }
  })

  it('returns undefined when prefix is missing', () => {
    const formValues = { installer_role_arn: baseFormValues.installer_role_arn }
    expect(deriveRolesRef(formValues)).toBeUndefined()
  })

  it('returns undefined when installer ARN is missing', () => {
    const formValues = { custom_operator_roles_prefix: baseFormValues.custom_operator_roles_prefix }
    expect(deriveRolesRef(formValues)).toBeUndefined()
  })

  it('returns undefined when installer ARN has invalid format', () => {
    const formValues = {
      custom_operator_roles_prefix: 'my-prefix',
      installer_role_arn: 'not-a-valid-arn',
    }
    expect(deriveRolesRef(formValues)).toBeUndefined()
  })

  it('extracts account ID correctly from various ARN formats', () => {
    const formValues = {
      custom_operator_roles_prefix: 'test',
      installer_role_arn: 'arn:aws:iam::999888777666:role/SomeRole',
    }
    const rolesRef = deriveRolesRef(formValues)!
    expect(rolesRef.ingressARN).toContain('999888777666')
  })
})
