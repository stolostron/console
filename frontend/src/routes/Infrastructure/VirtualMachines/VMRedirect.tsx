/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, useParams } from 'react-router-dom-v5-compat'
import { GetUrlSearchParam } from '../../Search/searchDefinitions'

export default function VMRedirect() {
  const { cluster, namespace, name } = useParams()

  const searchParams = GetUrlSearchParam({
    cluster,
    namespace,
    name,
    kind: 'VirtualMachine',
    apigroup: 'kubevirt.io',
    apiversion: 'v1',
  })

  return <Navigate to={`/multicloud/search/resources${searchParams}`} replace />
}
