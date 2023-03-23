/* Copyright Contributors to the Open Cluster Management project */

import {
  AcmAlertContext,
  AcmButton,
  AcmEmptyState,
  AcmExpandableCard,
  AcmLabels,
  AcmPageContent,
  AcmTable,
} from '../../../../ui-components'
import {
  ButtonVariant,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { fitContent } from '@patternfly/react-table'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'
import { Link } from 'react-router-dom'
import { BulkActionModal, errorIsNot, BulkActionModalProps } from '../../../../components/BulkActionModal'
import { DOC_LINKS, viewDocumentation } from '../../../../lib/doc-util'
import { canUser } from '../../../../lib/rbac-util'
import { NavigationPath } from '../../../../NavigationPath'
import {
  deleteResource,
  ManagedClusterSet,
  ManagedClusterSetDefinition,
  ResourceErrorCode,
  isGlobalClusterSet,
} from '../../../../resources'
import { ClusterSetActionDropdown } from './components/ClusterSetActionDropdown'
import { ClusterStatuses } from './components/ClusterStatuses'
import { GlobalClusterSetPopover } from './components/GlobalClusterSetPopover'
import { CreateClusterSetModal } from './CreateClusterSet/CreateClusterSetModal'
import { PluginContext } from '../../../../lib/PluginContext'
import { useSharedAtoms, useRecoilValue, useSharedRecoil } from '../../../../shared-recoil'

export default function ClusterSetsPage() {
  const { t } = useTranslation()
  const { isSubmarinerAvailable } = useContext(PluginContext)
  const alertContext = useContext(AcmAlertContext)
  const { managedClusterSetsState } = useSharedAtoms()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => alertContext.clearAlerts, [])

  const managedClusterSets = useRecoilValue(managedClusterSetsState)

  return (
    <AcmPageContent id="clusters">
      <PageSection>
        <Stack hasGutter style={{ height: 'unset' }}>
          <AcmExpandableCard title={t('learn.terminology')} id="cluster-sets-learn">
            <Flex style={{ flexWrap: 'inherit' }}>
              <Flex style={{ maxWidth: '50%' }}>
                <FlexItem>
                  <TextContent>
                    <Text component={TextVariants.h4}>{t('clusterSets')}</Text>
                    <Text component={TextVariants.p}>{t('learn.clusterSets')}</Text>
                  </TextContent>
                </FlexItem>
                <FlexItem align={{ default: 'alignRight' }}>
                  <AcmButton
                    onClick={() => window.open(DOC_LINKS.CLUSTER_SETS, '_blank')}
                    variant="link"
                    role="link"
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="right"
                  >
                    {t('view.documentation')}
                  </AcmButton>
                </FlexItem>
              </Flex>
              {isSubmarinerAvailable && (
                <Flex>
                  <FlexItem>
                    <TextContent>
                      <Text component={TextVariants.h4}>{t('submariner')}</Text>
                      <Text component={TextVariants.p}>{t('learn.submariner')}</Text>
                    </TextContent>
                  </FlexItem>
                  <FlexItem align={{ default: 'alignRight' }}>
                    <AcmButton
                      onClick={() => window.open(DOC_LINKS.SUBMARINER, '_blank')}
                      variant="link"
                      role="link"
                      icon={<ExternalLinkAltIcon />}
                      iconPosition="right"
                    >
                      {t('view.documentation')}
                    </AcmButton>
                  </FlexItem>
                </Flex>
              )}
            </Flex>
          </AcmExpandableCard>
          <Stack>
            <ClusterSetsTable managedClusterSets={managedClusterSets} />
          </Stack>
        </Stack>
      </PageSection>
    </AcmPageContent>
  )
}

export function ClusterSetsTable(props: { managedClusterSets?: ManagedClusterSet[] }) {
  const { t } = useTranslation()
  const [modalProps, setModalProps] = useState<BulkActionModalProps<ManagedClusterSet> | { open: false }>({
    open: false,
  })
  const [createClusterSetModalOpen, setCreateClusterSetModalOpen] = useState<boolean>(false)
  const [canCreateClusterSet, setCanCreateClusterSet] = useState<boolean>(false)
  useEffect(() => {
    const canCreateManagedClusterSet = canUser('create', ManagedClusterSetDefinition)
    canCreateManagedClusterSet.promise
      .then((result) => setCanCreateClusterSet(result.status?.allowed!))
      .catch((err) => console.error(err))
    return () => canCreateManagedClusterSet.abort()
  }, [])
  const { managedClusterSetBindingsState } = useSharedAtoms()
  const { waitForAll } = useSharedRecoil()
  const [managedClusterSetBindings] = useRecoilValue(waitForAll([managedClusterSetBindingsState]))

  function clusterSetSortFn(a: ManagedClusterSet, b: ManagedClusterSet): number {
    if (isGlobalClusterSet(a) && !isGlobalClusterSet(b)) {
      return -1
    } else if (!isGlobalClusterSet(a) && isGlobalClusterSet(b)) {
      return 1
    }
    return a.metadata?.name && b.metadata?.name ? a.metadata?.name.localeCompare(b.metadata?.name) : 0
  }

  const modalColumns = useMemo(
    () => [
      {
        header: t('table.name'),
        cell: (managedClusterSet: ManagedClusterSet) => (
          <span style={{ whiteSpace: 'nowrap' }}>{managedClusterSet.metadata.name}</span>
        ),
      },
      {
        header: t('table.cluster.statuses'),
        cell: (managedClusterSet: ManagedClusterSet) => <ClusterStatuses managedClusterSet={managedClusterSet} />,
      },
    ],
    [t]
  )

  function mckeyFn(managedClusterSet: ManagedClusterSet) {
    return managedClusterSet.metadata.name!
  }

  const disabledResources = props.managedClusterSets?.filter((resource) => isGlobalClusterSet(resource))

  return (
    <Fragment>
      <CreateClusterSetModal isOpen={createClusterSetModalOpen} onClose={() => setCreateClusterSetModalOpen(false)} />
      <BulkActionModal {...modalProps} />
      <AcmTable<ManagedClusterSet>
        items={props.managedClusterSets}
        disabledItems={disabledResources}
        columns={[
          {
            header: t('table.name'),
            sort: clusterSetSortFn,
            search: 'metadata.name',
            cell: (managedClusterSet: ManagedClusterSet) => (
              <>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <Link
                    to={NavigationPath.clusterSetOverview.replace(':id', managedClusterSet.metadata.name as string)}
                  >
                    {managedClusterSet.metadata.name}
                  </Link>
                </span>
                {isGlobalClusterSet(managedClusterSet) && <GlobalClusterSetPopover />}
              </>
            ),
          },
          {
            header: t('table.cluster.statuses'),
            cell: (managedClusterSet: ManagedClusterSet) => {
              return isGlobalClusterSet(managedClusterSet) ? (
                <ClusterStatuses isGlobalClusterSet={true} />
              ) : (
                <ClusterStatuses managedClusterSet={managedClusterSet} />
              )
            },
          },
          {
            header: t('table.clusterSetBinding'),
            tooltip: t('clusterSetBinding.edit.message.noBold'),
            cell: (managedClusterSet) => {
              const bindings = managedClusterSetBindings.filter(
                (mcsb) => mcsb.spec.clusterSet === managedClusterSet.metadata.name!
              )
              const namespaces = bindings.map((mcsb) => mcsb.metadata.namespace!)
              return namespaces.length ? (
                <AcmLabels labels={namespaces} collapse={namespaces.filter((_ns, i) => i > 1)} />
              ) : (
                '-'
              )
            },
          },
          {
            header: '',
            cell: (managedClusterSet) => {
              return <ClusterSetActionDropdown managedClusterSet={managedClusterSet} isKebab={true} />
            },
            cellTransforms: [fitContent],
          },
        ]}
        keyFn={mckeyFn}
        key="clusterSetsTable"
        tableActions={[
          {
            id: 'deleteClusterSets',
            title: t('bulk.delete.sets'),
            click: (managedClusterSets) => {
              setModalProps({
                open: true,
                title: t('bulk.title.deleteSet'),
                action: t('delete'),
                processing: t('deleting'),
                items: managedClusterSets,
                emptyState: undefined, // table action is only enabled when items are selected
                description: t('bulk.message.deleteSet'),
                columns: modalColumns,
                keyFn: (managedClusterSet) => managedClusterSet.metadata.name as string,
                actionFn: deleteResource,
                close: () => setModalProps({ open: false }),
                isDanger: true,
                icon: 'warning',
                confirmText: t('confirm'),
                isValidError: errorIsNot([ResourceErrorCode.NotFound]),
              })
            },
            variant: 'bulk-action',
          },
        ]}
        tableActionButtons={[
          {
            id: 'createClusterSet',
            title: t('managed.createClusterSet'),
            click: () => setCreateClusterSetModalOpen(true),
            isDisabled: !canCreateClusterSet,
            tooltip: t('rbac.unauthorized'),
            variant: ButtonVariant.primary,
          },
        ]}
        rowActions={[]}
        emptyState={
          <AcmEmptyState
            key="mcEmptyState"
            title={t('managed.clusterSets.emptyStateHeader')}
            message={<Trans i18nKey="managed.clusterSets.emptyStateMsg" components={{ bold: <strong />, p: <p /> }} />}
            action={
              <div>
                <AcmButton
                  role="link"
                  onClick={() => setCreateClusterSetModalOpen(true)}
                  isDisabled={!canCreateClusterSet}
                  tooltip={t('rbac.unauthorized')}
                >
                  {t('managed.createClusterSet')}
                </AcmButton>
                <TextContent>{viewDocumentation(DOC_LINKS.CLUSTER_SETS, t)}</TextContent>
              </div>
            }
          />
        }
      />
    </Fragment>
  )
}
