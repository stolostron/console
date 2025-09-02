/* Copyright Contributors to the Open Cluster Management project */
import { useUserDetailsContext } from './UserPage'
import { RBACResourceYaml } from '../../../../components/RBACResourceYaml'

const UserYaml = () => {
  const { user, loading } = useUserDetailsContext()

  return <RBACResourceYaml resource={user} loading={loading} resourceType="User" />
}

export { UserYaml }
