/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { SelectedSecret } from './constants/types'
import { useCredentialsSecrets } from './hooks/useCredentialsSecrets'
import { useFetchOrganizationQuota } from './queries/useFetchAwsBillingAccountIds'
import { useFetchAwsAccountIDs } from './queries/useFetchAwsInfrastructureAccountIds'
import { useFetchOIDCConfigs } from './queries/useFetchOIDCConfigs'
import { useFetchHCPVersions } from './queries/useFetchOpenshiftVersions'
import { useFetchRegions } from './queries/useFetchRegions'
import { useFetchRoleARNs } from './queries/useFetchRolesARNs'
import { useFetchMachineTypes } from './queries/useFetchMachineTypes'
import { useFetchVPCs } from './queries/useFetchVPCs'
import { DropdownType, RosaHCPWizard, ROSAHCPWizardData } from '@redhat-cloud-services/nxtcm-rosa-hcp-wizard'
import { useClusterNameUniquenessCheck } from './queries/useCheckClusterNameUniqueness'
import { useLocation } from 'react-router'
import { NavigationPath } from '~/NavigationPath'
import { useTranslation } from '~/lib/acm-i18next'
import { AcmPage, AcmPageHeader } from '~/ui-components'

import '@redhat-cloud-services/nxtcm-rosa-hcp-wizard/dist/nxtcm-rosa-hcp-wizard.css'

const transform = (awsInfraAccounts: string[]): DropdownType[] =>
  awsInfraAccounts.map((acc) => ({ label: acc, value: acc }))

export const RosaHCPWrapper = () => {
  const secret = useCredentialsSecrets()
  const [t] = useTranslation()

  const location = useLocation()
  const selectedSecretName = (location.state as { selectedSecretName?: string })?.selectedSecretName
  const selectedSecretObj = useMemo(
    () => secret.find((s) => s.metadata.name === selectedSecretName) ?? secret[0],
    [secret, selectedSecretName]
  )
  const selectedSecret = selectedSecretObj?.data as SelectedSecret

  const {
    data: awsInfraAccounts,
    isLoading: isAwsInfraLoading,
    error: awsInfraError,
    refetch: awsInfraRefetch,
  } = useFetchAwsAccountIDs(selectedSecret)
  const {
    data: awsBillingAccounts,
    isLoading: isAwsBillingLoading,
    error: awsBillingError,
    refetch: awsBillingRefetch,
  } = useFetchOrganizationQuota(selectedSecret)
  const {
    data: regions,
    isLoading: isRegionsLoading,
    error: regionsError,
    refetch: regionsRefetch,
  } = useFetchRegions(selectedSecret)
  const {
    data: oidcConfig,
    isLoading: isOidcConfigLoading,
    error: oidcConfigError,
    fetch: refetchOidcConfig,
  } = useFetchOIDCConfigs(selectedSecret)
  const {
    data: accountRoleARNs,
    ocmRole,
    isLoading: isRolesARNsLoading,
    error: roleARNsError,
    ocmRoleError,
    userRoleError,
    refetch: refetchRolesARNs,
  } = useFetchRoleARNs(selectedSecret)
  const { data: vpcs, isLoading: isVPCsLoading, error: vpcsError, fetch: refetchVPCs } = useFetchVPCs(selectedSecret)
  const {
    data: versions,
    isLoading: isVersionsLoading,
    error: versionsError,
    refetch: versionsRefetch,
  } = useFetchHCPVersions(selectedSecret)
  const {
    data: machineTypes,
    isLoading: isMachineTypesLoading,
    error: machineTypesError,
    fetch: refetchMachineTypes,
  } = useFetchMachineTypes(selectedSecret)

  const resourceGenerator = useMemo(
    () => ({
      renderYaml: () => '',
      validateYaml: () => [],
      resourceSchemas: [],
    }),
    []
  )

  const { clusterNameValidation, checkClusterNameUniqueness } = useClusterNameUniquenessCheck(selectedSecret)

  const wizardData: ROSAHCPWizardData = useMemo(
    () => ({
      checkClusterNameUniqueness,
      clusterNameValidation,
      awsInfrastructureAccounts: {
        data: transform(awsInfraAccounts),
        error: awsInfraError instanceof Error ? awsInfraError.message : null,
        isFetching: isAwsInfraLoading,
        fetch: async () => {
          await awsInfraRefetch()
        },
      },
      awsBillingAccounts: {
        data: awsBillingAccounts,
        error: awsBillingError instanceof Error ? awsBillingError.message : null,
        isFetching: isAwsBillingLoading,
        fetch: async () => {
          await awsBillingRefetch()
        },
      },
      regions: {
        data: regions ?? [],
        error: regionsError,
        isFetching: isRegionsLoading,
        fetch: async () => {
          await regionsRefetch()
        },
      },
      versions: {
        data: versions ?? { releases: [] },
        error: versionsError instanceof Error ? versionsError.message : null,
        isFetching: isVersionsLoading,
        fetch: async () => {
          await versionsRefetch()
        },
      },
      machineTypes: {
        data: machineTypes,
        error: machineTypesError,
        isFetching: isMachineTypesLoading,
        fetch: refetchMachineTypes,
      },
      roles: {
        data: accountRoleARNs,
        error: roleARNsError,
        isFetching: isRolesARNsLoading,
        ocmRoleARN: ocmRole?.arn ?? null,
        ocmRoleError,
        userRoleError,
        fetch: refetchRolesARNs,
      },
      oidcConfig: {
        data: oidcConfig,
        error: oidcConfigError,
        isFetching: isOidcConfigLoading,
        fetch: refetchOidcConfig,
      },
      vpcList: {
        data: vpcs,
        error: vpcsError ?? null,
        isFetching: isVPCsLoading,
        fetch: refetchVPCs,
      },
      // This has to be removed from the wizard package: part of VPC api call
      subnets: {
        data: [],
        error: null,
        isFetching: false,
      },
      // This has to be removed from the wizard package: part of VPC api call
      securityGroups: {
        data: [],
        error: null,
        isFetching: false,
      },
    }),
  )

  const breadcrumbs = useMemo(() => {
    const newBreadcrumbs = [
      { text: t('Clusters'), to: NavigationPath.clusters },
      { text: t('Infrastructure'), to: NavigationPath.createCluster },
      { text: t('Control plane type - {{hcType}}', { hcType: 'AWS' }), to: NavigationPath.createAWSControlPlane },
      { text: t('ROSA HCP') },
    ]
    return newBreadcrumbs
  }, [t])

  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={t('Control plane type - {{hcType}}', { hcType: 'AWS' })}
          description={t('Choose a control plane type for your cluster.')}
          breadcrumb={breadcrumbs}
        />
      }
    >
      <RosaHCPWizard
        wizardData={wizardData}
        resourceGenerator={resourceGenerator}
        title="ROSA HCP WIZARD"
        onCancel={() => console.log('CANCELLED')}
        onSubmit={async (yamlString: string) => {
          console.log('SUBMITTED', yamlString)
        }}
      />
    </AcmPage>
  )
}
