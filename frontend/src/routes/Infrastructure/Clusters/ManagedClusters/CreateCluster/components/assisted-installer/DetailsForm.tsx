/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useRef, useEffect, useState, useMemo, Dispatch, SetStateAction } from 'react'
import { FormikProps } from 'formik'
import { CIM } from 'openshift-assisted-ui-lib'
import { set, get, isEqual, startCase, camelCase, debounce } from 'lodash'
// eslint-disable-next-line
import { TFunction } from 'react-i18next'
import { SelectOption, Text } from '@patternfly/react-core'
import { Link } from 'react-router-dom'
import { NavigationPath } from '../../../../../../../NavigationPath'
import { Secret, ManagedClusterSet } from '../../../../../../../resources'
import { useCanJoinClusterSets, useMustJoinClusterSet } from '../../../../ClusterSets/components/useCanJoinClusterSets'
import { useClusterImages, getDefault } from './utils'
import { useSharedAtoms, useSharedRecoil, useRecoilState, useRecoilValue } from '../../../../../../../shared-recoil'

import { getValue } from '../../../../../../../components/TemplateEditor'
import { AcmKubernetesLabelsInput, AcmSelect } from '../../../../../../../ui-components'
import { useTranslation } from '../../../../../../../lib/acm-i18next'

const {
  ACMClusterDeploymentDetailsStep,
  FeatureGateContextProvider,
  ACMFeatureSupportLevelProvider,
  ACM_ENABLED_FEATURES,
  labelsToArray,
  LoadingState,
  getVersionFromReleaseImage,
} = CIM

type FormControl = {
  active: CIM.ClusterDetailsValues & {
    managedClusterSet?: string
    additionalLabels?: {
      [x: string]: string
    }[]
  }
  disabled?: VoidFunction
  reverse?: (control: { active: CIM.ClusterDetailsValues }, templateObject: any) => void
  validate?: VoidFunction
  summary?: VoidFunction
  step?: any
  additionalProps?: { [x: string]: string }
}

type DetailsFormProps = {
  control: FormControl
  handleChange: (control: FormControl) => void
  controlProps: Secret
}
const fields: any = {
  name: { path: 'ClusterDeployment[0].metadata.name' },
  baseDnsDomain: { path: 'ClusterDeployment[0].spec.baseDomain' },
  openshiftVersion: { path: 'AgentClusterInstall[0].spec.imageSetRef.name' },
  pullSecret: {},
}

export const getExtensionAfter = ({
  t,
  control,
  handleChange,
  canJoinClusterSets,
  managedClusterSet,
  setManagedClusterSet,
  mustJoinClusterSet,
  additionalLabels,
  setAdditionaLabels,
}: {
  t: TFunction
  control: FormControl
  handleChange: (control: FormControl) => void
  canJoinClusterSets: ManagedClusterSet[] | undefined
  managedClusterSet: string | undefined
  setManagedClusterSet: Dispatch<SetStateAction<string | undefined>>
  mustJoinClusterSet: boolean | undefined
  additionalLabels: Record<string, string> | undefined
  setAdditionaLabels: Dispatch<SetStateAction<Record<string, string> | undefined>>
}) => ({
  // the "key" references element preceeding the one which is being added
  name: (
    <AcmSelect
      id="managedClusterSet"
      label={t('import.form.managedClusterSet.label')}
      placeholder={
        canJoinClusterSets?.length === 0
          ? t('import.no.cluster.sets.available')
          : t('import.form.managedClusterSet.placeholder')
      }
      labelHelp={t('import.form.managedClusterSet.labelHelp')}
      value={managedClusterSet}
      onChange={(value) => {
        setManagedClusterSet(value)
        control.active = { ...control.active, managedClusterSet: value }
        handleChange(control)
      }}
      isDisabled={canJoinClusterSets === undefined || canJoinClusterSets.length === 0}
      hidden={canJoinClusterSets === undefined}
      helperText={
        <Text component="small">
          <Link to={NavigationPath.clusterSets}>{t('import.manage.cluster.sets')}</Link>
        </Text>
      }
      isRequired={mustJoinClusterSet}
    >
      {canJoinClusterSets?.map((mcs) => (
        <SelectOption key={mcs.metadata.name} value={mcs.metadata.name}>
          {mcs.metadata.name}
        </SelectOption>
      ))}
    </AcmSelect>
  ),
  openshiftVersion: (
    <AcmKubernetesLabelsInput
      id="additionalLabels"
      label={t('import.form.labels.label')}
      value={additionalLabels}
      onChange={(label) => setAdditionaLabels(label)}
      placeholder={t('labels.edit.placeholder')}
      isDisabled={false}
    />
  ),
})

const DetailsForm: React.FC<DetailsFormProps> = ({ control, handleChange, controlProps }) => {
  const { clusterDeploymentsState, clusterImageSetsState } = useSharedAtoms()
  const { waitForAll } = useSharedRecoil()
  const [clusterDeployments] = useRecoilState(clusterDeploymentsState)
  const [clusterImageSets] = useRecoilValue(waitForAll([clusterImageSetsState]))
  const formRef = useRef<FormikProps<any>>(null)
  const { t } = useTranslation()

  const { canJoinClusterSets } = useCanJoinClusterSets()
  const mustJoinClusterSet = useMustJoinClusterSet()
  const [managedClusterSet, setManagedClusterSet] = useState<string | undefined>()
  const [additionalLabels, setAdditionaLabels] = useState<Record<string, string> | undefined>({})

  const getVersion = (versionName = '') => {
    const clusterImage = clusterImageSets.find((clusterImageSet) => clusterImageSet.metadata?.name == versionName)
    return getVersionFromReleaseImage(clusterImage?.spec?.releaseImage) || versionName
  }

  useEffect(() => {
    if (control.disabled && formRef?.current) {
      Array.from(document.forms[0].elements as HTMLCollectionOf<HTMLElement>).forEach((item: HTMLElement) => {
        item.setAttribute('disabled', 'true')
      })
    }
  }, [control.disabled, formRef.current])

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
          desc = getVersion(get(control, `active.${key}`))
        }
        return {
          term: startCase(camelCase(key)),
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

  useEffect(() => {
    control.active = { ...control.active, managedClusterSet }
    handleChange(control)
  }, [managedClusterSet])

  const onValuesChanged = useCallback(
    debounce((formikValues, initRender) => {
      const values = {
        ...formikValues,
        managedClusterSet: control.active.managedClusterSet,
        additionalLabels: control.active.additionalLabels,
      }
      if (!isEqual(values, control.active)) {
        if (!initRender || control.active.name === '') {
          control.active = values
        }
        control.step.title.isComplete = false
        handleChange(control)
      }
    }),
    []
  )

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
    }
    handleChange(control)
  }, [controlProps?.metadata.uid, controlProps?.stringData?.pullSecret, controlProps?.stringData?.baseDomain])

  return clusterImages ? (
    <FeatureGateContextProvider features={ACM_ENABLED_FEATURES}>
      <ACMFeatureSupportLevelProvider clusterImages={clusterImages as CIM.ClusterImageSetK8sResource[]}>
        <ACMClusterDeploymentDetailsStep
          formRef={formRef}
          onValuesChanged={onValuesChanged}
          clusterImages={clusterImages as CIM.ClusterImageSetK8sResource[]}
          usedClusterNames={usedClusterNames}
          extensionAfter={extensionAfter}
        />
      </ACMFeatureSupportLevelProvider>
    </FeatureGateContextProvider>
  ) : (
    <LoadingState />
  )
}

export default DetailsForm
