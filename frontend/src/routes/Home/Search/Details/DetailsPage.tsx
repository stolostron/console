/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { makeStyles } from '@material-ui/styles'
import { AcmButton, AcmPage, AcmPageHeader, AcmSecondaryNav, AcmSecondaryNavItem } from '../../../../ui-components'
import { useEffect, useState } from 'react'
import { Link, Route, Switch, useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { fireManagedClusterView } from '../../../../resources/managedclusterview'
import { getResource } from '../../../../resources/utils/resource-request'
import LogsPage from './LogsPage'
import YAMLPage from './YAMLPage'

const useStyles = makeStyles({
    customBreadcrumb: {
        padding: '8px 0 0 8px',
        marginBottom: '-20px',
        backgroundColor: 'var(--pf-global--palette--white)',
    },
})

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
    const classes = useStyles()

    useEffect(() => {
        if (cluster === 'local-cluster') {
            const resourceResult = getResource({
                apiVersion: apiversion,
                kind,
                metadata: { namespace, name },
            }).promise
            resourceResult
                .then((response) => {
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

    const location = useLocation()
    const history = useHistory()

    return (
        <AcmPage
            header={
                <div>
                    <div className={classes.customBreadcrumb}>
                        <AcmButton
                            variant={'link'}
                            onClick={() => {
                                const prevLocState = window.history?.state?.state
                                if (prevLocState && prevLocState.from === NavigationPath.search) {
                                    // If we came to resources page from search - return to search with previous search filters
                                    history.goBack()
                                } else {
                                    // If we were redirected to search from elsewhere (ex: application page) - go to blank search page
                                    window.location.href = NavigationPath.search
                                }
                            }}
                        >
                            {t('Search')}
                        </AcmButton>
                    </div>
                    <AcmPageHeader
                        title={name}
                        navigation={
                            <AcmSecondaryNav>
                                <AcmSecondaryNavItem isActive={location.pathname === NavigationPath.resources}>
                                    <Link
                                        replace
                                        to={`${NavigationPath.resources}?${encodeURIComponent(resourceUrlParams)}`}
                                    >
                                        YAML
                                    </Link>
                                </AcmSecondaryNavItem>
                                {(kind.toLowerCase() === 'pod' || kind.toLowerCase() === 'pods') && (
                                    <AcmSecondaryNavItem isActive={location.pathname === NavigationPath.resourceLogs}>
                                        <Link
                                            replace
                                            to={`${NavigationPath.resourceLogs}?${encodeURIComponent(
                                                resourceUrlParams
                                            )}`}
                                        >
                                            Logs
                                        </Link>
                                    </AcmSecondaryNavItem>
                                )}
                            </AcmSecondaryNav>
                        }
                    />
                </div>
            }
        >
            <Switch>
                <Route exact path={NavigationPath.resources}>
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
