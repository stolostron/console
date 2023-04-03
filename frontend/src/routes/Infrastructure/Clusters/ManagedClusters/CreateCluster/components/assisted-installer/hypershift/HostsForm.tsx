/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { CIM } from 'openshift-assisted-ui-lib'
import { FormikProps } from 'formik'
import { HypershiftAgentContext } from './HypershiftAgentContext'
import { getClusterImageSet } from './utils'
import { useSharedAtoms, useSharedRecoil, useRecoilValue } from '../../../../../../../../shared-recoil'

const { HostedClusterHostsStep, LoadingState } = CIM
type FormControl = {
  active: any // CIM.HostsFormValues
  disabled?: VoidFunction
  reverse?: (control: { active: any /* CIM.HostsFormValues */ }, templateObject: any) => void
  validate?: VoidFunction
  summary?: VoidFunction
  step?: any
  additionalProps?: { [x: string]: string }
  onNext: () => Promise<void>
}

type HostsFormProps = {
  control: FormControl
  handleChange: (control: FormControl) => void
}

const HostsForm: React.FC<HostsFormProps> = ({ control, handleChange }) => {
  const { nodePools, setNodePools, clusterName, releaseImage, infraEnvNamespace, setInfraEnvNamespace } =
    React.useContext(HypershiftAgentContext)
  const { agentsState, clusterImageSetsState, infraEnvironmentsState, nodePoolsState } = useSharedAtoms()
  const { waitForAll } = useSharedRecoil()
  const [agents, infraEnvironments, clusterImageSets, currentNodePools] = useRecoilValue(
    waitForAll([agentsState, infraEnvironmentsState, clusterImageSetsState, nodePoolsState])
  )

  const formRef = React.useRef<FormikProps<any>>(null)

  const initReleaseImage = getClusterImageSet(clusterImageSets, releaseImage)?.spec?.releaseImage

  const onValuesChanged = React.useCallback((values) => {
    if (Object.keys(values).some((key) => values[key] !== control.active?.[key])) {
      control.active = values
      control.step.title.isComplete = false
      setNodePools(values.nodePools)
      setInfraEnvNamespace(values.agentNamespace)
      handleChange(control)
    }
    // eslint-disable-next-line
  }, [])

  control.validate = async () => {
    await formRef?.current?.submitForm()
    return formRef?.current?.errors
  }

  control.summary = () => [
    {
      term: 'Hosts namespace',
      desc: control.active.agentNamespace,
    },
    {
      term: 'Node pools',
      desc: control.active.nodePools.length,
    },
    {
      term: 'Hosts count',
      desc: control.active.nodePools.reduce((acc: number, nodePool: any) => {
        acc += nodePool.count
        return acc
      }, 0),
    },
  ]

  return agents ? (
    <HostedClusterHostsStep
      formRef={formRef}
      agents={agents}
      onValuesChanged={onValuesChanged}
      infraEnvs={infraEnvironments}
      clusterName={clusterName}
      initInfraEnv={infraEnvNamespace}
      initReleaseImage={initReleaseImage}
      initNodePools={nodePools}
      nodePools={currentNodePools}
    />
  ) : (
    <LoadingState />
  )
}

export default HostsForm
