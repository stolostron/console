/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useRef, useState } from 'react'
import { useSharedReactQuery } from '~/hooks/shared-react-query'
import { NormalizedAccountRole, RoleType, SelectedSecret, WizardAccountRole } from '../constants/types'
import { AccountRole, AccountRoleARN, RoleARNsResponse } from '~/resources'
import { getWizardOCMRoleARN, getWizardRoleARNs, getWizardUserRoleARN } from '~/lib/rosa-hcp-api'
import { rosaWizardKeys } from './queryKeyFactory'

const toWizardRoles = (normalizedRoles: NormalizedAccountRole[]): WizardAccountRole[] => {
  return normalizedRoles.map((role) => ({
    installerRole: {
      label: role.roleArns.Installer ?? '',
      value: role.roleArns.Installer ?? '',
      roleVersion: role.version ?? '',
    },
    supportRole: role.roleArns.Support ? [{ label: role.roleArns.Support, value: role.roleArns.Support }] : [],
    workerRole: role.roleArns.Worker ? [{ label: role.roleArns.Worker, value: role.roleArns.Worker }] : [],
  }))
}

const normalizedAWSAccountRole = (arrayOfRoleItems: AccountRoleARN[], prefix: string): NormalizedAccountRole =>
  arrayOfRoleItems.reduce<NormalizedAccountRole>(
    (roleObj, { type, arn, roleVersion, managedPolicies, hcpManagedPolicies }) => ({
      ...roleObj,
      version: roleVersion,
      managedPolicies: roleObj.managedPolicies || managedPolicies,
      hcpManagedPolicies: roleObj.hcpManagedPolicies || hcpManagedPolicies,
      roleArns: { ...roleObj.roleArns, [type as RoleType]: arn },
    }),
    { prefix, version: '', roleArns: {} }
  )

export const normalizeAWSAccountRoles = (accountRoles: RoleARNsResponse): NormalizedAccountRole[] => {
  const normalizedRoles: NormalizedAccountRole[] = []

  ;(accountRoles?.items || []).forEach((accountRole: AccountRole) => {
    // Only use accountRoles that have more than 1 arn attached
    // This is to prevent managed policy roles created with an unsupported CLI version
    if (accountRole.items && accountRole.items.length > 1) {
      const managedPolicyArns: AccountRoleARN[] = []
      const unManagedPolicyArns: AccountRoleARN[] = []

      // Split into managed and unmanaged policy
      accountRole.items.forEach((item: AccountRoleARN) => {
        if (item.hcpManagedPolicies || item.managedPolicies) {
          managedPolicyArns.push(item)
        } else {
          unManagedPolicyArns.push(item)
        }
      })
      if (managedPolicyArns.length) {
        normalizedRoles.push(normalizedAWSAccountRole(managedPolicyArns, accountRole.prefix))
      }
      if (unManagedPolicyArns.length) {
        normalizedRoles.push(normalizedAWSAccountRole(unManagedPolicyArns, accountRole.prefix))
      }
    }
  })
  return normalizedRoles
}

export const useFetchRoleARNs = (selectedSecret: SelectedSecret) => {
  const { useQueries } = useSharedReactQuery()
  const [awsAccountId, setAwsAccountId] = useState<string | undefined>()
  const secretRef = useRef(selectedSecret)
  secretRef.current = selectedSecret

  const [rolesQuery, ocmRoleQuery, userRoleQuery] = useQueries({
    queries: [
      {
        queryKey: rosaWizardKeys.rolesArns(selectedSecret.client_id, awsAccountId),
        queryFn: async ({ signal }: { signal?: AbortSignal }) => {
          const secret = secretRef.current
          if (!secret || !awsAccountId) return { roles: [], error: null }
          const response = await getWizardRoleARNs(secret.client_id, secret.client_secret, signal, {
            aws_account_id: awsAccountId,
          })

          const normalized = normalizeAWSAccountRoles(response)
          const filtered = normalized.filter((arn) => arn.hcpManagedPolicies && arn.managedPolicies)
          return { roles: toWizardRoles(filtered), error: null }
        },
        enabled: !!selectedSecret && !!awsAccountId,
        retry: false,
      },
      {
        queryKey: rosaWizardKeys.ocmRoleArn(selectedSecret.client_id, awsAccountId),
        queryFn: async ({ signal }: { signal?: AbortSignal }) => {
          const secret = secretRef.current
          if (!secret || !awsAccountId) return null
          const response = await getWizardOCMRoleARN(secret.client_id, secret.client_secret, signal, {
            aws_account_id: awsAccountId,
          })
          return response
        },
        enabled: !!selectedSecret && !!awsAccountId,
        retry: false,
      },
      {
        queryKey: rosaWizardKeys.userRoleArn(selectedSecret.client_id),
        queryFn: async ({ signal }: { signal?: AbortSignal }) => {
          const secret = secretRef.current
          if (!secret || !awsAccountId) return null
          const response = await getWizardUserRoleARN(secret.client_id, secret.client_secret, signal)
          return response
        },
        // user roles should not be fetched if awsAccountId does not exist, but they do not rely on it.
        // They only return a check informing users to create user roles using rosa cli.
        enabled: !!selectedSecret && !!awsAccountId,
        retry: false,
      },
    ],
  })
  const fetch = useCallback(async (accountId: string) => {
    setAwsAccountId(accountId)
  }, [])

  const { refetch: refetchRoles } = rolesQuery
  const { refetch: refetchOcmRole } = ocmRoleQuery
  const { refetch: refetchUserRole } = userRoleQuery

  const refetchAll = useCallback(
    async (accountId: string) => {
      if (accountId !== awsAccountId) {
        fetch(accountId)
      } else {
        await Promise.all([refetchRoles(), refetchOcmRole(), refetchUserRole()])
      }
    },
    [awsAccountId, fetch, refetchRoles, refetchOcmRole, refetchUserRole]
  )

  const ocmRoleError = ocmRoleQuery.error instanceof Error ? ocmRoleQuery.error.message : null
  const userRoleError =
    userRoleQuery.error instanceof Error &&
    userRoleQuery.error.message === "AccountLabel with key='sts_user_role' not found"
      ? 'User role was not found'
      : null
  const rolesError = rolesQuery.data?.error ?? (rolesQuery.error instanceof Error ? rolesQuery.error.message : null)

  return {
    data: Array.isArray(rolesQuery.data?.roles) ? rolesQuery.data.roles : [],
    ocmRole: ocmRoleQuery.data ?? null,
    userRole: userRoleQuery.data ?? null,
    isLoading: rolesQuery.isLoading || ocmRoleQuery.isLoading,
    error: rolesError,
    ocmRoleError: ocmRoleError,
    userRoleError: userRoleError,
    refetch: refetchAll,
    fetch,
  }
}
