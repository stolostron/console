/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from 'react-i18next'
import { listGitOpsClusters } from '../../../../resources/gitops-cluster'
import _ from 'lodash'

export const loadExistingArgoServer = () => {
    return {
        query: () => {
            return listGitOpsClusters().promise
        },
        loadingDesc: 'creation.app.loading.rules',
        setAvailable: setAvailableArgoServer.bind(null),
    }
}

export const setAvailableArgoServer = (control, result) => {
    let availableArgoServers = []
    const { loading } = result
    const { data = {} } = result
    if (data.length) {
        _.forEach(data, (d) => {
            availableArgoServers.push(_.get(d, 'spec.argoServer.argoNamespace'))
        })
    }
    control.available = []
    control.availableMap = {}
    control.isLoading = false
    const error = availableArgoServers ? null : result.error || data.errors

    if (error) {
        control.isFailed = true
        control.isLoaded = true
        control.exception = 'argo.server.exception'
    } else if (availableArgoServers) {
        control.availableData = availableArgoServers
        control.available = control.availableData.sort()
        control.isLoaded = true
    } else {
        control.isLoading = loading
    }
    return control
}
