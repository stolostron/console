/* Copyright Contributors to the Open Cluster Management project */
import { saveAs } from 'file-saver'
import { HostedClusterK8sResource, SecretK8sResource } from '@openshift-assisted/ui-lib/cim'
import { Button, ButtonVariant } from '@patternfly/react-core'
import { useTranslation } from '../../../../../lib/acm-i18next'

type HypershiftKubeconfigDownloadProps = {
  hostedCluster: HostedClusterK8sResource | undefined
  fetchSecret: (name: string, namespace: string) => Promise<SecretK8sResource>
}

const HypershiftKubeconfigDownload = ({ hostedCluster, fetchSecret }: HypershiftKubeconfigDownloadProps) => {
  const { t } = useTranslation()
  const handleKubeconfigDownload = async () => {
    const kubeconfigSecretName = hostedCluster?.status?.kubeconfig?.name
    const kubeconfigSecretNamespace = hostedCluster?.metadata?.namespace

    if (kubeconfigSecretName && kubeconfigSecretNamespace) {
      try {
        const kubeconfigSecret = await fetchSecret(kubeconfigSecretName, kubeconfigSecretNamespace)
        const kubeconfig = kubeconfigSecret.data?.kubeconfig

        if (!kubeconfig) {
          throw new Error('Kubeconfig is empty.')
        }

        const blob = new Blob([Buffer.from(kubeconfig, 'base64')], { type: 'text/plain;charset=utf-8' })
        saveAs(blob, 'kubeconfig.yaml')
      } catch (e) {
        console.error('Failed to fetch kubeconfig secret.', e)
      }
    }
  }

  return (
    <Button
      variant={ButtonVariant.link}
      onClick={handleKubeconfigDownload}
      isDisabled={!hostedCluster?.status?.kubeconfig?.name}
    >
      {t('Download kubeconfig')}
    </Button>
  )
}

export default HypershiftKubeconfigDownload
