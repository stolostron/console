/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useRef, useEffect, useState, useMemo, useContext } from 'react'
import { FormikProps } from 'formik'
import {
  HostedClusterDetailsStep,
  labelsToArray,
  LoadingState,
  getSupportedCM,
  ClusterDetailsValues,
  ConfigMapK8sResource,
  ClusterImageSetK8sResource,
} from '@openshift-assisted/ui-lib/cim'
import { set, get, isEqual } from 'lodash'
import { getValue } from '../../../../../../../../components/TemplateEditor'
import { useTranslation } from '../../../../../../../../lib/acm-i18next'
import {
  useCanJoinClusterSets,
  useMustJoinClusterSet,
} from '../../../../../ClusterSets/components/useCanJoinClusterSets'
import { getDefault, useClusterImages } from '../utils'
import { Secret } from '../../../../../../../../resources'
import { getExtensionAfter } from '../DetailsForm'
import { HypershiftAgentContext } from './HypershiftAgentContext'
import { getClusterImageVersion, getFieldLabels } from './utils'
import { useSharedAtoms, useRecoilValue } from '../../../../../../../../shared-recoil'
import { FieldName } from '../types'

type FormControl = {
  active: ClusterDetailsValues & {
    managedClusterSet?: string
    additionalLabels?: {
      [x: string]: string
    }[]
    releaseImage?: string
    sshPublicKey?: string
    userManagedNetworking?: boolean
  }
  disabled?: VoidFunction
  reverse?: (control: { active: ClusterDetailsValues }, templateObject: any) => void
  validate?: VoidFunction
  summary?: VoidFunction
  step?: any
  additionalProps?: { isNutanix: boolean; aiFlow: boolean; promptSshPublicKey: boolean }
}

type DetailsFormProps = {
  control: FormControl
  handleChange: (control: FormControl) => void
  controlProps: Secret
}
const fields: any = {
  name: { path: 'HostedCluster[0].metadata.name' },
  baseDnsDomain: { path: 'HostedCluster[0].spec.dns.baseDomain' },
  releaseImage: { path: 'HostedCluster[0].spec.release.image' },
  pullSecret: {},
}

const DetailsForm: React.FC<DetailsFormProps> = ({ control, handleChange, controlProps }) => {
  const { setClusterName, setReleaseImage, setSshPublicKey } = useContext(HypershiftAgentContext)
  const { clusterDeploymentsState, clusterImageSetsState, configMapsState } = useSharedAtoms()
  const clusterDeployments = useRecoilValue(clusterDeploymentsState)
  const clusterImageSets = useRecoilValue(clusterImageSetsState)
  const configMaps = useRecoilValue(configMapsState)
  const formRef = useRef<FormikProps<any>>(null)

  const { t } = useTranslation()
  const { canJoinClusterSets } = useCanJoinClusterSets()
  const mustJoinClusterSet = useMustJoinClusterSet()

  const [managedClusterSet, setManagedClusterSet] = useState<string | undefined>()
  const [additionalLabels, setAdditionaLabels] = useState<Record<string, string> | undefined>({})

  const supportedVersionCM = getSupportedCM(configMaps as ConfigMapK8sResource[])
  const fieldLabels = getFieldLabels(t)

  useEffect(() => {
    if (formRef?.current && control.active && control.active !== formRef?.current?.values) {
      formRef?.current?.setValues(control.active, true)
    }

    control.reverse = (
      control: {
        active: FormControl['active']
      },
      templateObject: any
    ) => {
      const active = {
        ...control.active,
        managedClusterSet: control.active.managedClusterSet,
        additionalLabels: control.active.additionalLabels,
        openshiftVersion:
          clusterImageSets.find((cis) => cis.spec?.releaseImage === control.active.releaseImage)?.metadata.name ||
          control.active.openshiftVersion,
      }
      if (control.active.managedClusterSet !== managedClusterSet) {
        setManagedClusterSet(control.active.managedClusterSet)
      }
      Object.keys(fields).forEach((key) => {
        const path = fields[key].path
        if (path) {
          set(active, key, getValue(templateObject, path) || '')
        }
      })
      if (!isEqual(active, control.active)) {
        control.active = active
      }

      if (formRef.current && !isEqual(active, formRef.current.values)) {
        formRef.current.setValues(active)
      }
    }
    control.validate = () => {
      return formRef?.current?.submitForm().then(() => {
        return formRef?.current?.errors
      })
    }
    control.summary = () => {
      return Object.keys(fields).map((key) => {
        let desc = get(control, `active.${key}`)
        if (key === 'openshiftVersion') {
          desc = getClusterImageVersion(get(control, `active.${key}`))
        }
        return {
          term: fieldLabels[key as FieldName],
          desc: desc,
          exception: get(control, `errors.${key}`),
        }
      })
    }
  }, [control])

  const clusterImages = useClusterImages()

  const usedClusterNames = useMemo(() => clusterDeployments.map((cd) => cd.metadata.name || ''), [])

  const extensionAfter = getExtensionAfter({
    t,
    control,
    handleChange,
    canJoinClusterSets,
    managedClusterSet,
    setManagedClusterSet,
    mustJoinClusterSet,
    additionalLabels,
    setAdditionaLabels,
  })

  const onValuesChanged = useCallback((formikValues: any, initRender: any) => {
    setClusterName(formikValues.name)
    setReleaseImage(formikValues.openshiftVersion)
    setSshPublicKey(control.active.sshPublicKey ?? '')

    const values = {
      ...formikValues,
      managedClusterSet: control.active.managedClusterSet,
      additionalLabels: control.active.additionalLabels,
      releaseImage: clusterImageSets.find(({ metadata }) => metadata.name === formikValues.openshiftVersion)?.spec
        ?.releaseImage,
    }
    if (!isEqual(values, control.active)) {
      if (!initRender || control.active.name === '') {
        control.active = values
      }
      control.step.title.isComplete = false
      handleChange(control)
    }
  }, [])

  useEffect(() => {
    control.active = {
      ...control.active,
      additionalLabels: labelsToArray(additionalLabels).map((keyValue) => {
        const [key, value] = keyValue.split('=', 2)
        return { key, value }
      }),
    }
    handleChange(control)
  }, [additionalLabels])

  useEffect(() => {
    control.active = {
      ...control.active,
      pullSecret: getDefault([controlProps?.stringData?.pullSecret, control.active.pullSecret, '']),
      baseDnsDomain: getDefault([controlProps?.stringData?.baseDomain, control.active.baseDnsDomain, '']),
      sshPublicKey: getDefault([controlProps?.stringData?.['ssh-publickey'], control.active.sshPublicKey, '']),
    }
    handleChange(control)
  }, [controlProps?.metadata.uid, controlProps?.stringData?.pullSecret, controlProps?.stringData?.baseDomain])

  return clusterImages ? (
    <HostedClusterDetailsStep
      formRef={formRef}
      onValuesChanged={onValuesChanged}
      clusterImages={clusterImages as ClusterImageSetK8sResource[]}
      usedClusterNames={usedClusterNames}
      extensionAfter={extensionAfter}
      supportedVersionsCM={supportedVersionCM}
    />
  ) : (
    <LoadingState />
  )
}

export default DetailsForm
