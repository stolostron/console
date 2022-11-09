/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { useEffect, useState } from 'react'
import { Link, Route, Switch, useLocation } from 'react-router-dom'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { IResource } from '../../../../resources'
import { fireManagedClusterView } from '../../../../resources/managedclusterview'
import { getResource } from '../../../../resources/utils/resource-request'
import { AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../../ui-components'
import DetailsOverviewPage from './DetailsOverviewPage'
import LogsPage from './LogsPage'
import YAMLPage from './YAMLPage'

function getResourceData() {
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
    const { t } = useTranslation()
    const [resource, setResource] = useState<any>(undefined)
    const [containers, setContainers] = useState<string[]>()
    const [resourceError, setResourceError] = useState('')
    const { cluster, kind, apiversion, namespace, name } = getResourceData()
    let resourceUrlParams = ''
    resourceUrlParams = `${resourceUrlParams}${cluster !== '' ? `cluster=${cluster}` : ''}`
    resourceUrlParams = `${resourceUrlParams}${kind !== '' ? `&kind=${kind}` : ''}`
    resourceUrlParams = `${resourceUrlParams}${apiversion !== '' ? `&apiversion=${apiversion}` : ''}`
    resourceUrlParams = `${resourceUrlParams}${namespace !== '' ? `&namespace=${namespace}` : ''}`
    resourceUrlParams = `${resourceUrlParams}${name !== '' ? `&name=${name}` : ''}`

    useEffect(() => {
        if (cluster === 'local-cluster') {
            getResource<IResource>({
                apiVersion: apiversion,
                kind,
                metadata: { namespace, name },
            })
                .promise.then((response) => {
                    // NOTE: removing managedfields from editor
                    delete response.metadata?.managedFields
                    setResource(response)
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
                        // NOTE: removing managedfields from editor
                        delete viewResponse?.result.metadata?.managedFields
                        setResource(viewResponse?.result)
                    }
                })
                .catch((err) => {
                    console.error('Error getting resource: ', err)
                    setResourceError(err)
                })
        }
    }, [cluster, kind, apiversion, name, namespace])

    useEffect(() => {
        setContainers((resource && resource.spec?.containers?.map((container: any) => container.name)) ?? [])
    }, [resource])

    const location: {
        pathname: string
        state: {
            search: string
            fromSearch: string
        }
    } = useLocation()

    let breadcrumbLink = ''
    const prevLocState = window.history?.state?.state
    if (prevLocState && prevLocState.from === NavigationPath.search) {
        breadcrumbLink = NavigationPath.search
        // If we came to resources page from search - return to search with previous search filters
        const previousSearchState = location.state.fromSearch
        if (previousSearchState) {
            breadcrumbLink = `${NavigationPath.search}/${previousSearchState}`
        }
    } else {
        breadcrumbLink = NavigationPath.search
    }

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
                    ]}
                    navigation={
                        <AcmSecondaryNav>
                            <AcmSecondaryNavItem isActive={location.pathname === NavigationPath.resources}>
                                <Link
                                    replace
                                    to={`${NavigationPath.resources}?${encodeURIComponent(resourceUrlParams)}`}
                                >
                                    Details
                                </Link>
                            </AcmSecondaryNavItem>
                            <AcmSecondaryNavItem isActive={location.pathname === NavigationPath.resourceYAML}>
                                <Link
                                    replace
                                    to={`${NavigationPath.resourceYAML}?${encodeURIComponent(resourceUrlParams)}`}
                                >
                                    YAML
                                </Link>
                            </AcmSecondaryNavItem>
                            {(kind.toLowerCase() === 'pod' || kind.toLowerCase() === 'pods') && (
                                <AcmSecondaryNavItem isActive={location.pathname === NavigationPath.resourceLogs}>
                                    <Link
                                        replace
                                        to={`${NavigationPath.resourceLogs}?${encodeURIComponent(resourceUrlParams)}`}
                                    >
                                        Logs
                                    </Link>
                                </AcmSecondaryNavItem>
                            )}
                        </AcmSecondaryNav>
                    }
                />
            }
        >
            <Switch>
                <Route exact path={NavigationPath.resources}>
                    <DetailsOverviewPage
                        cluster={cluster}
                        loading={!resource && resourceError !== ''}
                        error={resourceError}
                        resource={resource}
                    />
                </Route>
                <Route exact path={NavigationPath.resourceYAML}>
                    <YAMLPage
                        resource={resource}
                        loading={!resource && resourceError !== ''}
                        error={resourceError}
                        name={name}
                        namespace={namespace}
                        cluster={cluster}
                        kind={kind}
                        apiversion={apiversion}
                    />
                </Route>
                {(kind.toLowerCase() === 'pod' || kind.toLowerCase() === 'pods') && containers && (
                    <Route path={NavigationPath.resourceLogs}>
                        <LogsPage
                            resource={resource}
                            resourceError={resourceError}
                            containers={containers}
                            cluster={cluster}
                            namespace={namespace}
                            name={name}
                        />
                    </Route>
                )}
            </Switch>
        </AcmPage>
    )
}
