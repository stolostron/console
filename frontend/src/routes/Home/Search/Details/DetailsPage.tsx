/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.

import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core'
import { useEffect, useMemo, useState } from 'react'
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom-v5-compat'
import { Pages, usePageVisitMetricHandler } from '../../../../hooks/console-metrics'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { IResource } from '../../../../resources'
import { fireManagedClusterView } from '../../../../resources/managedclusterview'
import { getResource } from '../../../../resources/utils/resource-request'
import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../../ui-components'
import { DeleteResourceModal } from './DeleteResourceModal'
import DetailsOverviewPage from './DetailsOverviewPage'
import LogsPage from './LogsPage'
import RelatedResourceDetailsTab from './RelatedResourceDetailsTab'
import YAMLPage from './YAMLPage'

export function getResourceParams() {
  let cluster = '',
    kind = '',
    apiversion = '',
    namespace = '',
    name = ''
  const urlParams = decodeURIComponent(window.location.search).replace('?', '').split('&')
  urlParams.forEach((param) => {
    const paramKey = param.split('=')[0]
    const paramValue = param.split('=')[1]
    switch (paramKey) {
      case 'cluster':
        cluster = paramValue
        break
      case 'kind':
        kind = paramValue
        break
      case 'apiversion':
        apiversion = paramValue
        break
      case 'namespace':
        namespace = paramValue
        break
      case 'name':
        name = paramValue
        break
    }
  })
  return { cluster, kind, apiversion, namespace, name }
}

export default function DetailsPage() {
  usePageVisitMetricHandler(Pages.searchDetails)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [resource, setResource] = useState<any>(undefined)
  const [containers, setContainers] = useState<string[]>()
  const [resourceVersion, setResourceVersion] = useState<string>('')
  const [resourceError, setResourceError] = useState('')
  const [resourceActionsOpen, setResourceActionsOpen] = useState(false)
  const [isDeleteResourceModalOpen, setIsDeleteResourceModalOpen] = useState(false)
  const { cluster, kind, apiversion, namespace, name } = getResourceParams()

  useEffect(() => {
    if (resourceVersion !== resource?.metadata.resourceVersion || name !== resource?.metadata.name) {
      /* istanbul ignore else */
      if (cluster === 'local-cluster') {
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
    resourceVersion,
    resource?.metadata.resourceVersion,
    resource?.metadata.name,
  ])

  useEffect(() => {
    setContainers((resource && resource.spec?.containers?.map((container: any) => container.name)) ?? [])
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
              dropdownItems={[
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
              ]}
              onSelect={() => setResourceActionsOpen(false)}
            />
          }
        />
      }
    >
      <DeleteResourceModal
        open={isDeleteResourceModalOpen}
        close={() => setIsDeleteResourceModalOpen(false)}
        resource={resource}
        cluster={cluster}
      />
      <Routes>
        <Route
          path="/yaml"
          element={
            <YAMLPage
              resource={resource}
              loading={!resource && resourceError === ''}
              error={resourceError}
              name={name}
              namespace={namespace}
              cluster={cluster}
              kind={kind}
              apiversion={apiversion}
              setResourceVersion={setResourceVersion}
            />
          }
        />
        <Route
          path="/related"
          element={
            <RelatedResourceDetailsTab
              cluster={cluster}
              resource={resource}
              resourceLoading={!resource && resourceError === ''}
            />
          }
        />

        {(kind.toLowerCase() === 'pod' || kind.toLowerCase() === 'pods') && containers && (
          <Route
            path="/logs"
            element={
              <LogsPage
                resource={resource}
                resourceError={resourceError}
                containers={containers}
                cluster={cluster}
                namespace={namespace}
                name={name}
              />
            }
          />
        )}
        <Route
          path="/"
          element={
            <DetailsOverviewPage
              cluster={cluster}
              loading={!resource && resourceError === ''}
              error={resourceError}
              resource={resource}
              name={name}
            />
          }
        />
      </Routes>
    </AcmPage>
  )
}
