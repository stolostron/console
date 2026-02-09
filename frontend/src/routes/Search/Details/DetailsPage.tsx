/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.

import { Divider, Dropdown, DropdownItem, MenuToggle, MenuToggleElement, Tooltip } from '@patternfly/react-core'
import { Dispatch, Fragment, SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom-v5-compat'
import { Pages, usePageVisitMetricHandler } from '../../../hooks/console-metrics'
import { useTranslation } from '../../../lib/acm-i18next'
import { PluginContext } from '../../../lib/PluginContext'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, IResourceDefinition } from '../../../resources'
import { fleetResourceRequest } from '../../../resources/utils/fleet-resource-request'
import { getBackendUrl, getRequest, getResource } from '../../../resources/utils/resource-request'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmPage, AcmPageHeader, AcmSecondaryNav } from '../../../ui-components'
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
  const { useVirtualMachineActionsEnabled, isFineGrainedRbacEnabledState } = useSharedAtoms()
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)
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
    if (isFineGrainedRbacEnabled && (kind === 'VirtualMachine' || kind === 'VirtualMachineSnapshot')) {
      const url = getBackendUrl() + `/${kind.toLowerCase()}s/get/${cluster}/${name}/${namespace}` // need the plural kind either virtualmachines || virtualmachinesnapshots
      getRequest<IResource>(url)
        .promise.then((response) => {
          setResource(response)
          setResourceVersion(response?.metadata?.resourceVersion ?? '')
        })
        .catch((err) => {
          console.error('Error getting VM resource: ', err)
          setResourceError(err.message)
        })
    } else if (resourceVersion !== resource?.metadata.resourceVersion || name !== resource?.metadata.name) {
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
        fleetResourceRequest('GET', cluster, {
          apiVersion: apiversion,
          kind,
          name,
          namespace,
        })
          .then((res) => {
            if ('errorMessage' in res) {
              setResourceError(res.errorMessage)
            } else {
              setResource(res)
              setResourceVersion(res?.metadata?.resourceVersion ?? '')
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
    isFineGrainedRbacEnabled,
    isHubClusterResource,
    resourceVersion,
    resource?.metadata.resourceVersion,
    resource?.metadata.name,
  ])

  // Clear resource state when navigating to a different resource
  useEffect(() => {
    setResource(undefined)
    setResourceError('')
    setResourceVersion('')
  }, [cluster, kind, name, namespace, apiversion])

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

  const navItems = useMemo(() => {
    const items = [
      {
        key: 'search-resource-details',
        title: t('Details'),
        isActive: location.pathname === NavigationPath.resources,
        to: `${NavigationPath.resources}${window.location.search}`,
      },
      {
        key: 'search-resource-yaml',
        title: t('YAML'),
        isActive: location.pathname === NavigationPath.resourceYAML,
        to: `${NavigationPath.resourceYAML}${window.location.search}`,
      },
      {
        key: 'search-resource-related-resources',
        title: t('Related resources'),
        isActive: location.pathname === NavigationPath.resourceRelated,
        to: `${NavigationPath.resourceRelated}${window.location.search}`,
      },
    ]

    if (kind.toLowerCase() === 'virtualmachine') {
      items.push({
        key: 'search-resource-vm-snapshots',
        title: t('Snapshots'),
        isActive: location.pathname === NavigationPath.vmSnapshots,
        to: `${NavigationPath.vmSnapshots}${window.location.search}`,
      })
    }

    if (kind.toLowerCase() === 'pod' || kind.toLowerCase() === 'pods') {
      items.push({
        key: 'search-resource-logs',
        title: t('Logs'),
        isActive: location.pathname === NavigationPath.resourceLogs,
        to: `${NavigationPath.resourceLogs}${window.location.search}`,
      })
    }

    return items
  }, [kind, location.pathname, t])

  const closeModal = () => {
    setVMAction(ClosedVMActionModalProps)
  }

  const createVMDropdownItems = useCallback(
    (
      actions: {
        displayText: string
        action: string
        method: 'PUT' | 'GET' | 'POST' | 'PATCH' | 'DELETE'
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
                sourceName: kind === 'VirtualMachineSnapshot' ? resource?.spec?.source?.name : undefined, // only set for snapshot restore action
              },
            })
          }
          isDisabled={action.isDisabled}
        >
          {action.displayText}
        </DropdownItem>
      ))
    },
    [apiversion, cluster, isHubClusterResource, kind, name, namespace, resource]
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
          if (kind.startsWith('VirtualMachine') && isFineGrainedRbacEnabled) {
            setVMAction({
              open: true,
              close: closeModal,
              action: 'Delete',
              method: 'DELETE',
              item: {
                cluster,
                kind,
                apiversion,
                name,
                namespace,
                _hubClusterResource: isHubClusterResource ? 'true' : undefined,
                sourceName: kind === 'VirtualMachineSnapshot' ? resource?.spec?.source?.name : undefined, // only set for snapshot restore action
              },
            })
          } else {
            setIsDeleteResourceModalOpen(true)
          }
        }}
      >
        {t('Delete {{resourceKind}}', { resourceKind: kind })}
      </DropdownItem>,
    ]
    if (vmActionsEnabled && kind.toLowerCase() === 'virtualmachinesnapshot') {
      const snapshotPhaseSucceeded = resource?.status?.phase === 'Succeeded'
      actions.unshift(
        ...createVMDropdownItems([
          {
            displayText: t('Restore VirtualMachine from snapshot'),
            action: 'Restore',
            method: 'POST',
            isDisabled: !snapshotPhaseSucceeded,
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
                isDisabled: ['Provisioning', 'Stopped', 'Stopping', 'Terminating', 'Unknown'].includes(printableStatus),
              },
          {
            displayText: t('Restart VirtualMachine'),
            action: 'Restart',
            method: 'PUT',
            isDisabled: ['Migrating', 'Provisioning', 'Stopped', 'Stopping', 'Terminating', 'Unknown'].includes(
              printableStatus
            ),
          },
          printableStatus === 'Paused'
            ? {
                displayText: t('Unpause VirtualMachine'),
                action: 'Unpause',
                method: 'PUT',
                isDisabled: printableStatus !== 'Paused',
              }
            : {
                displayText: t('Pause VirtualMachine'),
                action: 'Pause',
                method: 'PUT',
                isDisabled: printableStatus !== 'Running',
              },
          {
            displayText: t('Take snapshot'),
            action: 'Snapshot',
            method: 'POST',
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
          const dropdownItem = (
            <DropdownItem
              id={actionExtension.id}
              key={actionExtension.id}
              component="button"
              onClick={async () =>
                setPluginModal(<ModalComp isOpen={true} close={close} resource={resource} cluster={cluster} />)
              }
              isDisabled={actionExtension?.isDisabled?.(resource) || false}
              isAriaDisabled={actionExtension.isAriaDisabled}
            >
              {actionExtension.title}
            </DropdownItem>
          )
          actions.push(
            actionExtension.tooltip ? (
              <Tooltip
                key={actionExtension.id}
                content={actionExtension.tooltip}
                {...(actionExtension.tooltipProps || {})}
              >
                <div>{dropdownItem}</div>
              </Tooltip>
            ) : (
              dropdownItem
            )
          )
        }
      })
    }
    return actions
  }, [
    acmExtensions,
    apiversion,
    cluster,
    createVMDropdownItems,
    isFineGrainedRbacEnabled,
    isHubClusterResource,
    kind,
    name,
    namespace,
    navigate,
    resource,
    t,
    vmActionsEnabled,
  ])

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
            navigation={<AcmSecondaryNav navItems={navItems} />}
            actions={
              <Dropdown
                isOpen={resourceActionsOpen}
                onSelect={() => setResourceActionsOpen(false)}
                onOpenChange={setResourceActionsOpen}
                popperProps={{ position: 'right' }}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setResourceActionsOpen(!resourceActionsOpen)}
                    isExpanded={resourceActionsOpen}
                  >
                    {t('Actions')}
                  </MenuToggle>
                )}
              >
                {getResourceActions}
              </Dropdown>
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
