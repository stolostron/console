/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import jsYaml from 'js-yaml'
import { getResource } from '../../../../../../resources'
import { AcmInlineCopy } from '../../../../../../ui-components'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { useClusterDetailsContext } from '../ClusterDetails'

export const useHypershiftKubeconfig = (): [string | undefined, boolean] => {
  const { hostedCluster } = useClusterDetailsContext()
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
            namespace: hostedCluster?.metadata?.namespace,
          },
        }).promise
        const kubeconfigString = atob((kubeconfig as any).data?.kubeconfig)
        setHypershiftKubeAPI((jsYaml.load(kubeconfigString) as any).clusters?.[0]?.cluster?.server)
      } catch (err) {
        setError(true)
      }
    }
    hypershiftKubeconfig && fetchKubeconfig()
  }, [hypershiftKubeconfig, hostedCluster?.metadata?.namespace])

  return [hypershiftKubeAPI, error]
}

const HypershiftKubeAPI = () => {
  const { t } = useTranslation()
  const [hypershiftKubeAPI, error] = useHypershiftKubeconfig()

  return hypershiftKubeAPI ? (
    <AcmInlineCopy text={hypershiftKubeAPI} id="kube-api-server" />
  ) : error ? (
    <>{t('Failed to fetch kubeconfig')}</>
  ) : (
    <>-</>
  )
}

export default HypershiftKubeAPI
