/* Copyright Contributors to the Open Cluster Management project */

import { keyBy } from 'lodash'
import { getNumericValidator } from '../../../../../../components/TemplateEditor'

const lessThanEqualSize = (active, _controlData, templateObjectMap, i18n) => {
    const runningCount = active
    const size = templateObjectMap['<<main>>'].ClusterPool[0].$raw.spec.size
    if (runningCount > size) {
        return i18n('clusterPool.creation.validation.runningCount.lessThanOrEqualSize')
    }
}

export const fixupControlsForClusterPool = (controlData, t) => {
    const map = keyBy(controlData, 'id')
    map['detailStep'].title = t('Cluster pool details')
    map['name'].name = t('clusterPool.creation.ocp.name')
    map['name'].tooltip = t('clusterPool.tooltip.creation.ocp.name')
    map['name'].reverse = 'ClusterPool[0].metadata.name'
    map['region'].reverse = 'ClusterPool[0].metadata.labels.region'

    let inx = controlData.findIndex(({ id }) => id === 'additional')
    controlData.splice(inx, 1)

    // Only allow 1 worker pool, and warn if default size is not used
    delete map['workerPools'].prompts.addPrompt
    inx = map['workerPools'].controlData.findIndex(({ id }) => id === 'computeNodeCount')
    map['workerPools'].controlData.splice(inx, 1, {
        name: t('creation.ocp.compute.node.count'),
        tooltip: t('tooltip.creation.ocp.compute.node.count'),
        id: 'computeNodeCount',
        type: 'number',
        initial: '3',
        validation: getNumericValidator(t),
        cacheUserValueKey: 'create.cluster.compute.node.count',
        info: (control, controlData, t) => {
            return control.active !== '3'
                ? t(
                      'The cluster pool will not generate machine pools if the count is not equal to 3. Node scaling will be unavailable.'
                  )
                : undefined
        },
    })

    inx = controlData.findIndex(({ id }) => id === 'name')
    controlData.splice(
        inx + 1,
        0,
        {
            name: t('clusterPool.creation.ocp.namespace'),
            tooltip: t('clusterPool.tooltip.creation.ocp.namespace'),
            id: 'namespace',
            type: 'combobox',
            placeholder: t('clusterPool.placeholder.creation.ocp.namespace'),
            validation: {
                required: true,
            },
            available: [],
        },
        {
            name: t('clusterPool.creation.ocp.size'),
            tooltip: t('clusterPool.tooltip.creation.ocp.size'),
            id: 'size',
            type: 'number',
            initial: '1',
            validation: {
                required: true,
            },
            // cacheUserValueKey: 'create.cluster.compute.node.count',
        },
        {
            name: t('clusterPool.creation.ocp.runningCount'),
            tooltip: t('clusterPool.tooltip.creation.ocp.runningCount'),
            id: 'runningCount',
            type: 'number',
            initial: '0',
            validation: {
                required: true,
                contextTester: lessThanEqualSize,
            },
        },
        {
            id: 'showSecrets',
            type: 'hidden',
            active: false,
        }
    )

    return controlData
}
