/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.

import { Divider } from '@patternfly/react-core'
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core/deprecated'
import { Dispatch, Fragment, SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom-v5-compat'
import { Pages, usePageVisitMetricHandler } from '../../../hooks/console-metrics'
import { useTranslation } from '../../../lib/acm-i18next'
import { PluginContext } from '../../../lib/PluginContext'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, IResourceDefinition } from '../../../resources'
import { fireManagedClusterView } from '../../../resources/managedclusterview'
import { getResource } from '../../../resources/utils/resource-request'
import { useSharedAtoms } from '../../../shared-recoil'
import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../ui-components'
import {
  ClosedVMActionModalProps,
  IVMActionModalProps,
  VMActionModal,
} from '../../Infrastructure/VirtualMachines/modals/VMActionModal'
import { isResourceTypeOf } from '../../Infrastructure/VirtualMachines/utils'
import { DeleteResourceModal } from '../components/Modals/DeleteResourceModal'

export type SearchDetailsContext = {
  cluster: string
  name: string
  namespace: string
  apiversion: string
  kind: string
  resource: any
  isHubClusterResource: boolean
  resourceLoading: boolean
  resourceError: string
  containers: string[]
  setResourceVersion: Dispatch<SetStateAction<string>>
}

export function getResourceParams() {
  const params = new URLSearchParams(decodeURIComponent(window.location.search))
  return {
    cluster: params.get('cluster') ?? '',
    kind: params.get('kind') ?? '',
    apiversion: params.get('apiversion') ?? '',
    namespace: params.get('namespace') ?? '',
    name: params.get('name') ?? '',
    isHubClusterResource: params.get('_hubClusterResource') === 'true', // _hubClusterResource should only be set if true
  }
}

export default function DetailsPage() {
  usePageVisitMetricHandler(Pages.searchDetails)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { useVirtualMachineActionsEnabled } = useSharedAtoms()
  const vmActionsEnabled = useVirtualMachineActionsEnabled()
  const [resource, setResource] = useState<any>(undefined)
  const [containers, setContainers] = useState<string[]>()
  const [resourceVersion, setResourceVersion] = useState<string>('')
  const [resourceError, setResourceError] = useState('')
  const [resourceActionsOpen, setResourceActionsOpen] = useState(false)
  const [isDeleteResourceModalOpen, setIsDeleteResourceModalOpen] = useState(false)
  const [VMAction, setVMAction] = useState<IVMActionModalProps>(ClosedVMActionModalProps)
  const { cluster, kind, apiversion, namespace, name, isHubClusterResource } = getResourceParams()
  const { acmExtensions } = useContext(PluginContext)
  const [pluginModal, setPluginModal] = useState<JSX.Element>()

  useEffect(() => {
    if (resourceVersion !== resource?.metadata.resourceVersion || name !== resource?.metadata.name) {
      /* istanbul ignore else */
      if (isHubClusterResource) {
        getResource<IResource>({
          apiVersion: apiversion,
          kind,
          metadata: { namespace, name },
        })
          .promise.then((response) => {
            setResource(response)
            setResourceVersion(response?.metadata?.resourceVersion ?? '')
          })
          .catch((err) => {
            console.error('Error getting resource: ', err)
            setResourceError(err.message)
          })
      } else {
        fireManagedClusterView(cluster, kind, apiversion, name, namespace)
          .then((viewResponse) => {
            if (viewResponse?.message) {
              setResourceError(viewResponse.message)
            } else {
              setResource(viewResponse?.result)
              setResourceVersion(viewResponse?.result?.metadata.resourceVersion ?? '')
            }
          })
          .catch((err) => {
            console.error('Error getting resource: ', err)
            setResourceError(err)
          })
      }
    }
  }, [
    cluster,
    kind,
    apiversion,
    name,
    namespace,
    isHubClusterResource,
    resourceVersion,
    resource?.metadata.resourceVersion,
    resource?.metadata.name,
  ])

  useEffect(() => {
    setContainers(resource?.spec?.containers?.map((container: any) => container.name) ?? [])
  }, [resource])

  const location: {
    pathname: string
    state: {
      from: string
      search: string
      fromSearch: string
    }
  } = useLocation()

  const breadcrumbLink: string = useMemo(() => {
    const prevLocState = location.state
    if (prevLocState && prevLocState.from === NavigationPath.search) {
      // If we came to resources page from search - return to search with previous search filters
      const previousSearchState = location.state.fromSearch ?? /* istanbul ignore next */ ''
      return `${NavigationPath.search}${previousSearchState}`
    } else {
      /* istanbul ignore next */
      return NavigationPath.search
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const searchDetailsContext = useMemo<SearchDetailsContext>(
    () => ({
      cluster,
      name,
      namespace,
      apiversion,
      kind,
      resource,
      isHubClusterResource,
      resourceLoading: !resource && resourceError === '',
      resourceError,
      containers: containers || [],
      setResourceVersion,
    }),
    [apiversion, cluster, containers, kind, name, namespace, resource, resourceError, isHubClusterResource]
  )

  const closeModal = () => {
    setVMAction(ClosedVMActionModalProps)
  }

  const createVMDropdownItems = useCallback(
    (
      actions: {
        displayText: string
        action: string
        method: 'PUT' | 'GET' | 'POST' | 'PATCH' | 'DELETE'
        hubPath: string
        managedPath: string
        isDisabled: boolean
      }[]
    ) => {
      return actions.map((action) => (
        <DropdownItem
          key={`${action.action}-vm-resource-action`}
          component="button"
          onClick={() =>
            setVMAction({
              open: true,
              close: closeModal,
              action: action.action,
              method: action.method,
              item: {
                cluster,
                kind,
                apiversion,
                name,
                namespace,
                _hubClusterResource: isHubClusterResource ? 'true' : undefined,
              },
            })
          }
          isDisabled={action.isDisabled}
        >
          {action.displayText}
        </DropdownItem>
      ))
    },
    [apiversion, cluster, isHubClusterResource, kind, name, namespace]
  )
  const getResourceActions = useMemo(() => {
    const actions = [
      <DropdownItem
        component="button"
        key="edit-resource"
        onClick={() => {
          navigate(`${NavigationPath.resourceYAML}${window.location.search}`)
        }}
      >
        {t('Edit {{resourceKind}}', { resourceKind: kind })}
      </DropdownItem>,
      <DropdownItem
        component="button"
        key="delete-resource"
        onClick={() => {
          setIsDeleteResourceModalOpen(true)
        }}
      >
        {t('Delete {{resourceKind}}', { resourceKind: kind })}
      </DropdownItem>,
    ]
    if (vmActionsEnabled && kind.toLowerCase() === 'virtualmachinesnapshot') {
      actions.unshift(
        ...createVMDropdownItems([
          {
            displayText: t('Restore VirtualMachine from snapshot'),
            action: 'Restore',
            method: 'PUT',
            hubPath: `/apis/snapshot.kubevirt.io/v1beta1/namespaces/${namespace}/virtualmachinerestores`,
            managedPath: '/virtualmachinerestores',
            isDisabled: false,
          },
        ]),
        <Divider key={'action-divider'} />
      )
    }
    if (vmActionsEnabled && kind.toLowerCase() === 'virtualmachine') {
      const printableStatus = resource?.status?.printableStatus ?? ''
      actions.unshift(
        ...createVMDropdownItems([
          printableStatus === 'Stopped'
            ? {
                displayText: t('Start VirtualMachine'),
                action: 'Start',
                method: 'PUT',
                hubPath: `/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachines/${name}/start`,
                managedPath: '/virtualmachines/start',
                isDisabled: [
                  'Migrating',
                  'Provisioning',
                  'Running',
                  'Starting',
                  'Stopping',
                  'Terminating',
                  'Unknown',
                ].includes(printableStatus),
              }
            : {
                displayText: t('Stop VirtualMachine'),
                action: 'Stop',
                method: 'PUT',
                hubPath: `/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachines/${name}/stop`,
                managedPath: '/virtualmachines/stop',
                isDisabled: ['Provisioning', 'Stopped', 'Stopping', 'Terminating', 'Unknown'].includes(printableStatus),
              },
          {
            displayText: t('Restart VirtualMachine'),
            action: 'Restart',
            method: 'PUT',
            hubPath: `/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachines/${name}/restart`,
            managedPath: '/virtualmachines/restart',
            isDisabled: ['Migrating', 'Provisioning', 'Stopped', 'Stopping', 'Terminating', 'Unknown'].includes(
              printableStatus
            ),
          },
          printableStatus === 'Paused'
            ? {
                displayText: t('Unpause VirtualMachine'),
                action: 'Unpause',
                method: 'PUT',
                hubPath: `/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachineinstances/${name}/unpause`,
                managedPath: '/virtualmachineinstances/unpause',
                isDisabled: printableStatus !== 'Paused',
              }
            : {
                displayText: t('Pause VirtualMachine'),
                action: 'Pause',
                method: 'PUT',
                hubPath: `/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachineinstances/${name}/pause`,
                managedPath: '/virtualmachineinstances/pause',
                isDisabled: printableStatus !== 'Running',
              },
          {
            displayText: t('Take snapshot'),
            action: 'Snapshot',
            method: 'POST',
            hubPath: `/apis/snapshot.kubevirt.io/v1beta1/namespaces/${namespace}/virtualmachinesnapshots`,
            managedPath: '/virtualmachinesnapshots',
            isDisabled: false,
          },
        ]),
        <Divider key={'action-divider'} />
      )
    }
    if (acmExtensions?.virtualMachineAction?.length) {
      // Virtual machine action extensions
      acmExtensions?.virtualMachineAction?.forEach((actionExtension) => {
        // Check if the resource is a virtual machine
        // apiVersion: kubevirt.io/v1, kind: VirtualMachine
        if (isResourceTypeOf(resource, actionExtension?.model as IResourceDefinition[])) {
          const ModalComp = actionExtension.component
          const close = () => setPluginModal(<></>)
          actions.push(
            <DropdownItem
              id={actionExtension.id}
              key={actionExtension.id}
              component="button"
              onClick={async () =>
                setPluginModal(<ModalComp isOpen={true} close={close} resource={resource} cluster={cluster} />)
              }
              isDisabled={actionExtension?.isDisabled?.(resource) || false}
              tooltip={actionExtension.tooltip}
              tooltipProps={actionExtension.tooltipProps}
              isAriaDisabled={actionExtension.isAriaDisabled}
            >
              {actionExtension.title}
            </DropdownItem>
          )
        }
      })
    }
    return actions
  }, [acmExtensions, cluster, createVMDropdownItems, kind, name, namespace, navigate, resource, t, vmActionsEnabled])

  return (
    <Fragment>
      {pluginModal}
      <AcmPage
        header={
          <AcmPageHeader
            title={name}
            breadcrumb={[
              {
                text: t('Search'),
                to: breadcrumbLink,
              },
              {
                text: t('{{kind}} details', { kind }),
                to: '',
              },
            ]}
            navigation={
              <AcmSecondaryNav>
                <AcmSecondaryNavItem isActive={location.pathname === NavigationPath.resources}>
                  <Link to={`${NavigationPath.resources}${window.location.search}`}>{t('Details')}</Link>
                </AcmSecondaryNavItem>
                <AcmSecondaryNavItem isActive={location.pathname === NavigationPath.resourceYAML}>
                  <Link to={`${NavigationPath.resourceYAML}${window.location.search}`}>{t('YAML')}</Link>
                </AcmSecondaryNavItem>
                <AcmSecondaryNavItem isActive={location.pathname === NavigationPath.resourceRelated}>
                  <Link to={`${NavigationPath.resourceRelated}${window.location.search}`}>
                    {t('Related resources')}
                  </Link>
                </AcmSecondaryNavItem>
                {kind.toLowerCase() === 'virtualmachine' && (
                  <AcmSecondaryNavItem isActive={location.pathname === NavigationPath.vmSnapshots}>
                    <Link to={`${NavigationPath.vmSnapshots}${window.location.search}`}>{t('Snapshots')}</Link>
                  </AcmSecondaryNavItem>
                )}
                {(kind.toLowerCase() === 'pod' || kind.toLowerCase() === 'pods') && (
                  <AcmSecondaryNavItem isActive={location.pathname === NavigationPath.resourceLogs}>
                    <Link to={`${NavigationPath.resourceLogs}${window.location.search}`}>{t('Logs')}</Link>
                  </AcmSecondaryNavItem>
                )}
              </AcmSecondaryNav>
            }
            actions={
              <Dropdown
                isOpen={resourceActionsOpen}
                position={'right'}
                toggle={
                  <DropdownToggle onToggle={() => setResourceActionsOpen(!resourceActionsOpen)}>
                    {t('Actions')}
                  </DropdownToggle>
                }
                dropdownItems={getResourceActions}
                onSelect={() => setResourceActionsOpen(false)}
              />
            }
          />
        }
      >
        {resource && (
          <DeleteResourceModal
            open={isDeleteResourceModalOpen}
            close={() => setIsDeleteResourceModalOpen(false)}
            resource={{
              apiversion: resource.apiVersion ?? '',
              cluster,
              kind,
              namespace,
              name,
              _uid: resource.metadata?.uid ?? '',
              _hubClusterResource: isHubClusterResource,
            }}
            currentQuery={''}
            relatedResource={false}
          />
        )}
        <VMActionModal
          open={VMAction.open}
          close={VMAction.close}
          action={VMAction.action}
          method={VMAction.method}
          item={VMAction.item}
        />
        <Outlet context={searchDetailsContext} />
      </AcmPage>
    </Fragment>
  )
}

export function useSearchDetailsContext() {
  return useOutletContext<SearchDetailsContext>()
}
