/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { makeStyles } from '@material-ui/styles'
import { Button, PageSection, SelectOption } from '@patternfly/react-core'
import { LogViewer } from '@patternfly/react-log-viewer'
import { AcmAlert, AcmLoadingPage, AcmSelect } from '../../../../ui-components'
import { useEffect, useRef, useState } from 'react'
import { useRecoilState, useSharedAtoms } from '../../../../shared-recoil'
import { useTranslation } from '../../../../lib/acm-i18next'
import { DOC_BASE_PATH } from '../../../../lib/doc-util'
import { fetchRetry, getBackendUrl, ManagedCluster } from '../../../../resources'

const useStyles = makeStyles({
    logWindowHeader: {
        display: 'flex',
        alignItems: 'center',
        marginTop: '1rem',
        color: '#f5f5f5',
        backgroundColor: '#030303',
    },
    logWindowHeaderItem: {
        display: 'flex',
        alignItems: 'center',
        height: '36px',
        padding: '8px 10px 5px 10px',
        borderRight: '1px solid #4f5255',
    },
    logWindowHeaderItemLabel: {
        paddingRight: '.5rem',
    },
})

export default function LogsPage(props: {
    resourceError: string
    containers: string[]
    cluster: string
    namespace: string
    name: string
}) {
    const { resourceError, containers, cluster, namespace, name } = props
    const logViewerRef = useRef<any>()
    const { t } = useTranslation()
    const classes = useStyles(props)
    const [logs, setLogs] = useState<string>('')
    const [logsError, setLogsError] = useState<string>()
    const [container, setContainer] = useState<string>(sessionStorage.getItem(`${name}-${cluster}-container`) || '')
    const { managedClustersState } = useSharedAtoms()
    const [managedClusters] = useRecoilState(managedClustersState)

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
                    const managedCluster = managedClusters.find((mc: ManagedCluster) => mc.metadata?.name === cluster)
                    const labels = managedCluster?.metadata?.labels ?? {}
                    const vendor = labels['vendor'] ?? ''
                    if (err.code === 400 && vendor.toLowerCase() !== 'openshift') {
                        setLogsError(
                            `Non-OpenShift Container Platform clusters require LoadBalancer to be enabled to retrieve logs. Follow the steps here to complete LoadBalancer setup: ${DOC_BASE_PATH}/release_notes/red-hat-advanced-cluster-management-for-kubernetes-release-notes#non-ocp-logs`
                        )
                    } else {
                        setLogsError(err.message)
                    }
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
    }, [cluster, container, managedClusters, name, namespace])

    function FooterButton() {
        function handleClick() {
            logViewerRef.current?.scrollToBottom()
        }
        return <Button onClick={handleClick}>{t('Jump to the bottom')}</Button>
    }

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
            <div style={{ width: '300px' }}>
                <AcmSelect
                    id={'container-select'}
                    label={''}
                    value={container}
                    onChange={(value) => {
                        setContainer(value ?? container)
                        sessionStorage.setItem(`${name}-${cluster}-container`, value || container)
                    }}
                >
                    {containers.map((container) => {
                        return (
                            <SelectOption key={container} value={container}>
                                {container}
                            </SelectOption>
                        )
                    })}
                </AcmSelect>
            </div>
            <LogViewer
                ref={logViewerRef}
                height={500}
                data={logs ?? ''}
                theme="dark"
                isTextWrapped={false}
                header={
                    <div className={classes.logWindowHeader}>
                        <div className={classes.logWindowHeaderItem}>
                            <p className={classes.logWindowHeaderItemLabel}>{'Cluster:'}</p>
                            {cluster}
                        </div>
                        <div className={classes.logWindowHeaderItem}>
                            <p className={classes.logWindowHeaderItemLabel}>{'Namespace:'}</p>
                            {namespace}
                        </div>
                    </div>
                }
                footer={<FooterButton />}
            />
        </PageSection>
    )
}
