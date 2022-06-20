/* Copyright Contributors to the Open Cluster Management project */
import { HostedClusterK8sResource } from 'openshift-assisted-ui-lib/cim'
import * as React from 'react'
import jsYaml from 'js-yaml'
import { getResource } from '../../../../../../resources'
import { AcmInlineCopy } from '@stolostron/ui-components'

type HypershiftKubeAPIProps = {
    hostedCluster: HostedClusterK8sResource
}

const HypershiftKubeAPI = ({ hostedCluster }: HypershiftKubeAPIProps) => {
    const [hypershiftKubeAPI, setHypershiftKubeAPI] = React.useState<string>()
    const [error, setError] = React.useState(false)

    const hypershiftKubeconfig = hostedCluster?.status?.kubeconfig?.name

    React.useEffect(() => {
        const fetchKubeconfig = async () => {
            try {
                setError(false)
                const kubeconfig = await getResource({
                    apiVersion: 'v1',
                    kind: 'Secret',
                    metadata: {
                        name: hypershiftKubeconfig,
                        namespace: hostedCluster?.metadata.namespace,
                    },
                }).promise
                const kubeconfigString = atob((kubeconfig as any).data?.kubeconfig)
                setHypershiftKubeAPI((jsYaml.load(kubeconfigString) as any).clusters?.[0]?.cluster?.server)
            } catch (err) {
                setError(true)
            }
        }
        hypershiftKubeconfig && fetchKubeconfig()
    }, [hypershiftKubeconfig])

    return hypershiftKubeAPI ? (
        <AcmInlineCopy text={hypershiftKubeAPI} id="kube-api-server" />
    ) : error ? (
        'Failed to fetch kubeconfig'
    ) : (
        '-'
    )
}

export default HypershiftKubeAPI
