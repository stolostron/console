/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { getResource, Secret, SecretApiVersion, SecretKind } from '../../../../../../resources'
import { ClusterCredentials } from '@openshift-assisted/ui-lib/cim'
import { Cluster } from '@openshift-assisted/types/assisted-installer-service'

type ClusterDeploymentCredentialsProps = {
  cluster: Cluster
  consoleUrl: string
  namespace: string
  adminPasswordSecretRefName: string
}

const ClusterDeploymentCredentials: React.FC<ClusterDeploymentCredentialsProps> = ({
  cluster,
  consoleUrl,
  namespace,
  adminPasswordSecretRefName,
}) => {
  const [credentials, setCredentials] = useState({})

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const secret = await getResource<Secret>({
          apiVersion: SecretApiVersion,
          kind: SecretKind,
          metadata: {
            name: adminPasswordSecretRefName,
            namespace,
          },
        }).promise
        setCredentials({
          username: atob(secret.data?.username || ''),
          password: atob(secret.data?.password || ''),
        })
      } catch (e) {
        console.error('Failed to fetch adminPasswordSecret secret.', e)
      }
    }
    if (['installed', 'adding-hosts'].includes(cluster.status)) {
      fetchCredentials()
    }
  }, [cluster.status, adminPasswordSecretRefName, namespace])

  return <ClusterCredentials cluster={cluster} credentials={{ ...credentials, consoleUrl }} />
}

export default ClusterDeploymentCredentials
