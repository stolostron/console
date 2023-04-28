/* Copyright Contributors to the Open Cluster Management project */
import * as CIM from '@openshift-assisted/ui-lib/cim'
import { onSaveAgent } from '../../CreateCluster/components/assisted-installer/utils'

const { EditAgentModal: AIEditAgentModal } = CIM

const EditAgentModal: React.FC<{
  agent: CIM.AgentK8sResource | undefined
  setAgent: (a: CIM.AgentK8sResource | undefined) => void
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
