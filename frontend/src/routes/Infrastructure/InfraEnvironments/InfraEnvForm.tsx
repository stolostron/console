/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useMemo } from 'react'
import { CIM } from 'openshift-assisted-ui-lib'
import { EnvironmentStepFormValues } from 'openshift-assisted-ui-lib/dist/src/cim/components/InfraEnv/InfraEnvFormPage'

import './InfraEnvForm.css'
import { useRecoilState } from 'recoil'
import { infraEnvironmentsState } from '../../../atoms'

const { InfraEnvFormPage, getLabels } = CIM

type InfraEnvFormProps = {
    control?: any
    handleChange?: any
}

const InfraEnvForm: React.FC<InfraEnvFormProps> = ({ control, handleChange }) => {
    const [infraEnvironments] = useRecoilState(infraEnvironmentsState)
    const onValuesChanged = useCallback((values: EnvironmentStepFormValues) => {
        control.active = values
        if (values.labels) {
            control.active = {
                ...control.active,
                labels: getLabels(values),
            }
        }
        if (values.pullSecret) {
            control.active = {
                ...control.active,
                pullSecret: btoa(values.pullSecret),
            }
        }
        handleChange(control)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const infraEnvNames = useMemo(() => infraEnvironments.map((ie) => ie.metadata.name), [infraEnvironments])
    return <InfraEnvFormPage onValuesChanged={onValuesChanged} usedNames={infraEnvNames} />
}

export default InfraEnvForm
