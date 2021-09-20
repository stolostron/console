/* Copyright Contributors to the Open Cluster Management project */
import { CIM } from 'openshift-assisted-ui-lib'
import { patchResource } from '../../../../../../resources'

const { EditAgentModal: AIEditAgentModal } = CIM

const EditAgentModal: React.FC<{
    agent: CIM.AgentK8sResource | undefined
    setAgent: (a: CIM.AgentK8sResource | undefined) => void
}> = ({ agent, setAgent }) => (
    <AIEditAgentModal
        isOpen={!!agent}
        agent={agent}
        usedHostnames={[]}
        onClose={() => setAgent(undefined)}
        onSave={(agent, hostname) => {
            return patchResource(agent, [
                {
                    op: 'replace',
                    path: '/spec/hostname',
                    value: hostname,
                },
            ]).promise
        }}
        onFormSaveError={() => {}}
    />
)

export default EditAgentModal
