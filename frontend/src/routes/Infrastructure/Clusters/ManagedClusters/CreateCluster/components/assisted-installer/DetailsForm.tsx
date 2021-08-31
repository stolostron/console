/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useEffect, useState } from 'react'
import { CIM } from 'openshift-assisted-ui-lib'
import { ClusterImageSet, listClusterImageSets, Secret } from '../../../../../../../resources'
import { ClusterDetailsValues } from 'openshift-assisted-ui-lib/dist/src/common'

const { ACMClusterDeploymentDetailsStep } = CIM

type FormControl = {
    active: ClusterDetailsValues
}

type DetailsFormProps = {
    control: FormControl
    handleChange: (control: FormControl) => void
    controlProps: Secret
}

const DetailsForm: React.FC<DetailsFormProps> = ({ control, handleChange, controlProps }) => {
    const [clusterImages, setClusterImages] = useState<ClusterImageSet[]>([])
    useEffect(() => {
        const fetchImages = async () => {
            const images = await listClusterImageSets().promise
            setClusterImages(images)
        }
        fetchImages()
    })
    const onValuesChanged = useCallback((values) => {
        control.active = values
        if (values.pullSecret) {
            control.active = {
                ...control.active,
                pullSecret: btoa(values.pullSecret),
            }
        }
        handleChange(control)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <ACMClusterDeploymentDetailsStep
            onValuesChanged={onValuesChanged}
            clusterImages={clusterImages}
            usedClusterNames={[]}
            defaultPullSecret={controlProps?.stringData?.pullSecret}
            defaultBaseDomain={controlProps?.stringData?.baseDomain}
        />
    )
}

export default DetailsForm
