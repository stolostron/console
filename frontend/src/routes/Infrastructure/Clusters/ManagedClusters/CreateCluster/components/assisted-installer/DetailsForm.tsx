/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useRef, useEffect, useState, useMemo } from 'react'
import { FormikProps } from 'formik'
import { CIM } from 'openshift-assisted-ui-lib'
import { set, get, isEqual, startCase, camelCase, debounce } from 'lodash'
import { getValue } from 'temptifly'
import { ClusterImageSet, listClusterImageSets, Secret } from '../../../../../../../resources'
import { ClusterDetailsValues } from 'openshift-assisted-ui-lib/dist/src/common'
import { clusterDeploymentsState } from '../../../../../../../atoms'
import { useRecoilState } from 'recoil'

const { ACMClusterDeploymentDetailsStep, FeatureGateContextProvider, ACM_ENABLED_FEATURES } = CIM

type FormControl = {
    active: ClusterDetailsValues
    disabled?: VoidFunction
    reverse?: (control: { active: ClusterDetailsValues }, templateObject: any) => void
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
}

const DetailsForm: React.FC<DetailsFormProps> = ({ control, handleChange, controlProps }) => {
    const [clusterDeployments] = useRecoilState(clusterDeploymentsState)
    const formRef = useRef<FormikProps<any>>(null)
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
                active: ClusterDetailsValues
            },
            templateObject: any
        ) => {
            const active = { ...control.active }
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
    const onValuesChanged = useCallback(
        debounce((values) => {
            if (!isEqual(values, control.active)) {
                control.active = values
                control.step.title.isComplete = false
                handleChange(control)
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, 300),
        []
    )

    const usedClusterNames = useMemo(() => clusterDeployments.map((cd) => cd.metadata.name || ''), [])
    return (
        <FeatureGateContextProvider features={ACM_ENABLED_FEATURES}>
            <ACMClusterDeploymentDetailsStep
                formRef={formRef}
                onValuesChanged={onValuesChanged}
                clusterImages={clusterImages}
                usedClusterNames={usedClusterNames}
                pullSecret={controlProps?.stringData?.pullSecret}
                defaultBaseDomain={controlProps?.stringData?.baseDomain}
            />
        </FeatureGateContextProvider>
    )
}

export default DetailsForm
