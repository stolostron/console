/* Copyright Contributors to the Open Cluster Management project */
/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import R from 'ramda'
import _ from 'lodash'
import {
    setResourceDeployStatus,
    setPodDeployStatus,
    setSubscriptionDeployStatus,
    setApplicationDeployStatus,
    setPlacementRuleDeployStatus,
    setClusterStatus,
    setPlacementDeployStatus,
} from '../model/computeStatuses'
import {
    getNodePropery,
    addPropertyToList,
    addDetails,
    addNodeOCPRouteLocationForCluster,
    addIngressNodeInfo,
} from '../helpers/diagram-helpers'
import { kubeNaming } from '../../../../../components/Topology/helpers/utilities'

const resName = 'resource.name'
const unknonwnApiVersion = 'unknown'

export const getNodeDetails = (node, updatedNode, activeFilters, t) => {
    const details = []
    if (node) {
        const { type, labels = [] } = node

        // for argo apps with application sets
        //showArgoApplicationSetLink(node, details, t)

        details.push({
            type: 'spacer',
        })
        if (type === 'cluster') {
            details.push({
                type: 'label',
                labelKey: t('Select a cluster to view details'),
            })
        }
        details.push({
            type: 'spacer',
        })

        switch (type) {
            case 'cluster':
                setClusterStatus(node, details, t)
                break

            case 'package':
                addDetails(details, [
                    {
                        labelKey: resName,
                        value: _.get(node, 'specs.raw.metadata.name', ''),
                    },
                    {
                        labelKey: 'resource.message',
                        value: t(
                            'There is not enough information in the subscription to retrieve deployed objects data.'
                        ),
                    },
                ])
                break

            default:
                addK8Details(node, updatedNode, details, activeFilters, t)
                break
        }

        // labels
        if (labels && labels.length) {
            details.push({
                type: 'label',
                labelKey: t('Labels'),
            })
            labels.forEach(({ name: lname, value: lvalue }) => {
                const labelDetails = [{ value: `${lname} = ${lvalue}`, indent: true }]
                addDetails(details, labelDetails)
            })
        }
    }
    return details
}

function addK8Details(node, updatedNode, details, activeFilters, t) {
    const { clusterName, type, layout = {}, specs } = node
    const { isDesign } = specs
    let labels
    const { type: ltype } = layout

    // not all resources have a namespace

    let namespace = ''
    if (node && R.pathOr('', ['specs', 'pulse'])(node) !== 'orange') {
        const kindModel = _.get(node, `specs.${type}Model`, {})
        let computedNSList = []
        _.flatten(Object.values(kindModel)).forEach((item) => {
            computedNSList = R.union(computedNSList, [item.namespace])
        })

        computedNSList.forEach((item) => {
            namespace = namespace.length === 0 ? item : `${namespace},${item}`
        })
    }

    const nodeAnnotations = _.get(node, 'specs.raw.metadata.annotations', {})
    const gitBranchAnnotation = nodeAnnotations['apps.open-cluster-management.io/git-branch']
        ? 'apps.open-cluster-management.io/git-branch'
        : 'apps.open-cluster-management.io/github-branch'
    const gitPathAnnotation = nodeAnnotations['apps.open-cluster-management.io/git-path']
        ? 'apps.open-cluster-management.io/git-path'
        : 'apps.open-cluster-management.io/github-path'
    const gitTagAnnotation = 'apps.open-cluster-management.io/git-tag'
    const gitCommitAnnotation = 'apps.open-cluster-management.io/git-desired-commit'
    const reconcileRateAnnotation = 'apps.open-cluster-management.io/reconcile-rate'

    const searchData = _.get(node, `specs.${type}Model`, {})
    let apiVersion = _.get(node, 'specs.raw.apiVersion', '')
    if (apiVersion === unknonwnApiVersion) {
        if (Object.keys(searchData).length > 0) {
            const firstSearchData = searchData[Object.keys(searchData)[0]][0]
            apiVersion = firstSearchData.apigroup
                ? `${firstSearchData.apigroup}/${firstSearchData.apiversion}`
                : firstSearchData.apiversion
        }
    }

    // the main stuff
    const mainDetails = [
        {
            labelKey: t('Type'),
            value: kubeNaming(ltype, t) || kubeNaming(type, t),
        },
        {
            labelKey: t('API Version'),
            value: apiVersion ? apiVersion : undefined,
        },
        {
            labelKey: t('Cluster'),
            value: clusterName ? clusterName : undefined,
        },
        {
            labelKey: t('Namespace'),
            value: namespace ? namespace : R.pathOr('N/A', ['specs', 'raw', 'metadata', 'namespace'])(node),
        },
    ]

    //for charts
    addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'chartName'], t('Chart Name')))

    addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'releaseName'], t('Release Name')))
    addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'version'], t('Version')))

    //
    if (!isDesign && isDesign !== undefined) {
        const resourceModel = _.get(specs, `${type}Model`)
        if (resourceModel) {
            // get first item in the object as all should have the same labels
            const resourceLabels =
                Object.keys(resourceModel).length > 0
                    ? resourceModel[Object.keys(resourceModel)[0]][0].label
                    : undefined
            labels = resourceLabels ? resourceLabels.replace('; ', ',') : t('No labels')
        } else {
            labels = 'No labels'
        }

        addPropertyToList(mainDetails, {
            labelKey: t('Labels'),
            value: labels,
        })
    } else {
        addPropertyToList(
            mainDetails,
            getNodePropery(node, ['specs', 'raw', 'metadata', 'labels'], t('Labels'), t('No labels'))
        )
    }

    addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'replicas'], t('Required Replicas')))

    addPropertyToList(
        mainDetails,
        getNodePropery(node, ['specs', 'raw', 'spec', 'selector', 'matchLabels'], t('Pod Selector'))
    )

    if (!R.pathOr(['specs', 'raw', 'spec', 'selector', 'matchLabels'])) {
        addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'selector'], t('Pod Selector')))
    }

    addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'ports'], t('Ports')))

    //subscription specific
    addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'channel'], t('Channel')))

    //subscription operator specific
    addPropertyToList(
        mainDetails,
        getNodePropery(node, ['specs', 'raw', 'spec', 'installPlanApproval'], t('Install plan approved'))
    )

    addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'source'], t('Source')))

    //argo cd app status
    addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'status', 'health', 'status'], t('Status')))

    addPropertyToList(
        mainDetails,
        getNodePropery(node, ['specs', 'raw', 'spec', 'sourceNamespace'], t('Source Namespace'))
    )

    addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'startingCSV'], t('Starting CSV')))
    ////

    addPropertyToList(
        mainDetails,
        getNodePropery(node, ['specs', 'raw', 'spec', 'packageFilter', 'filterRef'], t('Package Filter'))
    )

    addPropertyToList(
        mainDetails,
        getNodePropery(node, ['specs', 'raw', 'spec', 'placement', 'placementRef'], t('Placement Ref'))
    )

    addPropertyToList(
        mainDetails,
        getNodePropery(node, ['specs', 'raw', 'metadata', 'annotations', gitBranchAnnotation], 'Git branch')
    )

    addPropertyToList(
        mainDetails,
        getNodePropery(node, ['specs', 'raw', 'metadata', 'annotations', gitPathAnnotation], 'Git path')
    )

    if (nodeAnnotations[gitTagAnnotation]) {
        addPropertyToList(
            mainDetails,
            getNodePropery(node, ['specs', 'raw', 'metadata', 'annotations', gitTagAnnotation], 'Git tag')
        )
    }

    if (nodeAnnotations[gitCommitAnnotation]) {
        addPropertyToList(
            mainDetails,
            getNodePropery(node, ['specs', 'raw', 'metadata', 'annotations', gitCommitAnnotation], 'Git commit')
        )
    }

    if (nodeAnnotations[reconcileRateAnnotation]) {
        addPropertyToList(
            mainDetails,
            getNodePropery(node, ['specs', 'raw', 'metadata', 'annotations', reconcileRateAnnotation], 'Reconcile rate')
        )
    }

    //PR specific
    addPropertyToList(
        mainDetails,
        getNodePropery(node, ['specs', 'raw', 'spec', 'clusterSelector', 'matchLabels'], t('Cluster Selector'))
    )

    addPropertyToList(
        mainDetails,
        getNodePropery(node, ['specs', 'raw', 'spec', 'clusterConditions'], t('Cluster Conditions'))
    )
    addPropertyToList(
        mainDetails,
        getNodePropery(node, ['specs', 'raw', 'spec', 'clusterLabels', 'matchLabels'], t('Cluster Labels'))
    )

    addPropertyToList(
        mainDetails,
        getNodePropery(node, ['specs', 'raw', 'spec', 'clusterReplicas'], t('Cluster Replicas'))
    )

    if (type === 'placements') {
        const specNbOfClustersTarget = R.pathOr([], ['specs', 'raw', 'status', 'decisions'])(node)
        mainDetails.push({
            labelKey: t('Matched Clusters'),
            value: specNbOfClustersTarget.length,
        })
    }

    //placement
    if (type === 'placement') {
        mainDetails.push({
            labelKey: t('Matched Clusters'),
            value: _.get(node, 'specs.raw.status.numberOfSelectedClusters', 0),
        })
    }

    //routes
    addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'to'], t('To')))

    addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'host'], t('Host')))

    //persistent volume claim
    addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'accessModes'], t('Access Mode')))
    addDetails(details, mainDetails)

    details.push({
        type: 'spacer',
    })

    //if Route with host, show it here
    addNodeOCPRouteLocationForCluster(node, null, details, t)

    //add Ingress service info
    addIngressNodeInfo(node, details, t)

    setApplicationDeployStatus(node, details, t)

    //subscriptions status
    setSubscriptionDeployStatus(node, details, activeFilters, t)

    //placement rule details
    setPlacementRuleDeployStatus(node, details, t)

    //placement status
    setPlacementDeployStatus(node, details, t)

    //show error if the resource doesn't produce pods and was not deployed on remote clusters
    setResourceDeployStatus(node, details, activeFilters, t)

    // kube model details
    setPodDeployStatus(node, updatedNode, details, activeFilters, t)

    return details
}
