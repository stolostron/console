/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { AcmAlert, AcmLoadingPage, AcmLogWindow } from '@stolostron/ui-components'
import { PageSection } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { fetchRetry, getBackendUrl } from '../../../../resources'

export default function LogsPage(props: {
    resourceError: string
    containers: string[]
    cluster: string
    namespace: string
    name: string
}) {
    const { resourceError, containers, cluster, namespace, name } = props
    const { t } = useTranslation()
    const [logs, setLogs] = useState<string>('')
    const [logsError, setLogsError] = useState<string>()
    const [container, setContainer] = useState<string>(sessionStorage.getItem(`${name}-${cluster}-container`) || '')

    useEffect(() => {
        if (containers.length > 0 && sessionStorage.getItem(`${name}-${cluster}-container`) === null) {
            sessionStorage.setItem(`${name}-${cluster}-container`, containers[0])
            setContainer(containers[0])
        }
    }, [containers, cluster, name])

    useEffect(() => {
        if (cluster !== 'local-cluster' && container !== '') {
            const abortController = new AbortController()
            const logsResult = fetchRetry({
                method: 'GET',
                url:
                    getBackendUrl() +
                    `/apis/proxy.open-cluster-management.io/v1beta1/namespaces/${cluster}/clusterstatuses/${cluster}/log/${namespace}/${name}/${container}?tailLines=1000`,
                signal: abortController.signal,
                retries: process.env.NODE_ENV === 'production' ? 2 : 0,
                headers: { Accept: '*/*' },
            })
            logsResult
                .then((result) => {
                    setLogs(result.data as string)
                })
                .catch((err) => {
                    setLogsError(err.message)
                })
        } else if (cluster === 'local-cluster' && container !== '') {
            const abortController = new AbortController()
            const logsResult = fetchRetry({
                method: 'GET',
                url:
                    getBackendUrl() +
                    `/api/v1/namespaces/${namespace}/pods/${name}/log?container=${container}&tailLines=1000`,
                signal: abortController.signal,
                retries: process.env.NODE_ENV === 'production' ? 2 : 0,
                headers: { Accept: '*/*' },
            })
            logsResult
                .then((result) => {
                    setLogs(result.data as string)
                })
                .catch((err) => {
                    setLogsError(err.message)
                })
        }
    }, [cluster, container])

    if (resourceError !== '') {
        return (
            <PageSection>
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={`${t('Error querying resource logs:')} ${name}`}
                    subtitle={resourceError}
                />
            </PageSection>
        )
    } else if (resourceError === '' && !logsError && logs === '') {
        return (
            <PageSection>
                <AcmLoadingPage />
            </PageSection>
        )
    }
    if (logsError) {
        return (
            <PageSection>
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={`${t('Error querying resource logs:')} ${name}`}
                    subtitle={logsError}
                />
            </PageSection>
        )
    }

    return (
        <PageSection>
            <AcmLogWindow
                id={'pod-logs-viewer'}
                cluster={cluster}
                namespace={namespace}
                initialContainer={container}
                onSwitchContainer={(newContainer: string | undefined) => {
                    setContainer(newContainer || container)
                    sessionStorage.setItem(`${name}-${cluster}-container`, newContainer || container)
                }}
                containers={containers}
                logs={logs || ''}
            />
        </PageSection>
    )
}
