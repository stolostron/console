/* Copyright Contributors to the Open Cluster Management project */

import {
  Alert,
  Button,
  ButtonVariant,
  Checkbox,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Modal,
  ModalVariant,
  PageSection,
  SelectOption,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import {
  AcmAlert,
  AcmButton,
  AcmDrawerContext,
  AcmSelect,
  AcmTable,
  compareStrings,
  IAcmTableAction,
  IAcmTableColumn,
  ITableFilter,
} from '../../../ui-components'
import moment from 'moment'
import { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState, useSharedAtoms } from '../../../shared-recoil'
import { BulkActionModal, BulkActionModalProps } from '../../../components/BulkActionModal'
import { useTranslation } from '../../../lib/acm-i18next'
import { deletePolicy } from '../../../lib/delete-policy'
import { formatDescriptionForDropdown, getPlacementBindingsForResource, getPlacementsForResource } from '../common/util'
import { checkPermission, rbacCreate, rbacUpdate, rbacPatch } from '../../../lib/rbac-util'
import { transformBrowserUrlToFilterPresets } from '../../../lib/urlQuery'
import { NavigationPath } from '../../../NavigationPath'
import {
  patchResource,
  Policy,
  PolicyApiVersion,
  PolicyAutomation,
  PolicyAutomationDefinition,
  PolicyDefinition,
  PolicyKind,
  PolicySet,
  replaceResource,
} from '../../../resources'
import { getResourceLabel } from '../../Applications/helpers/resource-helper'
import { getPolicyRemediation, getSource, PolicySetList, resolveExternalStatus, resolveSource } from '../common/util'
import { AutomationDetailsSidebar } from '../components/AutomationDetailsSidebar'
import { ClusterPolicyViolationIcons2 } from '../components/ClusterPolicyViolations'
import { GovernanceCreatePolicyEmptyState } from '../components/GovernanceEmptyState'
import { PolicyActionDropdown } from '../components/PolicyActionDropdown'
import {
  PolicyClusterViolationSummaryMap,
  usePolicyClusterViolationSummaryMap,
} from '../overview/PolicyViolationSummary'

export interface PolicyTableItem {
  policy: Policy
  source: string | JSX.Element
}

export default function PoliciesPage() {
  const { t } = useTranslation()
  const unauthorizedMessage = t('rbac.unauthorized')
  const presets = transformBrowserUrlToFilterPresets(window.location.search)
  const {
    channelsState,
    helmReleaseState,
    namespacesState,
    policyAutomationState,
    policySetsState,
    subscriptionsState,
    usePolicies,
  } = useSharedAtoms()
  const policies = usePolicies()
  const [helmReleases] = useRecoilState(helmReleaseState)
  const [subscriptions] = useRecoilState(subscriptionsState)
  const [channels] = useRecoilState(channelsState)
  const [policyAutomations] = useRecoilState(policyAutomationState)
  const [namespaces] = useRecoilState(namespacesState)
  const { setDrawerContext } = useContext(AcmDrawerContext)

  const tableItems: PolicyTableItem[] = useMemo(() => {
    return policies.map((policy) => {
      const isExternal = resolveExternalStatus(policy)
      let source: string | JSX.Element = t('Local')
      if (isExternal) {
        const policySource = resolveSource(policy, helmReleases, channels, subscriptions)
        source = policySource ? getSource(policySource, isExternal, t) : t('Managed externally')
      }
      return {
        policy,
        source,
      }
    })
  }, [policies, helmReleases, channels, subscriptions, t])

  const policyClusterViolationSummaryMap = usePolicyClusterViolationSummaryMap(policies)
  const history = useHistory()
  const [policySets] = useRecoilState(policySetsState)
  const [modalProps, setModalProps] = useState<BulkActionModalProps<PolicyTableItem> | { open: false }>({
    open: false,
  })

  const policyKeyFn = useCallback(
    (resource: PolicyTableItem) =>
      resource.policy.metadata.uid ?? `${resource.policy.metadata.name}/${resource.policy.metadata.namespace}`,
    []
  )
  const policyClusterViolationsColumn = usePolicyViolationsColumn(policyClusterViolationSummaryMap)
  const [modal, setModal] = useState<ReactNode | undefined>()
  const [canCreatePolicy, setCanCreatePolicy] = useState<boolean>(false)
  const [canPatchPolicy, setCanPatchPolicy] = useState<boolean>(false)
  const [canCreatePolicyAutomation, setCanCreatePolicyAutomation] = useState<boolean>(false)
  const [canUpdatePolicyAutomation, setCanUpdatePolicyAutomation] = useState<boolean>(false)

  useEffect(() => {
    checkPermission(rbacCreate(PolicyDefinition), setCanCreatePolicy, namespaces)
    checkPermission(rbacPatch(PolicyDefinition), setCanPatchPolicy, namespaces)
    checkPermission(rbacCreate(PolicyAutomationDefinition), setCanCreatePolicyAutomation, namespaces)
    checkPermission(rbacUpdate(PolicyAutomationDefinition), setCanUpdatePolicyAutomation, namespaces)
  }, [namespaces])

  const policyColumns = useMemo<IAcmTableColumn<PolicyTableItem>[]>(
    () => [
      {
        header: t('Name'),
        cell: (item: PolicyTableItem) => {
          return (
            <Link
              to={{
                pathname: NavigationPath.policyDetails
                  .replace(':namespace', item.policy.metadata.namespace as string)
                  .replace(':name', item.policy.metadata.name as string),
                state: {
                  from: NavigationPath.policies,
                },
              }}
            >
              {item.policy.metadata.name}
            </Link>
          )
        },
        sort: 'policy.metadata.name',
        search: 'policy.metadata.name',
      },
      {
        header: t('Namespace'),
        cell: 'policy.metadata.namespace',
        sort: 'policy.metadata.namespace',
        search: 'policy.metadata.namespace',
      },
      {
        header: t('Status'),
        sort: (itemA: PolicyTableItem, itemB: PolicyTableItem) => {
          const statusA = itemA.policy.spec.disabled === true ? t('Disabled') : t('Enabled')
          const statusB = itemB.policy.spec.disabled === true ? t('Disabled') : t('Enabled')
          return compareStrings(statusA, statusB)
        },
        cell: (item: PolicyTableItem) => (
          <span>{item.policy.spec.disabled === true ? t('Disabled') : t('Enabled')}</span>
        ),
      },
      {
        header: t('Remediation'),
        cell: (item: PolicyTableItem) => {
          return getPolicyRemediation(item.policy)
        },
        sort: (itemA: PolicyTableItem, itemB: PolicyTableItem) => {
          const itemARemediation = getPolicyRemediation(itemA.policy)
          const itemBRemediation = getPolicyRemediation(itemB.policy)
          return compareStrings(itemARemediation, itemBRemediation)
        },
      },
      {
        header: t('Policy set'),
        search: (item: PolicyTableItem) => {
          const policySetsMatch = policySets
            .filter(
              (policySet: PolicySet) =>
                policySet.metadata.namespace === item.policy.metadata.namespace &&
                policySet.spec.policies.includes(item.policy.metadata.name!)
            )
            .map((policySet: PolicySet) => policySet.metadata.name)
          if (policySetsMatch.length > 0) {
            return policySetsMatch.join(', ')
          }
          return ''
        },
        cell: (item: PolicyTableItem) => {
          const policySetsMatch = policySets.filter(
            (policySet: PolicySet) =>
              policySet.metadata.namespace === item.policy.metadata.namespace &&
              policySet.spec.policies.includes(item.policy.metadata.name!)
          )
          if (policySetsMatch.length > 0) {
            return <PolicySetList policySets={policySetsMatch} />
          }
          return '-'
        },
      },
      policyClusterViolationsColumn,
      {
        header: t('Source'),
        sort: (itemA: PolicyTableItem, itemB: PolicyTableItem) => {
          let itemAText = itemA.source as string
          let itemBText = itemB.source as string
          if (typeof itemA.source === 'object') {
            const type = itemA.source.props?.appRepos[0]?.type?.toLowerCase() ?? ''
            itemAText = getResourceLabel(type, 1, t)
          }
          if (typeof itemB.source === 'object') {
            const type = itemB.source.props?.appRepos[0]?.type?.toLowerCase() ?? ''
            itemBText = getResourceLabel(type, 1, t)
          }
          return compareStrings(itemAText, itemBText)
        },
        cell: (item: PolicyTableItem) => {
          return item.source ? item.source : '-'
        },
      },
      {
        header: t('Automation'),
        sort: (itemA: PolicyTableItem, itemB: PolicyTableItem) => {
          const policyAutomationMatchA = policyAutomations.find(
            (pa: PolicyAutomation) => pa.spec.policyRef === itemA.policy.metadata.name
          )
          const policyAutomationMatchB = policyAutomations.find(
            (pa: PolicyAutomation) => pa.spec.policyRef === itemB.policy.metadata.name
          )
          const automationA = policyAutomationMatchA ? policyAutomationMatchA.metadata.name : 'configure'
          const automationB = policyAutomationMatchB ? policyAutomationMatchB.metadata.name : 'configure'
          return compareStrings(automationA, automationB)
        },
        cell: (item: PolicyTableItem) => {
          const policyAutomationMatch = policyAutomations.find(
            (pa: PolicyAutomation) => pa.spec.policyRef === item.policy.metadata.name
          )
          if (policyAutomationMatch) {
            return (
              <AcmButton
                isDisabled={!canUpdatePolicyAutomation}
                tooltip={!canUpdatePolicyAutomation ? unauthorizedMessage : ''}
                isInline
                variant={ButtonVariant.link}
                onClick={() =>
                  setDrawerContext({
                    isExpanded: true,
                    onCloseClick: () => {
                      setDrawerContext(undefined)
                    },
                    title: policyAutomationMatch.metadata.name,
                    panelContent: (
                      <AutomationDetailsSidebar
                        setModal={setModal}
                        policyAutomationMatch={policyAutomationMatch}
                        policy={item.policy}
                        onClose={() => setDrawerContext(undefined)}
                      />
                    ),
                    panelContentProps: { defaultSize: '40%' },
                    isInline: true,
                    isResizable: true,
                  })
                }
              >
                {policyAutomationMatch.metadata.name}
              </AcmButton>
            )
          } else {
            return (
              <AcmButton
                isDisabled={!canCreatePolicyAutomation}
                tooltip={!canCreatePolicyAutomation ? unauthorizedMessage : ''}
                isInline
                variant={ButtonVariant.link}
                component={Link}
                to={{
                  pathname: NavigationPath.createPolicyAutomation
                    .replace(':namespace', item.policy.metadata.namespace as string)
                    .replace(':name', item.policy.metadata.name as string),
                  state: {
                    from: NavigationPath.policies,
                  },
                }}
              >
                {t('Configure')}
              </AcmButton>
            )
          }
        },
      },
      {
        header: t('Created'),
        cell: (item: PolicyTableItem) => {
          if (item.policy.metadata?.creationTimestamp) {
            return <span>{moment(new Date(item.policy.metadata?.creationTimestamp)).fromNow()}</span>
          }
          return '-'
        },
        sort: 'policy.metadata.creationTimestamp',
      },
      {
        header: '',
        cell: (item: PolicyTableItem) => {
          return <PolicyActionDropdown setModal={setModal} item={item} isKebab={true} />
        },
        cellTransforms: [fitContent],
      },
    ],
    [
      policyClusterViolationsColumn,
      policySets,
      policyAutomations,
      setDrawerContext,
      canCreatePolicyAutomation,
      canUpdatePolicyAutomation,
      unauthorizedMessage,
      t,
    ]
  )

  const bulkModalStatusColumns = useMemo(
    () => [
      {
        header: t('policy.tableHeader.name'),
        cell: 'policy.metadata.name',
        sort: 'policy.metadata.name',
      },
      {
        header: t('policy.table.actionGroup.status'),
        cell: (item: PolicyTableItem) => (
          <span>
            {item.policy.spec.disabled === true
              ? t('policy.table.actionGroup.status.disabled')
              : t('policy.table.actionGroup.status.enabled')}
          </span>
        ),
      },
    ],
    [t]
  )

  const bulkModalRemediationColumns = useMemo(
    () => [
      {
        header: t('policy.tableHeader.name'),
        cell: 'policy.metadata.name',
        sort: 'policy.metadata.name',
      },
      {
        header: t('policy.table.actionGroup.status'),
        cell: (item: PolicyTableItem) => getPolicyRemediation(item.policy),
      },
    ],
    [t]
  )

  const tableActions = useMemo<IAcmTableAction<PolicyTableItem>[]>(
    () => [
      {
        variant: 'bulk-action',
        id: 'add-to-set',
        title: t('policy.table.actions.addToPolicySet'),
        click: (item) => {
          setModal(<AddToPolicySetModal policyTableItems={...item} onClose={() => setModal(undefined)} />)
        },
        tooltip: t('Add to policy set'),
        isDisabled: !canPatchPolicy,
      },
      {
        id: 'seperator-1',
        variant: 'action-seperator',
      },
      {
        variant: 'action-group',
        id: 'status',
        title: t('policy.table.actionGroup.status'),
        actions: [
          {
            variant: 'bulk-action',
            id: 'enable',
            title: t('policy.table.actions.enable'),
            tooltip: t('Enable policies'),
            click: (item) => {
              setModalProps({
                open: true,
                title: t('policy.modal.title.enable'),
                action: t('policy.table.actions.enable'),
                processing: t('policy.table.actions.enabling'),
                items: [...item],
                emptyState: undefined, // there is always 1 item supplied
                description: t('policy.modal.message.enable'),
                columns: bulkModalStatusColumns,
                keyFn: (item: PolicyTableItem) => item.policy.metadata.uid as string,
                actionFn: (item) => {
                  return patchResource(
                    {
                      apiVersion: PolicyApiVersion,
                      kind: PolicyKind,
                      metadata: {
                        name: item.policy.metadata.name,
                        namespace: item.policy.metadata.namespace,
                      },
                    } as Policy,
                    [{ op: 'replace', path: '/spec/disabled', value: false }]
                  )
                },
                close: () => {
                  setModalProps({ open: false })
                },
                hasExternalResources:
                  [...item].filter((item) => {
                    return item.source !== 'Local'
                  }).length > 0,
              })
            },
            isDisabled: !canPatchPolicy,
          },
          {
            variant: 'bulk-action',
            id: 'disable',
            title: t('policy.table.actions.disable'),
            tooltip: t('Disable policies'),
            click: (item) => {
              setModalProps({
                open: true,
                title: t('policy.modal.title.disable'),
                action: t('policy.table.actions.disable'),
                processing: t('policy.table.actions.disabling'),
                items: [...item],
                emptyState: undefined, // there is always 1 item supplied
                description: t('policy.modal.message.disable'),
                columns: bulkModalStatusColumns,
                keyFn: (item: PolicyTableItem) => item.policy.metadata.uid as string,
                actionFn: (item) => {
                  return patchResource(
                    {
                      apiVersion: PolicyApiVersion,
                      kind: PolicyKind,
                      metadata: {
                        name: item.policy.metadata.name,
                        namespace: item.policy.metadata.namespace,
                      },
                    } as Policy,
                    [{ op: 'replace', path: '/spec/disabled', value: true }]
                  )
                },
                close: () => {
                  setModalProps({ open: false })
                },
                hasExternalResources:
                  [...item].filter((item) => {
                    return item.source !== 'Local'
                  }).length > 0,
              })
            },
            isDisabled: !canPatchPolicy,
          },
        ],
      },
      {
        id: 'seperator-2',
        variant: 'action-seperator',
      },
      {
        variant: 'action-group',
        id: 'remediation',
        title: t('policy.table.actionGroup.remediation'),
        actions: [
          {
            variant: 'bulk-action',
            id: 'inform',
            title: t('policy.table.actions.inform'),
            tooltip: t('Inform policies'),
            click: (item) => {
              setModalProps({
                open: true,
                title: t('policy.modal.title.inform'),
                action: t('policy.table.actions.inform'),
                processing: t('policy.table.actions.informing'),
                items: [...item],
                emptyState: undefined, // there is always 1 item supplied
                description: t('policy.modal.message.inform'),
                columns: bulkModalRemediationColumns,
                keyFn: (item: PolicyTableItem) => item.policy.metadata.uid as string,
                actionFn: (item) => {
                  return patchResource(
                    {
                      apiVersion: PolicyApiVersion,
                      kind: PolicyKind,
                      metadata: {
                        name: item.policy.metadata.name,
                        namespace: item.policy.metadata.namespace,
                      },
                    } as Policy,
                    [{ op: 'replace', path: '/spec/remediationAction', value: 'inform' }]
                  )
                },
                close: () => {
                  setModalProps({ open: false })
                },
                hasExternalResources:
                  [...item].filter((item) => {
                    return item.source !== 'Local'
                  }).length > 0,
              })
            },
            isDisabled: !canPatchPolicy,
          },
          {
            variant: 'bulk-action',
            id: 'enforce',
            title: t('policy.table.actions.enforce'),
            tooltip: t('Enforce policies'),
            click: (item) => {
              setModalProps({
                open: true,
                title: t('policy.modal.title.enforce'),
                action: t('policy.table.actions.enforce'),
                processing: t('policy.table.actions.enforcing'),
                items: [...item],
                emptyState: undefined, // there is always 1 item supplied
                description: t('policy.modal.message.enforce'),
                columns: bulkModalRemediationColumns,
                keyFn: (item: PolicyTableItem) => item.policy.metadata.uid as string,
                actionFn: (item) => {
                  return patchResource(
                    {
                      apiVersion: PolicyApiVersion,
                      kind: PolicyKind,
                      metadata: {
                        name: item.policy.metadata.name,
                        namespace: item.policy.metadata.namespace,
                      },
                    } as Policy,
                    [{ op: 'replace', path: '/spec/remediationAction', value: 'enforce' }]
                  )
                },
                close: () => {
                  setModalProps({ open: false })
                },
                hasExternalResources:
                  [...item].filter((item) => {
                    return item.source !== 'Local'
                  }).length > 0,
              })
            },
            isDisabled: !canPatchPolicy,
          },
        ],
      },
    ],
    [t, bulkModalStatusColumns, bulkModalRemediationColumns, canPatchPolicy]
  )

  const getSourceOptions = useCallback(() => {
    const newOptions: { label: string; value: string }[] = []
    tableItems.forEach((item) => {
      let itemText = item.source as string
      if (typeof item.source === 'object') {
        const type = item.source.props?.appRepos[0].type?.toLowerCase() ?? ''
        itemText = getResourceLabel(type, 1, t)
      }
      if (newOptions.filter((option) => option.label === itemText).length === 0) {
        newOptions.push({
          label: itemText,
          value: itemText,
        })
      }
    })
    return newOptions
  }, [tableItems, t])

  const filters = useMemo<ITableFilter<PolicyTableItem>[]>(
    () => [
      {
        id: 'violations',
        label: 'Cluster violations',
        options: [
          {
            label: t('Without violations'),
            value: 'without-violations',
          },
          {
            label: t('With violations'),
            value: 'with-violations',
          },
          {
            label: t('Pending'),
            value: 'pending',
          },
          {
            label: t('No status'),
            value: 'no-status',
          },
        ],
        tableFilterFn: (selectedValues, item) => {
          if (selectedValues.includes('with-violations')) {
            if (item.policy.status?.status !== undefined) {
              for (let i = 0; i < item.policy.status?.status.length; i++) {
                const cl = item.policy.status?.status[i]
                if (cl.compliant !== undefined && cl.compliant == 'NonCompliant') {
                  return true
                }
              }
            }
          }
          if (selectedValues.includes('without-violations')) {
            if (item.policy.status?.status !== undefined) {
              for (let i = 0; i < item.policy.status?.status.length; i++) {
                const cl = item.policy.status?.status[i]
                if (cl.compliant !== undefined && cl.compliant == 'Compliant') {
                  return true
                }
              }
            }
          }
          if (selectedValues.includes('pending')) {
            if (item.policy.status?.status !== undefined) {
              for (let i = 0; i < item.policy.status?.status.length; i++) {
                const cl = item.policy.status?.status[i]
                if (cl.compliant !== undefined && cl.compliant == 'Pending') {
                  return true
                }
              }
            }
          }
          if (selectedValues.includes('no-status')) {
            if (!item.policy.status?.status) {
              return true
            }
            for (let i = 0; i < item.policy.status?.status.length; i++) {
              const cl = item.policy.status?.status[i]
              if (!cl.compliant) {
                return true
              }
            }
          }
          return false
        },
      },
      {
        id: 'namespace',
        label: t('Namespace'),
        options: namespaces.map((namespace) => ({
          label: namespace.metadata.name,
          value: namespace.metadata.name ?? '',
        })),
        tableFilterFn: (selectedValues, item) => {
          return selectedValues.includes(item.policy.metadata.namespace ?? '')
        },
      },
      {
        id: 'source',
        label: t('Source'),
        options: getSourceOptions(),
        tableFilterFn: (selectedValues, item) => {
          let itemText = item.source as string
          if (typeof item.source === 'object') {
            const type = item.source.props?.appRepos[0]?.type?.toLowerCase() ?? ''
            itemText = getResourceLabel(type, 1, t)
          }
          return selectedValues.includes(itemText ?? '')
        },
      },
      {
        id: 'remediation',
        label: t('Remediation'),
        options: [
          { label: t('Inform'), value: 'inform' },
          { label: t('Enforce'), value: 'enforce' },
          { label: t('Inform/Enforce'), value: 'inform/enforce' },
        ],
        tableFilterFn: (selectedValues, item) => {
          const policyRemediation = getPolicyRemediation(item.policy)
          return selectedValues.includes(policyRemediation)
        },
      },
      {
        id: 'enabled',
        label: t('Enabled'),
        options: [
          {
            label: t('True'),
            value: 'True',
          },
          {
            label: t('False'),
            value: 'False',
          },
        ],
        tableFilterFn: (selectedValues, item) => {
          if (selectedValues.includes('True')) {
            if (!item.policy.spec.disabled) return true
          }
          if (selectedValues.includes('False')) {
            if (item.policy.spec.disabled) return true
          }
          return false
        },
      },
    ],
    [namespaces, t, getSourceOptions]
  )

  if (tableItems.length === 0) {
    return (
      <PageSection isFilled>
        <GovernanceCreatePolicyEmptyState rbac={canCreatePolicy} />
      </PageSection>
    )
  }

  return (
    <PageSection>
      {modal !== undefined && modal}
      <BulkActionModal<PolicyTableItem> {...modalProps} />
      <AcmTable<PolicyTableItem>
        id="policyTable"
        columns={policyColumns}
        keyFn={policyKeyFn}
        items={tableItems}
        emptyState={undefined} // only shown when tableItems.length > 0
        tableActions={tableActions}
        initialFilters={
          presets.initialFilters.violations ? { violations: presets.initialFilters.violations } : undefined
        }
        filters={filters}
        tableActionButtons={[
          {
            isDisabled: !canCreatePolicy,
            tooltip: !canCreatePolicy ? unauthorizedMessage : '',
            variant: ButtonVariant.primary,
            id: 'create',
            title: t('Create policy'),
            click: () => history.push(NavigationPath.createPolicy),
          },
        ]}
        addSubRows={(item: PolicyTableItem) => {
          const standards = item.policy.metadata.annotations?.['policy.open-cluster-management.io/standards']
          const controls = item.policy.metadata.annotations?.['policy.open-cluster-management.io/controls']
          const categories = item.policy.metadata.annotations?.['policy.open-cluster-management.io/categories']
          const desc = item.policy.metadata.annotations?.['policy.open-cluster-management.io/description']
          const formattedDescription = formatDescriptionForDropdown(desc as string)
          return [
            {
              cells: [
                {
                  title: (
                    <Stack hasGutter>
                      <StackItem>
                        <DescriptionList isAutoFit isAutoColumnWidths>
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Description')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              {formattedDescription.length > 0 ? (
                                formattedDescription
                              ) : (
                                <Button
                                  variant="link"
                                  isInline
                                  onClick={() => {
                                    const path = NavigationPath.editPolicy
                                      .replace(':namespace', item.policy.metadata.namespace!)
                                      .replace(':name', item.policy.metadata.name!)
                                    history.push(path + '?context=policies')
                                  }}
                                >
                                  Add
                                </Button>
                              )}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </StackItem>
                      <StackItem>
                        <DescriptionList isAutoFit isAutoColumnWidths>
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Standards')}</DescriptionListTerm>
                            <DescriptionListDescription>{standards ?? '-'}</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Controls')}</DescriptionListTerm>
                            <DescriptionListDescription>{controls ?? '-'}</DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Categories')}</DescriptionListTerm>
                            <DescriptionListDescription>{categories ?? '-'}</DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </StackItem>
                    </Stack>
                  ),
                },
              ],
            },
          ]
        }}
      />
    </PageSection>
  )
}

function usePolicyViolationsColumn(
  policyClusterViolationSummaryMap: PolicyClusterViolationSummaryMap
): IAcmTableColumn<PolicyTableItem> {
  const { t } = useTranslation()
  return {
    header: t('Cluster violations'),
    cell: (item) => {
      const clusterViolationSummary = policyClusterViolationSummaryMap[item.policy.metadata.uid ?? '']
      if (
        clusterViolationSummary.compliant ||
        clusterViolationSummary.noncompliant ||
        clusterViolationSummary.pending ||
        clusterViolationSummary.unknown
      ) {
        return (
          <ClusterPolicyViolationIcons2
            compliant={clusterViolationSummary.compliant}
            compliantHref={`${NavigationPath.policyDetailsResults
              .replace(':namespace', item.policy.metadata?.namespace ?? '')
              .replace(':name', item.policy.metadata?.name ?? '')}?sort=-1`}
            noncompliant={clusterViolationSummary.noncompliant}
            violationHref={`${NavigationPath.policyDetailsResults
              .replace(':namespace', item.policy.metadata?.namespace ?? '')
              .replace(':name', item.policy.metadata?.name ?? '')}?sort=1`}
            pending={clusterViolationSummary.pending}
            pendingHref={`${NavigationPath.policyDetailsResults
              .replace(':namespace', item.policy.metadata?.namespace ?? '')
              .replace(':name', item.policy.metadata?.name ?? '')}?sort=1`}
            unknown={clusterViolationSummary.unknown}
          />
        )
      } else {
        return '-'
      }
    },
    sort: (lhs, rhs) => {
      const lhsViolations = policyClusterViolationSummaryMap[lhs.policy.metadata.uid ?? '']
      const rhsViolations = policyClusterViolationSummaryMap[rhs.policy.metadata.uid ?? '']
      if (lhsViolations === rhsViolations) return 0
      if (!lhsViolations) return -1
      if (!rhsViolations) return 1
      if (lhsViolations.noncompliant > rhsViolations.noncompliant) return -1
      if (lhsViolations.noncompliant < rhsViolations.noncompliant) return 1
      if (lhsViolations.compliant > rhsViolations.compliant) return -1
      if (lhsViolations.compliant < rhsViolations.compliant) return 1
      return 0
    },
  }
}

export function AddToPolicySetModal(props: { policyTableItems: PolicyTableItem[]; onClose: () => void }) {
  const { t } = useTranslation()
  const { policySetsState } = useSharedAtoms()
  const [policySets] = useRecoilState(policySetsState)
  const namespace = useMemo(() => namespaceCheck(props.policyTableItems), [props.policyTableItems])
  const namespacedPolicySets = useMemo(
    () => policySets.filter((ps) => ps.metadata.namespace === namespace),
    [namespace, policySets]
  )
  const [isAdding, setIsAdding] = useState(false)
  const [selectedPolicySet, setSelectedPolicySet] = useState<PolicySet>()
  const [selectedPolicySetUid, setSelectedPolicySetUid] = useState<string>()

  useEffect(() => {
    setSelectedPolicySet(namespacedPolicySets.find((ps) => ps.metadata.uid === selectedPolicySetUid))
  }, [selectedPolicySetUid, namespacedPolicySets])

  const [error, setError] = useState('')
  const onConfirm = async () => {
    setIsAdding(true)
    try {
      setError('')
      if (selectedPolicySet) {
        const policySet = JSON.parse(JSON.stringify(selectedPolicySet))
        const policies = policySet.spec.policies
        for (const policyTableItem of props.policyTableItems) {
          const policy = policyTableItem.policy
          const policyName = policy.metadata.name ?? ''
          if (!policies.includes(policyName)) {
            policies.push(policyName)
          }
        }
        policies.sort()
        await replaceResource(policySet).promise
      }
      props.onClose()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(t('Unknown error occurred'))
      }
      setIsAdding(false)
    }
  }
  function namespaceCheck(policyTableItems: PolicyTableItem[]) {
    let ns = ''
    for (const policyTableItem of policyTableItems) {
      if (!ns) {
        ns = policyTableItem.policy.metadata.namespace ?? ''
      } else if (ns !== policyTableItem.policy.metadata.namespace) {
        return ''
      }
    }
    return ns
  }

  const addPolicyToSetColumns = useMemo<IAcmTableColumn<PolicyTableItem>[]>(
    () => [
      {
        header: t('Name'),
        cell: (policyTableItem: PolicyTableItem) => policyTableItem.policy.metadata.name,
        sort: 'policy.metadata.name',
        search: 'policy.metadata.name',
      },
      {
        header: t('Namespace'),
        cell: (policyTableItem: PolicyTableItem) => policyTableItem.policy.metadata.namespace,
        sort: 'policy.metadata.namespace',
        search: 'policy.metadata.namespace',
      },
    ],
    [t]
  )

  return (
    <Modal
      title={t('Add to policy set')}
      description={t('Choose the policy set where you want to add specific policies.')}
      isOpen
      onClose={props.onClose}
      actions={[
        <Button
          key="confirm"
          variant="primary"
          onClick={onConfirm}
          isAriaDisabled={!namespace || namespacedPolicySets.length === 0}
        >
          {isAdding ? t('adding') : t('add')}
        </Button>,
        <Button key="cancel" variant="link" onClick={props.onClose}>
          {t('Cancel')}
        </Button>,
      ]}
      variant={ModalVariant.small}
    >
      <Stack hasGutter>
        {!namespace || namespacedPolicySets.length === 0 ? (
          <StackItem>
            {!namespace ? (
              <AcmAlert
                variant="danger"
                title={t('Policy namespaces do not match')}
                message={t('To add policies to a policy set, the namespaces must match.')}
                isInline
              />
            ) : (
              <AcmAlert
                variant="danger"
                title={t('No policy set in given namespace')}
                message={t(
                  'To add a policy to a policy set, they both must be in the same namespace.  There are no policy sets in "{{0}}" namespace.',
                  [namespace]
                )}
                isInline
              />
            )}
          </StackItem>
        ) : (
          <StackItem>
            <AcmSelect
              id="policy-sets"
              label=""
              onChange={(key) => setSelectedPolicySetUid(key)}
              value={selectedPolicySetUid}
              placeholder={t('Select a policy set')}
            >
              {namespacedPolicySets.map((ps) => (
                <SelectOption key={ps.metadata.uid} value={ps.metadata.uid}>
                  {ps.metadata.name}
                </SelectOption>
              ))}
            </AcmSelect>
          </StackItem>
        )}
        <StackItem>
          <AcmTable<PolicyTableItem>
            columns={addPolicyToSetColumns}
            items={props.policyTableItems}
            emptyState={undefined} // only shown when policyTableItems is not empty
            keyFn={(item: PolicyTableItem) => item.policy.metadata.uid as string}
          />
        </StackItem>
        {error && (
          <StackItem>
            <Alert variant="danger" title={error} isInline />
          </StackItem>
        )}
      </Stack>
    </Modal>
  )
}

export function DeletePolicyModal(props: { item: PolicyTableItem; onClose: () => void }) {
  const { t } = useTranslation()
  const { placementBindingsState, placementRulesState, placementsState } = useSharedAtoms()
  const [deletePlacements, setDeletePlacements] = useState(true)
  const [deletePlacementBindings, setDeletePlacementBindings] = useState(true)
  const [placements] = useRecoilState(placementsState)
  const [placementRules] = useRecoilState(placementRulesState)
  const [placementBindings] = useRecoilState(placementBindingsState)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const policyBindings = getPlacementBindingsForResource(props.item.policy, placementBindings)
  const policyPlacements = getPlacementsForResource(props.item.policy, policyBindings, placements)
  const policyPlacementRules = getPlacementsForResource(props.item.policy, policyBindings, placementRules)

  const onConfirm = useCallback(async () => {
    setIsDeleting(true)
    try {
      setError('')
      await deletePolicy(
        props.item.policy,
        policyPlacements,
        policyPlacementRules,
        policyBindings,
        deletePlacements,
        deletePlacementBindings
      ).promise
      props.onClose()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(t('Unknown error occurred'))
      }
      setIsDeleting(false)
    }
  }, [props, policyPlacements, policyPlacementRules, policyBindings, deletePlacements, deletePlacementBindings, t])

  const reusedBindings = policyBindings.filter((binding) =>
    binding.subjects?.find(
      (subject) => !(subject.kind === props.item.policy.kind && subject.name === props.item.policy.metadata.name)
    )
  )

  // Find all the instances where the Policy's Placements/PlacementRules are in a PlacementBinding that doesn't bind
  // the Policy itself. This logic excludes those Placements/PlacementRules covered by reusedBindings.
  const reusedPlacements = [...policyPlacements, ...policyPlacementRules].filter((placement) =>
    placementBindings.find(
      (binding) =>
        binding.metadata.namespace === props.item.policy.metadata.namespace &&
        binding.placementRef.kind === placement.kind &&
        binding.placementRef.name === placement.metadata.name &&
        !policyBindings.find((policyBinding) => policyBinding.metadata.name === binding.metadata.name)
    )
  )

  return (
    <Modal
      title={t('policy.modal.title.delete')}
      titleIconVariant={'warning'}
      isOpen
      onClose={props.onClose}
      actions={[
        <Button key="confirm" variant="danger" onClick={onConfirm} isLoading={isDeleting}>
          {isDeleting ? t('deleting') : t('delete')}
        </Button>,
        <Button key="cancel" variant="link" onClick={props.onClose}>
          {t('Cancel')}
        </Button>,
      ]}
      variant={ModalVariant.small}
    >
      <Stack hasGutter>
        <StackItem>{t('policy.modal.message.confirm', { name: props.item.policy.metadata.name })}</StackItem>
        <StackItem>
          <Checkbox
            id="delete-placement-bindings"
            isChecked={deletePlacementBindings}
            onChange={setDeletePlacementBindings}
            label={t('policy.modal.delete.associatedResources.placementBinding')}
          />
        </StackItem>
        {reusedBindings.length > 0 ? (
          <StackItem>
            <AcmAlert
              variant="warning"
              title={t('policy.modal.message.reused', { kind: 'PlacementBindings' })}
              message={reusedBindings.map((binding) => binding.metadata.name).join(', ')}
              noClose={true}
              isInline
            />
          </StackItem>
        ) : null}
        <StackItem>
          <Checkbox
            id="delete-placements"
            isChecked={deletePlacements}
            onChange={setDeletePlacements}
            label={t('policy.modal.delete.associatedResources.placement')}
          />
        </StackItem>
        {reusedPlacements.length > 0 ? (
          <StackItem>
            <AcmAlert
              variant="warning"
              title={t('policy.modal.message.reused', { kind: 'Placements/PlacementRules' })}
              message={reusedPlacements.map((placement) => placement.metadata.name).join(', ')}
              noClose={true}
              isInline
            />
          </StackItem>
        ) : null}
        {props.item.source !== 'Local' ? (
          <StackItem>
            <AcmAlert
              variant="warning"
              title={t('Some selected resources are managed externally')}
              message={t('Any changes made here may be overridden by the content of an upstream repository.')}
              isInline
            />
          </StackItem>
        ) : null}
        {policyHasDeletePruneBehavior(props.item.policy) ? (
          <StackItem>
            <AcmAlert
              variant="warning"
              title={t('Some policies have the Prune parameter set.')}
              message={t('Deleting this policy might delete some related objects on the managed cluster(s).')}
              isInline
            />
          </StackItem>
        ) : null}
        {error && (
          <StackItem>
            <Alert variant="danger" title={error} isInline />
          </StackItem>
        )}
      </Stack>
    </Modal>
  )
}

function policyHasDeletePruneBehavior(policy: Policy) {
  if (policy.spec.disabled || policy.spec.remediationAction?.endsWith('nform')) {
    return false
  }
  return policy.spec['policy-templates']?.some((tmpl) => {
    if (
      tmpl.objectDefinition.kind !== 'ConfigurationPolicy' ||
      !tmpl.objectDefinition.spec.pruneObjectBehavior?.startsWith('Delete')
    ) {
      return false
    }
    return (
      policy.spec.remediationAction?.endsWith('nforce') ||
      tmpl.objectDefinition.spec.remediationAction?.endsWith('nforce')
    )
  })
}
