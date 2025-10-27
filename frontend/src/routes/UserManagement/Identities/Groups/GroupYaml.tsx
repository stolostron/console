/* Copyright Contributors to the Open Cluster Management project */
import { useGroupDetailsContext } from './GroupPage'
import { RBACResourceYaml } from '../../../../components/RBACResourceYaml'

const GroupYaml = () => {
  const { group } = useGroupDetailsContext()

  return <RBACResourceYaml resource={group} loading={false} resourceType="Group" />
}
// TODO: trigger sonar issue
export { GroupYaml }
