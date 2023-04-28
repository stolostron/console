/* Copyright Contributors to the Open Cluster Management project */
import { AgentK8sResource, EditAgentModal as AIEditAgentModal } from '@openshift-assisted/ui-lib/cim'
import { onSaveAgent } from '../../CreateCluster/components/assisted-installer/utils'

const EditAgentModal: React.FC<{
  agent: AgentK8sResource | undefined
  setAgent: (a: AgentK8sResource | undefined) => void
  usedHostnames: string[]
}> = ({ agent, setAgent, usedHostnames }) => (
  <AIEditAgentModal
    isOpen={!!agent}
    agent={agent}
    usedHostnames={usedHostnames}
    onClose={() => setAgent(undefined)}
    onSave={onSaveAgent}
  />
)

export default EditAgentModal
