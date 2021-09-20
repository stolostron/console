/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useRef, useEffect, useState, useMemo } from 'react'
import { FormikProps } from 'formik'
import { CIM } from 'openshift-assisted-ui-lib'
import { set, get, isEqual, startCase, camelCase, debounce } from 'lodash'
import { getValue } from 'temptifly'
import { AcmSelect } from '@open-cluster-management/ui-components'
import { useTranslation } from 'react-i18next'
import { SelectOption, Text } from '@patternfly/react-core'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'

import { NavigationPath } from '../../../../../../../NavigationPath'
import { ClusterImageSet, listClusterImageSets, Secret } from '../../../../../../../resources'
import { clusterDeploymentsState } from '../../../../../../../atoms'
import { useCanJoinClusterSets, useMustJoinClusterSet } from '../../../../ClusterSets/components/useCanJoinClusterSets'

const { ACMClusterDeploymentDetailsStep, FeatureGateContextProvider, ACM_ENABLED_FEATURES } = CIM

type FormControl = {
    active: CIM.ClusterDetailsValues
    disabled?: VoidFunction
    reverse?: (control: { active: CIM.ClusterDetailsValues }, templateObject: any) => void
    validate?: VoidFunction
    summary?: VoidFunction
    step?: any
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
    managedClusterSet: { path: 'ClusterDeployment[0].metadata.labels["cluster.open-cluster-management.io/clusterset"]' },
}

const DetailsForm: React.FC<DetailsFormProps> = ({ control, handleChange, controlProps }) => {
    const [clusterDeployments] = useRecoilState(clusterDeploymentsState)
    const formRef = useRef<FormikProps<any>>(null)
    const { t } = useTranslation(['cluster'])

    const { canJoinClusterSets } = useCanJoinClusterSets()
    const mustJoinClusterSet = useMustJoinClusterSet()
    const [managedClusterSet, setManagedClusterSet] = useState<string | undefined>()

    useEffect(() => {
        if (formRef?.current && control.active && control.active !== formRef?.current?.values) {
            formRef?.current?.setValues(control.active, true)
        }

        if (control.disabled) {
            Array.from(document.forms[0].elements as HTMLCollectionOf<HTMLElement>).forEach(
                (item: HTMLElement, inx) => {
                    item.style.backgroundColor = '#e0e0e0'
                    item.style.pointerEvents = 'none'
                    item.addEventListener('keydown', (event) => {
                        event.preventDefault()
                        return false
                    })
                    if (inx === 0) {
                        setTimeout(() => {
                            item.blur()
                        })
                    }
                }
            )
        }

        control.reverse = (
            control: {
                active: CIM.ClusterDetailsValues
            },
            templateObject: any
        ) => {
            const active = { ...control.active, managedClusterSet }
            Object.keys(fields).forEach((key) => {
                const path = fields[key].path
                if (path) {
                    set(active, key, getValue(templateObject, path) || '')
                }
            })
            if (!isEqual(active, control.active)) {
                control.active = active
                formRef?.current?.setValues(control.active)
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

    const [clusterImages, setClusterImages] = useState<ClusterImageSet[]>([])
    useEffect(() => {
        const fetchImages = async () => {
            const images = await listClusterImageSets().promise
            if (!isEqual(images, clusterImages)) {
                setClusterImages(images)
            }
        }
        fetchImages()
    }, [])

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
        openshiftVersion: <div>Bar</div>,
    }

    useEffect(() => {
        control.active = { ...control.active, managedClusterSet }
        handleChange(control)
    }, [managedClusterSet])

    const onValuesChanged = useCallback(
        debounce((formiValues) => {
            const values = { ...formiValues, managedClusterSet: control.active.managedClusterSet }
            if (!isEqual(values, control.active)) {
                control.active = values
                control.step.title.isComplete = false
                handleChange(control)
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, 300),
        []
    )

    return (
        <FeatureGateContextProvider features={ACM_ENABLED_FEATURES}>
            <ACMClusterDeploymentDetailsStep
                formRef={formRef}
                onValuesChanged={onValuesChanged}
                clusterImages={clusterImages}
                usedClusterNames={usedClusterNames}
                pullSecret={controlProps?.stringData?.pullSecret}
                defaultBaseDomain={controlProps?.stringData?.baseDomain}
                extensionAfter={extensionAfter}
            />
        </FeatureGateContextProvider>
    )
}

export default DetailsForm
