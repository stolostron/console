// Copyright (c) 2020 Red Hat, Inc. All Rights Reserved.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { ExclamationTriangleIcon } from '@patternfly/react-icons'
import _ from 'lodash'
import apolloClient from '../../../../lib/client/apollo-client'
import { SEARCH_QUERY_RELATED } from '../../../apollo-client/queries/SearchQueries'
import { RESOURCE_TYPES } from '../../../../lib/shared/constants'
import resources from '../../../../lib/shared/resources'
import msgs from '../../../../nls/platform.properties'
import { withLocale } from '../../../providers/LocaleProvider'

resources(() => {
    require('./style.scss')
})

const CHILD_RESOURCE_TYPES = ['Application', 'Subscription', 'PlacementRule', 'Channel']

const getSelfLinks = (control) => {
    const channel = _.get(control, 'groupControlData', []).find((d) => d.id === 'channel')
    const selfLinks = _.get(channel, 'content', []).find((c) => c.id === 'selfLinks')
    return _.get(selfLinks, 'active', {})
}

const getResourceKind = (resourceType) => {
    let kind
    switch (resourceType.name) {
        case 'HCMSubscription':
            kind = 'Subscription'
            break
        case 'HCMPlacementRule':
            kind = 'PlacementRule'
            break
    }
    return kind
}

const getResourceNameAndNamespace = (resourceType, selfLinks) => {
    let selfLinksKey, selfLinkPlural
    switch (resourceType.name) {
        case 'HCMSubscription':
            selfLinksKey = 'Subscription'
            selfLinkPlural = 'subscriptions'
            break
        case 'HCMApplication':
            selfLinksKey = 'Application'
            selfLinkPlural = 'applications'
            break
        case 'HCMPlacementRule':
            selfLinksKey = 'PlacementRule'
            selfLinkPlural = 'placementrules'
            break
    }
    const selfLink = _.get(selfLinks, selfLinksKey, '')
    const selfLinkExp = new RegExp(`namespaces/([^/]*)/${selfLinkPlural}/([^/]*)`)
    const matches = selfLink.match(selfLinkExp)
    return matches ? matches.slice(1, 3) : [null, null]
}

const getQuery = (resourceType, name, namespace) => {
    const kind = getResourceKind(resourceType).toLowerCase()
    return {
        filters: [
            { property: 'cluster', values: ['local-cluster'] },
            { property: 'kind', values: [kind] },
            { property: 'name', values: [name] },
            { property: 'namespace', values: [namespace] },
        ],
        // For subscriptions, check for any affected application resources
        relatedKinds: kind === 'subscription' ? CHILD_RESOURCE_TYPES.map((t) => t.toLowerCase()) : ['application'],
    }
}

const getWarningSpan = (key) => {
    return `<span class="warning-font">${msgs.get(key)} </span>`
}

const getCodeSpan = (text) => {
    return `<span class="code-font">${text}</span>`
}

const SharedResourceWarning = ({ resourceType, control, locale }) => {
    const [siblingApplications, setSiblingApplications] = useState([])
    const [childResources, setChildResources] = useState([])
    const [deployingSubscription, setDeployingSubscription] = useState()
    const selfLinks = getSelfLinks(control)
    const [applicationNamespace, applicationName] = getResourceNameAndNamespace(
        RESOURCE_TYPES.HCM_APPLICATIONS,
        selfLinks
    )
    const [prNamespace, prName] = getResourceNameAndNamespace(RESOURCE_TYPES.HCM_PLACEMENT_RULES, selfLinks)
    const [resourceNamespace, resourceName] = getResourceNameAndNamespace(resourceType, selfLinks)

    useEffect(() => {
        if (control.editMode && resourceName && resourceNamespace) {
            const query = getQuery(resourceType, resourceName, resourceNamespace)
            apolloClient
                .search(SEARCH_QUERY_RELATED, {
                    input: [query],
                })
                .then((response) => {
                    const hostingSubscription = _.get(response, 'data.searchResult[0].items[0]._hostingSubscription')
                    if (hostingSubscription) {
                        setDeployingSubscription(hostingSubscription.split('/')[1])
                    } else {
                        const relatedItems = _.get(response, 'data.searchResult[0].related') || []
                        const relatedApps = _.get(
                            relatedItems.find((r) => r.kind === 'application'),
                            'items',
                            []
                        )

                        if (relatedApps.length) {
                            setSiblingApplications(
                                relatedApps
                                    .filter(
                                        (r) =>
                                            !r._hostingSubscription && // Filter out applications deployed by a subscription
                                            (r.name !== applicationName || r.namespace !== applicationNamespace)
                                    )
                                    .map((r) => r.name)
                                    .sort()
                            )
                        }

                        if (resourceType === RESOURCE_TYPES.HCM_SUBSCRIPTIONS) {
                            const localSuffix = '-local'
                            const children = []
                            CHILD_RESOURCE_TYPES.forEach((type) => {
                                const related = _.get(
                                    relatedItems.find((r) => r.kind === type.toLowerCase()),
                                    'items',
                                    []
                                )
                                const childItems = related
                                    .filter(
                                        (i) =>
                                            (i._hostingSubscription === `${resourceNamespace}/${resourceName}` ||
                                                i._hostingSubscription ===
                                                    `${resourceNamespace}/${resourceName}${localSuffix}`) &&
                                            // Only include resources on the local cluster
                                            i.cluster === 'local-cluster' &&
                                            // Do not include the -local subscription
                                            (type !== 'Subscription' ||
                                                i.namespace !== resourceNamespace ||
                                                i.name !== `${resourceName}${localSuffix}`)
                                    )
                                    .map((i) => i.name)
                                    .sort()
                                    .map((n) => `${n} [${type}]`)
                                children.push(...childItems)
                            })
                            if (children.length) {
                                setChildResources(children)
                            }
                        }
                    }
                })
        }
    }, [control.editMode, applicationName, applicationNamespace, prName, prNamespace, resourceName, resourceNamespace])

    return deployingSubscription || siblingApplications.length || childResources.length ? (
        <div className="shared-resource-warning">
            <div>
                <ExclamationTriangleIcon />
            </div>
            <div>
                {!!deployingSubscription && (
                    <React.Fragment>
                        <p
                            dangerouslySetInnerHTML={{
                                __html: `
              ${getWarningSpan('editing.app.warning')}
              ${msgs.get(
                  'editing.app.deployedResourceWarning',
                  [getCodeSpan(getResourceKind(resourceType)), getCodeSpan(deployingSubscription)],
                  locale
              )}
              `,
                            }}
                        />
                    </React.Fragment>
                )}
                {!!siblingApplications.length && (
                    <React.Fragment>
                        <p
                            dangerouslySetInnerHTML={{
                                __html: `
              ${getWarningSpan('editing.app.caution')}
              ${msgs.get('editing.app.sharedResourceWarning', [getCodeSpan(getResourceKind(resourceType))], locale)}
              `,
                            }}
                        />
                        <p>{siblingApplications.join(', ')}</p>
                    </React.Fragment>
                )}
                {!!childResources.length && (
                    <React.Fragment>
                        <p
                            dangerouslySetInnerHTML={{
                                __html: `
              ${getWarningSpan('editing.app.caution')}
              ${msgs.get('editing.app.childResourceWarning', locale)}
              `,
                            }}
                        />
                        <p>{childResources.join(', ')}</p>
                    </React.Fragment>
                )}
            </div>
        </div>
    ) : null
}

SharedResourceWarning.propTypes = {
    control: PropTypes.object,
    locale: PropTypes.string,
    resourceType: PropTypes.object,
}

export default withLocale(SharedResourceWarning)
