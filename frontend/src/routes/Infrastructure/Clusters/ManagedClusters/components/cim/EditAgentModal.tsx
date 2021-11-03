/* Copyright Contributors to the Open Cluster Management project */
import { CIM } from 'openshift-assisted-ui-lib'
import { onSaveAgent } from '../../CreateCluster/components/assisted-installer/utils'

const { EditAgentModal: AIEditAgentModal } = CIM

const EditAgentModal: React.FC<{
    agent: CIM.AgentK8sResource | undefined
    setAgent: (a: CIM.AgentK8sResource | undefined) => void
}> = ({ agent, setAgent }) => (
    // TODO(mlibra): Props should be properly set here, see AIHostsForm.tsx for an example
    <AIEditAgentModal
        isOpen={!!agent}
        agent={agent}
        usedHostnames={[]}
        onClose={() => setAgent(undefined)}
        onSave={onSaveAgent}
        onFormSaveError={() => {}}
    />
)

export default EditAgentModal
