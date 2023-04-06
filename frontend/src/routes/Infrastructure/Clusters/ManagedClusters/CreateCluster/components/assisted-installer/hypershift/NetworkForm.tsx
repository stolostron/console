/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { HostedClusterNetworkStep, LoadingState, NetworkFormValues } from 'openshift-assisted-ui-lib/cim'
import { FormikProps } from 'formik'
import isEqual from 'lodash/isEqual'

import { HypershiftAgentContext } from './HypershiftAgentContext'
import { isBMPlatform } from '../../../../../../InfraEnvironments/utils'
import { useSharedAtoms, useSharedRecoil, useRecoilValue } from '../../../../../../../../shared-recoil'
import { getTemplateValue } from '../utils'
import { defaultHostPrefix, defaultPodCIDR, defaultServiceCIDR } from './constants'
import { getClusterImageVersion, getDefaultNetworkType } from './utils'

type FormControl = {
  active: any
  disabled?: VoidFunction
  reverse?: (control: { active: any }, templateObject: any) => void
  validate?: VoidFunction
  summary?: VoidFunction
  step?: any
  additionalProps?: { [x: string]: string }
  onNext: () => Promise<void>
}

type NetworkFormProps = {
  control: FormControl
  handleChange: (control: FormControl) => void
  templateYAML: string
}

export const getDefaultNetworkFormValues = (
  templateYAML: string,
  isBM: boolean,
  isAdvancedNetworking: boolean
): NetworkFormValues => {
  // To preserve form values on Back button
  // Find a better way than parsing the yaml - is there already a parsed up-to-date template?
  const serviceNetworkCidr = getTemplateValue(templateYAML, 'serviceNetworkCidr', defaultServiceCIDR)
  const clusterNetworkCidr = getTemplateValue(templateYAML, 'clusterNetworkCidr', defaultPodCIDR)
  const clusterNetworkHostPrefix = parseInt(
    getTemplateValue(templateYAML, 'clusterNetworkHostPrefix', defaultHostPrefix)
  )
  const sshPublicKey = getTemplateValue(templateYAML, 'id_rsa.pub', '')

  const httpProxy = getTemplateValue(templateYAML, 'httpProxy', '')
  const httpsProxy = getTemplateValue(templateYAML, 'httpsProxy', '')
  const noProxy = getTemplateValue(templateYAML, 'noProxy', '')
  const enableProxy = !!(httpProxy || httpsProxy || noProxy)

  const nodePortPort: number = parseInt(getTemplateValue(templateYAML, 'port', '0'))
  const nodePortAddress = getTemplateValue(templateYAML, 'address', '')
  const isNodePort: boolean = nodePortPort !== undefined || !!nodePortAddress

  return {
    isAdvanced: isAdvancedNetworking,
    sshPublicKey,
    serviceNetworkCidr,
    clusterNetworkCidr,
    enableProxy,
    httpProxy,
    httpsProxy,
    noProxy,
    apiPublishingStrategy: isNodePort || isBM ? 'NodePort' : 'LoadBalancer',
    nodePortPort,
    nodePortAddress,
    clusterNetworkHostPrefix,
  }
}

const NetworkForm: React.FC<NetworkFormProps> = ({ control, handleChange, templateYAML }) => {
  const { isAdvancedNetworking, setIsAdvancedNetworking, releaseImage } = React.useContext(HypershiftAgentContext)
  const { waitForAll } = useSharedRecoil()
  const { agentsState, infrastructuresState, clusterImageSetsState } = useSharedAtoms()
  const [agents, infrastructures, clusterImageSets] = useRecoilValue(
    waitForAll([agentsState, infrastructuresState, clusterImageSetsState])
  )

  const formRef = React.useRef<FormikProps<any>>(null)

  const onValuesChanged = React.useCallback((values) => {
    if (!isEqual(values, control.active)) {
      control.active = { ...control.active, ...values }
      setIsAdvancedNetworking(values.isAdvanced)
      control.step.title.isComplete = false
      handleChange(control)
    }
    // eslint-disable-next-line
  }, [])

  React.useEffect(() => {
    const clusterVersion = getClusterImageVersion(clusterImageSets, releaseImage)
    const networkType = getDefaultNetworkType(clusterVersion)

    if (control.active.networkType !== networkType) {
      onValuesChanged({ ...control.active, networkType })
    }
  }, [releaseImage, clusterImageSets, onValuesChanged, control.active])

  control.validate = () => {
    return formRef?.current?.submitForm().then(() => {
      return formRef?.current?.errors
    })
  }

  control.summary = () => {
    const summary = [
      {
        term: 'Machine CIDR',
        desc: control.active.machineCIDR,
      },
      {
        term: 'SSH public key',
        desc: control.active.sshPublicKey,
      },
    ]

    if (control.active.isAdvanced) {
      summary.push(
        ...[
          {
            term: 'Cluster network CIDR',
            desc: control.active.clusterNetworkCidr,
          },
          {
            term: 'Cluster network host prefix',
            desc: control.active.clusterNetworkHostPrefix,
          },
          {
            term: 'Service network CIDR',
            desc: control.active.serviceNetworkCidr,
          },
        ]
      )
    }

    return summary
  }

  const initialValues: NetworkFormValues = React.useMemo(
    () => getDefaultNetworkFormValues(templateYAML, isBMPlatform(infrastructures[0]), isAdvancedNetworking),
    [templateYAML, infrastructures, isAdvancedNetworking]
  )

  return agents ? (
    <HostedClusterNetworkStep
      formRef={formRef}
      onValuesChanged={onValuesChanged}
      initialValues={initialValues}
      count={0}
    />
  ) : (
    <LoadingState />
  )
}

export default NetworkForm
