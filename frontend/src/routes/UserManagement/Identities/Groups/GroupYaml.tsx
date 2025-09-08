/* Copyright Contributors to the Open Cluster Management project */
import { useGroupDetailsContext } from './GroupPage'
import { RBACResourceYaml } from '../../../../components/RBACResourceYaml'

const GroupYaml = () => {
  const { group, loading } = useGroupDetailsContext()

  return <RBACResourceYaml resource={group} loading={loading} resourceType="Group" />
}

export { GroupYaml }
