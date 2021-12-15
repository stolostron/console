/* Copyright Contributors to the Open Cluster Management project */

import { get, uniqBy } from 'lodash'
import { getArgoApplicationElements } from './topologyArgo'
import { getSubscriptionApplicationElements } from './applicationSubscriptionElements'

function getApplicationElements(application, clusterModel, cluster) {
    let name
    let namespace
    ;({ name, namespace } = application)
    if (get(application, 'app.apiVersion').indexOf('argoproj.io') > -1) {
        return getArgoApplicationElements(application, name, namespace, nodes, links, cluster)
    }
    return getSubscriptionApplicationElements(application, name, namespace, nodes, links, cluster)
}
