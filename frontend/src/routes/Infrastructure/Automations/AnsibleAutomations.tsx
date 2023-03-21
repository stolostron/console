/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@mui/styles'
import { ButtonVariant, PageSection, TextContent } from '@patternfly/react-core'
import { fitContent } from '@patternfly/react-table'
import {
  AcmAlertContext,
  AcmButton,
  AcmEmptyState,
  AcmPage,
  AcmPageContent,
  AcmPageHeader,
  AcmTable,
} from '../../../ui-components'
import { Fragment, useContext, useEffect, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useRecoilState, useRecoilValue, useSharedAtoms, useSharedSelectors } from '../../../shared-recoil'
import { BulkActionModal, BulkActionModalProps } from '../../../components/BulkActionModal'
import { DropdownActionModal, IDropdownActionModalProps } from '../../../components/DropdownActionModal'
import { RbacDropdown } from '../../../components/Rbac'
import { Trans, useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS, viewDocumentation } from '../../../lib/doc-util'
import { checkPermission, rbacCreate, rbacDelete, rbacPatch } from '../../../lib/rbac-util'
import { createBackCancelLocation, NavigationPath } from '../../../NavigationPath'
import {
  ClusterCurator,
  ClusterCuratorDefinition,
  deleteResource,
  getTemplateJobsNum,
  LinkAnsibleCredential,
} from '../../../resources'
import { AutomationProviderHint } from '../../../components/AutomationProviderHint'

export default function AnsibleAutomationsPage() {
  const alertContext = useContext(AcmAlertContext)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => alertContext.clearAlerts, [])

  const { t } = useTranslation()

  const useStyles = makeStyles({
    hint: {
      marginBottom: '16px',
    },
  })
  const classes = useStyles()

  return (
    <AcmPage hasDrawer header={<AcmPageHeader title={t('template.title')} />}>
      <AcmPageContent id="clusters">
        <PageSection>
          <AutomationProviderHint component="hint" className={classes.hint} />
          <AnsibleJobTemplateTable />
        </PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

function AnsibleJobTemplateTable() {
  // Load Data
  const { ansibleCredentialsValue, clusterCuratorTemplatesValue } = useSharedSelectors()
  const templatedCurators = useRecoilValue(clusterCuratorTemplatesValue)
  const ansibleCredentials = useRecoilValue(ansibleCredentialsValue)

  const [bulkModalProps, setBulkModalProps] = useState<BulkActionModalProps<ClusterCurator> | { open: false }>({
    open: false,
  })

  const [dropdownModalProps, setDropdownModalProps] = useState<
    IDropdownActionModalProps<ClusterCurator> | { open: false }
  >({
    open: false,
  })
  const { t } = useTranslation()
  const unauthorizedMessage = t('rbac.unauthorized')
  const { namespacesState } = useSharedAtoms()
  const [namespaces] = useRecoilState(namespacesState)
  const [canCreateAutomationTemplate, setCanCreateAutomationTemplate] = useState<boolean>(false)
  useEffect(() => {
    checkPermission(rbacCreate(ClusterCuratorDefinition), setCanCreateAutomationTemplate, namespaces)
  }, [namespaces])
  const history = useHistory()

  // Set table
  return (
    <Fragment>
      <BulkActionModal<ClusterCurator> {...bulkModalProps} />
      <DropdownActionModal<ClusterCurator> {...dropdownModalProps} />
      <AcmTable<ClusterCurator>
        items={templatedCurators}
        columns={[
          {
            header: t('table.name'),
            sort: 'metadata.name',
            search: 'metadata.name',
            cell: (curator) => (
              <span style={{ whiteSpace: 'nowrap' }}>
                <Link
                  to={NavigationPath.editAnsibleAutomation
                    .replace(':namespace', curator.metadata.namespace!)
                    .replace(':name', curator.metadata.name!)}
                >
                  {curator.metadata.name!}
                </Link>
              </span>
            ),
          },
          {
            header: t('table.linkedCred'),
            cell: (clusterCurator) => {
              if (clusterCurator.spec?.install?.towerAuthSecret === undefined) {
                //Connect to Modal
                return (
                  <AcmButton
                    isInline
                    variant="link"
                    isSmall
                    tooltip={<Trans i18nKey="template.modal.noCredentials" components={{ bold: <strong /> }} />}
                    isDisabled={ansibleCredentials.length === 0}
                    onClick={() => {
                      setDropdownModalProps({
                        open: true,
                        title: t('template.modal.linkProvider.title'),
                        action: t('template.modal.linkProvider.submit'),
                        processing: t('template.modal.linkProvider.submitting'),
                        resource: clusterCurator,
                        description: t('template.modal.linkProvider.message'),
                        actionFn: LinkAnsibleCredential,
                        close: () => setDropdownModalProps({ open: false }),
                        isDanger: false,
                        selectOptions: ansibleCredentials.map((credential) => credential.metadata.name as string),
                        selectLabel: t('template.modal.linkProvider.label'),
                        selectPlaceholder: t('template.modal.linkProvider.placeholder'),
                        confirmText: 'Link',
                      })
                    }}
                  >
                    {t('template.link')}
                  </AcmButton>
                )
              } else return clusterCurator.spec.install.towerAuthSecret
            },
          },
          {
            header: t('table.jobTemplate'),
            cell: (clusterCurator) => {
              return getTemplateJobsNum(clusterCurator)
            },
          },
          {
            header: '',
            cellTransforms: [fitContent],
            cell: (curator: ClusterCurator) => {
              const actions = [
                {
                  id: 'edit-template',
                  text: t('template.edit'),
                  isAriaDisabled: true,
                  rbac: [rbacPatch(curator)],
                  click: (curator: ClusterCurator) => {
                    history.push(
                      NavigationPath.editAnsibleAutomation
                        .replace(':namespace', curator.metadata.namespace!)
                        .replace(':name', curator.metadata.name!)
                    )
                  },
                },
                {
                  id: 'delete',
                  text: t('template.delete'),
                  isAriaDisabled: true,
                  rbac: [rbacDelete(curator)],
                  click: (curator: ClusterCurator) => {
                    setBulkModalProps({
                      open: true,
                      title: t('template.modal.delete.title'),
                      action: t('delete'),
                      processing: t('deleting'),
                      items: [curator],
                      emptyState: undefined, // there is always 1 item supplied
                      description: curator.spec?.install?.towerAuthSecret ? (
                        <div>
                          <Trans
                            i18nKey="template.modal.delete.message.linked"
                            values={{
                              curatorTemplate: curator.metadata.name as string,
                              ansibleCredential: curator.spec.install.towerAuthSecret as string,
                            }}
                            components={{ bold: <strong /> }}
                          />
                        </div>
                      ) : (
                        t('template.modal.delete.message.noLink')
                      ),
                      columns: [
                        {
                          header: t('table.name'),
                          cell: 'metadata.name',
                          sort: 'metadata.name',
                        },
                        {
                          header: t('table.namespace'),
                          cell: 'metadata.namespace',
                          sort: 'metadata.namespace',
                        },
                      ],
                      keyFn: (curator: ClusterCurator) => curator.metadata.uid as string,
                      actionFn: deleteResource,
                      close: () => setBulkModalProps({ open: false }),
                      isDanger: true,
                      icon: 'warning',
                    })
                  },
                },
              ]

              return (
                <RbacDropdown<ClusterCurator>
                  id={`${curator.metadata.name}-actions`}
                  item={curator}
                  isKebab={true}
                  text={`${curator.metadata.name}-actions`}
                  actions={actions}
                />
              )
            },
          },
        ]}
        keyFn={(clusterCurator: ClusterCurator) => {
          return clusterCurator.metadata.uid as string
        }}
        tableActionButtons={[
          {
            isDisabled: !canCreateAutomationTemplate,
            tooltip: !canCreateAutomationTemplate ? unauthorizedMessage : '',
            id: 'add',
            title: t('template.create'),
            click: () => {
              history.push(NavigationPath.addAnsibleAutomation)
            },
            variant: ButtonVariant.primary,
          },
        ]}
        tableActions={[
          {
            id: 'deleteTemplate',
            title: t('bulk.delete.templates'),
            click: (curators: ClusterCurator[]) => {
              setBulkModalProps({
                open: true,
                title: t('bulk.delete.templates'),
                action: t('delete'),
                processing: t('deleting'),
                items: [...curators],
                emptyState: undefined, // table action is only enabled when items are selected
                description: t('bulk.delete.templates.message'),
                columns: [
                  {
                    header: t('table.name'),
                    cell: 'metadata.name',
                    sort: 'metadata.name',
                  },
                  {
                    header: t('table.namespace'),
                    cell: 'metadata.namespace',
                    sort: 'metadata.namespace',
                  },
                ],
                keyFn: (curator: ClusterCurator) => curator.metadata.uid as string,
                actionFn: deleteResource,
                close: () => setBulkModalProps({ open: false }),
                isDanger: true,
                icon: 'warning',
              })
            },
            variant: 'bulk-action',
          },
        ]}
        emptyState={
          <AcmEmptyState
            title={t('template.emptyStateHeader')}
            message={<Trans i18nKey="template.emptyStateMsg" components={{ bold: <strong /> }} />}
            action={
              <div>
                <AcmButton
                  isDisabled={!canCreateAutomationTemplate}
                  tooltip={!canCreateAutomationTemplate ? unauthorizedMessage : ''}
                  component={Link}
                  to={createBackCancelLocation(NavigationPath.addAnsibleAutomation)}
                >
                  {t('template.create')}
                </AcmButton>
                <TextContent>{viewDocumentation(DOC_LINKS.ANSIBLE_JOBS, t)}</TextContent>
              </div>
            }
          />
        }
      ></AcmTable>
    </Fragment>
  )
}
