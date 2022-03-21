/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useRef, useEffect, useState, useMemo } from 'react'
import { FormikProps } from 'formik'
import { CIM } from 'openshift-assisted-ui-lib'
import { set, get, isEqual, startCase, camelCase, debounce } from 'lodash'
import { getValue } from 'temptifly'
import { AcmLabelsInput, AcmSelect } from '@stolostron/ui-components'
import { useTranslation } from '../../../../../../../lib/acm-i18next'
import { SelectOption, Text } from '@patternfly/react-core'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'

import { NavigationPath } from '../../../../../../../NavigationPath'
import { Secret } from '../../../../../../../resources'
import { clusterDeploymentsState } from '../../../../../../../atoms'
import { useCanJoinClusterSets, useMustJoinClusterSet } from '../../../../ClusterSets/components/useCanJoinClusterSets'
import { useClusterImages } from './utils'

const {
    ACMClusterDeploymentDetailsStep,
    FeatureGateContextProvider,
    ACMFeatureSupportLevelProvider,
    ACM_ENABLED_FEATURES,
    labelsToArray,
    LoadingState,
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

const DetailsForm: React.FC<DetailsFormProps> = ({ control, handleChange, controlProps }) => {
    const [clusterDeployments] = useRecoilState(clusterDeploymentsState)
    const formRef = useRef<FormikProps<any>>(null)
    const { t } = useTranslation()

    const { canJoinClusterSets } = useCanJoinClusterSets()
    const mustJoinClusterSet = useMustJoinClusterSet()
    const [managedClusterSet, setManagedClusterSet] = useState<string | undefined>()
    const [additionalLabels, setAdditionaLabels] = useState<Record<string, string> | undefined>({})

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
                return {
                    term: startCase(camelCase(key)),
                    desc: get(control, `active.${key}`),
                    exception: get(control, `errors.${key}`),
                }
            })
        }
    }, [control])

    const clusterImages = useClusterImages()

    const usedClusterNames = useMemo(() => clusterDeployments.map((cd) => cd.metadata.name || ''), [])

    const extensionAfter = {
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
                onChange={(mcs) => setManagedClusterSet(mcs)}
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
            <AcmLabelsInput
                id="additionalLabels"
                label={t('import.form.labels.label')}
                buttonLabel={t('label.add')}
                value={additionalLabels}
                onChange={(label) => setAdditionaLabels(label)}
                placeholder={t('labels.edit.placeholder')}
                isDisabled={false}
            />
        ),
        // pullSecret: control.additionalProps?.['promptSshPublicKey'] ? (
        //     <ClusterSshKeyFields clusterSshKey="" imageSshKey="" /* Props are empty since we are in the Create flow ...*/ />
        // ) : null,
    }

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

    return clusterImages ? (
        <FeatureGateContextProvider features={ACM_ENABLED_FEATURES}>
            <ACMFeatureSupportLevelProvider clusterImages={clusterImages}>
                <ACMClusterDeploymentDetailsStep
                    formRef={formRef}
                    onValuesChanged={onValuesChanged}
                    clusterImages={clusterImages}
                    usedClusterNames={usedClusterNames}
                    pullSecret={controlProps?.stringData?.pullSecret}
                    defaultBaseDomain={controlProps?.stringData?.baseDomain}
                    extensionAfter={extensionAfter}
                />
            </ACMFeatureSupportLevelProvider>
        </FeatureGateContextProvider>
    ) : (
        <LoadingState />
    )
}

export default DetailsForm
