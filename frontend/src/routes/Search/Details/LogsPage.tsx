/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { ApolloError } from '@apollo/client'
import { AcmAlert, AcmLoadingPage, AcmLogWindow } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Query } from '../../../console-sdk/console-sdk'
import { backendUrl, fetchGet } from '../../../resources'

export default function LogsPage(props: {
    getResource: Pick<Query, 'getResource'> | undefined
    getResourceError: ApolloError | undefined
    containers: string[]
    cluster: string
    namespace: string
    name: string
}) {
    const { getResource, getResourceError, containers, cluster, namespace, name } = props
    const { t } = useTranslation(['details'])
    const [logs, setLogs] = useState<string>('')
    const [statusCode, setStatusCode] = useState<number>()
    const [container, setContainer] = useState<string>(sessionStorage.getItem(`${name}-${cluster}-container`) || '')

    useEffect(() => {
        if (containers.length > 0 && sessionStorage.getItem(`${name}-${cluster}-container`) === null) {
            sessionStorage.setItem(`${name}-${cluster}-container`, containers[0])
            setContainer(containers[0])
        }
    }, [containers, cluster, name])

    if (cluster !== 'local-cluster' && container !== '') {
        const abortController = new AbortController()
        const logsResult = fetchGet(
            backendUrl +
                `/apis/proxy.open-cluster-management.io/v1beta1/namespaces/${cluster}/clusterstatuses/${cluster}/log/${namespace}/${name}/${container}?tailLines=1000`,
            abortController.signal
        )
        logsResult.then((result) => {
            setStatusCode(result.status)
            setLogs(result.data as string)
        })
    } else if (cluster === 'local-cluster' && container !== '') {
        const abortController = new AbortController()
        const logsResult = fetchGet(
            backendUrl + `/api/v1/namespaces/${namespace}/pods/${name}/log?container=${container}&tailLines=1000`,
            abortController.signal
        )
        logsResult.then((result) => {
            setStatusCode(result.status)
            setLogs(result.data as string)
        })
    }

    if (getResourceError) {
        return (
            <PageSection>
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={`${t('logs.request.error')} ${name}`}
                    subtitle={getResourceError}
                />
            </PageSection>
        )
    } else if (getResource?.getResource?.message) {
        return (
            <PageSection>
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={`${t('logs.request.error')} ${name}`}
                    subtitle={getResource?.getResource?.message}
                />
            </PageSection>
        )
    } else if (statusCode && statusCode >= 300) {
        return (
            <PageSection>
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={`${t('logs.request.error')} ${name}`}
                />
            </PageSection>
        )
    }
    if (!statusCode && logs === '') {
        return (
            <PageSection>
                <AcmLoadingPage />
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
