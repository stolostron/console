/* Copyright Contributors to the Open Cluster Management project */

import { keyBy } from 'lodash'

const lessThanEqualSize = (active, templateObjectMap, i18n) => {
    const runningCount = active
    const size = templateObjectMap['<<main>>'].ClusterPool[0].$raw.spec.size
    if (runningCount > size) {
        return i18n('clusterPool.creation.validation.runningCount.lessThanOrEqualSize')
    }
}

export const fixupControlsForClusterPool = (controlData) => {
    const map = keyBy(controlData, 'id')
    map['detailStep'].title = 'Cluster pool details'
    map['name'].name = 'clusterPool.creation.ocp.name'
    map['name'].tooltip = 'clusterPool.tooltip.creation.ocp.name'
    map['name'].reverse = 'ClusterPool[0].metadata.name'
    map['region'].reverse = 'ClusterPool[0].metadata.labels.region'

    let inx = controlData.findIndex(({ id }) => id === 'additional')
    controlData.splice(inx, 1)

    inx = controlData.findIndex(({ id }) => id === 'name')
    controlData.splice(
        inx + 1,
        0,
        {
            name: 'clusterPool.creation.ocp.namespace',
            tooltip: 'clusterPool.tooltip.creation.ocp.namespace',
            id: 'namespace',
            type: 'combobox',
            placeholder: 'clusterPool.placeholder.creation.ocp.namespace',
            validation: {
                required: true,
            },
            available: [],
        },
        {
            name: 'clusterPool.creation.ocp.size',
            tooltip: 'clusterPool.tooltip.creation.ocp.size',
            id: 'size',
            type: 'number',
            initial: '1',
            validation: {
                required: true,
            },
            // cacheUserValueKey: 'create.cluster.compute.node.count',
        },
        {
            name: 'clusterPool.creation.ocp.runningCount',
            tooltip: 'clusterPool.tooltip.creation.ocp.runningCount',
            id: 'runningCount',
            type: 'number',
            initial: '0',
            validation: {
                required: true,
                contextTester: lessThanEqualSize,
            },
        }
    )

    return controlData
}
