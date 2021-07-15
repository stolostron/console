/* Copyright Contributors to the Open Cluster Management project */
import { useCallback } from 'react'
import { CIM } from 'openshift-assisted-ui-lib'
import { EnvironmentStepFormValues } from 'openshift-assisted-ui-lib/dist/src/cim/components/InfraEnv/InfraEnvFormPage'

import './InfraEnvForm.css'

const { InfraEnvFormPage, getLabels } = CIM

type InfraEnvFormProps = {
    control?: any
    handleChange?: any
}

const InfraEnvForm: React.FC<InfraEnvFormProps> = ({ control, handleChange }) => {
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
    return <InfraEnvFormPage onValuesChanged={onValuesChanged} usedNames={[]} />
}

export default InfraEnvForm
