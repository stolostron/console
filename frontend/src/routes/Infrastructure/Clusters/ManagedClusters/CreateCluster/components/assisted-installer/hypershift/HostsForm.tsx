/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { HostedClusterHostsStep, LoadingState } from '@openshift-assisted/ui-lib/cim'
import { FormikProps } from 'formik'
import { HypershiftAgentContext } from './HypershiftAgentContext'
import { getClusterImageSet } from './utils'
import { useSharedAtoms, useSharedRecoil, useRecoilValue } from '../../../../../../../../shared-recoil'
import { useTranslation } from '../../../../../../../../lib/acm-i18next'

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
  const {
    nodePools,
    setNodePools,
    clusterName,
    releaseImage,
    infraEnvNamespace,
    setInfraEnvNamespace,
    controllerAvailabilityPolicy,
    setControllerAvailabilityPolicy,
    infrastructureAvailabilityPolicy,
    setInfrastructureAvailabilityPolicy,
  } = React.useContext(HypershiftAgentContext)
  const { agentsState, clusterImageSetsState, infraEnvironmentsState, nodePoolsState } = useSharedAtoms()
  const { waitForAll } = useSharedRecoil()
  const [agents, infraEnvironments, clusterImageSets, currentNodePools] = useRecoilValue(
    waitForAll([agentsState, infraEnvironmentsState, clusterImageSetsState, nodePoolsState])
  )

  const formRef = React.useRef<FormikProps<any>>(null)
  const { t } = useTranslation()

  const initReleaseImage = getClusterImageSet(clusterImageSets, releaseImage)?.spec?.releaseImage

  const onValuesChanged = React.useCallback((values: any) => {
    if (Object.keys(values).some((key) => values[key] !== control.active?.[key])) {
      control.active = values
      control.step.title.isComplete = false
      setNodePools(values.nodePools)
      setInfraEnvNamespace(values.agentNamespace)
      setControllerAvailabilityPolicy(values.controllerAvailabilityPolicy)
      setInfrastructureAvailabilityPolicy(values.infrastructureAvailabilityPolicy)
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
      term: t('Hosts namespace'),
      desc: control.active.agentNamespace,
    },
    {
      term: t('Node pools'),
      desc: control.active.nodePools.length,
    },
    {
      term: t('Hosts count'),
      desc: control.active.nodePools.reduce((acc: number, nodePool: any) => {
        acc += nodePool.useAutoscaling ? nodePool.autoscaling.maxReplicas : nodePool.count
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
      controllerAvailabilityPolicy={controllerAvailabilityPolicy}
      infrastructureAvailabilityPolicy={infrastructureAvailabilityPolicy}
    />
  ) : (
    <LoadingState />
  )
}

export default HostsForm
