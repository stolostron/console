// Copyright (c) 2020 Red Hat, Inc. All Rights Reserved.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { ExclamationTriangleIcon } from '@patternfly/react-icons'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { searchClient } from '../../../../Search/search-sdk/search-client'
import { SearchResultItemsAndRelatedItemsDocument } from '../../../../Search/search-sdk/search-sdk'
import './style.css'

export const RESOURCE_TYPES = {
  HCM_APPLICATIONS: { name: 'HCMApplication', list: 'HCMApplicationList' },
  HCM_CHANNELS: { name: 'HCMChannel', list: 'HCMChannelList' },
  HCM_SUBSCRIPTIONS: { name: 'HCMSubscription', list: 'HCMSubscriptionList' },
  HCM_PLACEMENT_RULES: {
    name: 'HCMPlacementRule',
    list: 'HCMPlacementRuleList',
  },
}

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
  return `<span class="warning-font">${key} </span>`
}

const getCodeSpan = (text) => {
  return `<span class="code-font">${text}</span>`
}

const SharedResourceWarning = ({ resourceType, control }) => {
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
  const { t } = useTranslation()
  useEffect(() => {
    if (control.editMode && resourceName && resourceNamespace) {
      const query = getQuery(resourceType, resourceName, resourceNamespace)
      searchClient
        .query({
          query: SearchResultItemsAndRelatedItemsDocument,
          variables: {
            input: [{ ...query }],
            limit: 1000,
          },
          fetchPolicy: 'cache-first',
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
                        i._hostingSubscription === `${resourceNamespace}/${resourceName}${localSuffix}`) &&
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
  }, [
    control.editMode,
    applicationName,
    applicationNamespace,
    prName,
    prNamespace,
    resourceName,
    resourceNamespace,
    resourceType,
  ])

  return deployingSubscription || siblingApplications.length || childResources.length ? (
    <div className="shared-resource-warning">
      <div>
        <ExclamationTriangleIcon />
      </div>
      <div>
        {!!deployingSubscription && (
          <Fragment>
            <p
              dangerouslySetInnerHTML={{
                __html: `
              ${getWarningSpan(t('Warning:'))}
              ${t(
                'This application uses a {{0}} resource that is deployed by the subscription {{1}}. Changes to these settings might be reverted when resources are reconciled with the resource repository.',
                [getCodeSpan(getResourceKind(resourceType)), getCodeSpan(deployingSubscription)]
              )}
              `,
              }}
            />
          </Fragment>
        )}
        {!!siblingApplications.length && (
          <Fragment>
            <p
              dangerouslySetInnerHTML={{
                __html: `
              ${getWarningSpan(t('Caution:'))}
              ${t(
                'This application uses a shared {{0}} resource. Changes to these settings will also affect the following applications:',
                [getCodeSpan(getResourceKind(resourceType))]
              )}
              `,
              }}
            />
            <p>{siblingApplications.join(', ')}</p>
          </Fragment>
        )}
        {!!childResources.length && (
          <Fragment>
            <p
              dangerouslySetInnerHTML={{
                __html: `
              ${getWarningSpan(t('Caution:'))}
              ${t(
                'Changes to these settings might also affect other applications or subscriptions. This subscription deploys the following resources:'
              )}
              `,
              }}
            />
            <p>{childResources.join(', ')}</p>
          </Fragment>
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

export default SharedResourceWarning
