// Copyright Contributors to the Open Cluster Management project
'use strict'

import _ from 'lodash'

import { createEditLink } from '../../../../../components/Topology/helpers/diagram-helpers'
import { isYAMLEditAvailable } from './search-helper'

export const showArgoApplicationSetLink = (node, details, t) => {
    //get application set info
    const appSet = _.get(node, 'type', '' === 'application') && _.get(node, 'specs.raw.metadata.ownerReferences', [])
    if (appSet.length > 0) {
        details.push({
            type: 'spacer',
        })

        // show link to app set
        details.push({
            labelValue: t('props.show.yaml.argoset'),
            value: _.get(appSet[0], 'name', 'unknown'),
        })
        const res = {
            cluster: _.get(node, 'cluster', 'local-cluster'),
            namespace: _.get(node, 'namespace', 'unknown'),
            name: _.get(appSet[0], 'name', 'unknown'),
            apiversion: 'v1alpha1',
            kind: _.get(appSet[0], 'kind', 'unknown'),
            specs: {
                raw: {
                    apiVersion: _.get(appSet[0], 'apiVersion', 'argoproj.io/v1alpha1'),
                },
            },
        }
        if (isYAMLEditAvailable()) {
            details.push({
                type: 'link',
                value: {
                    label: t('props.show.yaml.argoset.yaml'),
                    data: {
                        action: 'show_resource_yaml',
                        cluster: res.cluster,
                        editLink: createEditLink(res),
                    },
                },
                indent: true,
            })
        }
        details.push({
            type: 'spacer',
        })
    }
    return details
}

export const getURLSearchData = () => {
    const search = window.location.search
    const searchItems = search ? new URLSearchParams(search) : undefined
    let cluster
    let apiVersion
    if (searchItems && searchItems.get('apiVersion')) {
        apiVersion = searchItems.get('apiVersion')
    }
    if (searchItems && searchItems.get('cluster')) {
        cluster = searchItems.get('cluster')
    }

    return {
        apiVersion,
        cluster,
    }
}
