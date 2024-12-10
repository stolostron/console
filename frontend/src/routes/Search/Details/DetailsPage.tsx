/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.

import { Divider } from '@patternfly/react-core'
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core/deprecated'
import { Dispatch, SetStateAction, useContext, useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom-v5-compat'
import { Pages, usePageVisitMetricHandler } from '../../../hooks/console-metrics'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { IResource } from '../../../resources'
import { fireManagedClusterView } from '../../../resources/managedclusterview'
import { getResource } from '../../../resources/utils/resource-request'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem, AcmToastContext } from '../../../ui-components'
import { DeleteResourceModal } from '../components/Modals/DeleteResourceModal'
import { handleVMActions } from '../SearchResults/utils'

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
  const toast = useContext(AcmToastContext)
  const { settingsState } = useSharedAtoms()
  const vmActionsEnabled = useRecoilValue(settingsState)?.VIRTUAL_MACHINE_ACTIONS === 'enabled'
  const [resource, setResource] = useState<any>(undefined)
  const [containers, setContainers] = useState<string[]>()
  const [resourceVersion, setResourceVersion] = useState<string>('')
  const [resourceError, setResourceError] = useState('')
  const [resourceActionsOpen, setResourceActionsOpen] = useState(false)
  const [isDeleteResourceModalOpen, setIsDeleteResourceModalOpen] = useState(false)
  const { cluster, kind, apiversion, namespace, name, isHubClusterResource } = getResourceParams()

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
    if (vmActionsEnabled && kind.toLowerCase() === 'virtualmachine') {
      actions.unshift(
        ...[
          {
            action: 'Start',
            hubPath: `/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachines/${name}/start`,
            managedPath: '/virtualmachines/start',
          },
          {
            action: 'Stop',
            hubPath: `/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachines/${name}/stop`,
            managedPath: '/virtualmachines/stop',
          },
          {
            action: 'Restart',
            hubPath: `/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachines/${name}/restart`,
            managedPath: '/virtualmachines/restart',
          },
          {
            action: 'Pause',
            hubPath: `/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachineinstances/${name}/pause`,
            managedPath: '/virtualmachineinstances/pause',
          },
          {
            action: 'Unpause',
            hubPath: `/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachineinstances/${name}/unpause`,
            managedPath: '/virtualmachineinstances/unpause',
          },
        ].map((action) => (
          <DropdownItem
            key={`${action.action}-vm-resource`}
            component="button"
            onClick={() =>
              handleVMActions(
                action.action.toLowerCase(),
                isHubClusterResource ? action.hubPath : action.managedPath,
                { cluster, name, namespace },
                () => setResourceVersion(''), // trigger resource refetchto update details page data.
                toast,
                t
              )
            }
          >
            {t(`{{action}} {{resourceKind}}`, { action: action.action, resourceKind: kind })}
          </DropdownItem>
        )),
        <Divider key={'action-divider'} />
      )
    }
    return actions
  }, [cluster, kind, name, namespace, isHubClusterResource, vmActionsEnabled, navigate, toast, t])

  return (
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
                <Link to={`${NavigationPath.resourceRelated}${window.location.search}`}>{t('Related resources')}</Link>
              </AcmSecondaryNavItem>
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
      <Outlet context={searchDetailsContext} />
    </AcmPage>
  )
}

export function useSearchDetailsContext() {
  return useOutletContext<SearchDetailsContext>()
}
