/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody, CardTitle, Grid, GridItem, Split, SplitItem, Stack, StackItem } from '@patternfly/react-core'
import { CIM } from 'openshift-assisted-ui-lib'
import { useCallback, useMemo } from 'react'
import { useRecoilState } from 'recoil'
import { infraEnvironmentsState, infrastructuresState } from '../../../atoms'
import MainIcon from '../../../logos/OnPremiseBannerIcon.svg'
import './InfraEnvForm.css'
import { isBMPlatform } from './utils'

const { InfraEnvFormPage, getLabels } = CIM

// where to put Create/Cancel buttons
export const Portals = Object.freeze({
    editBtn: 'edit-button-portal-id',
    createBtn: 'create-button-portal-id',
    cancelBtn: 'cancel-button-portal-id',
})

const portals = (
    <Split hasGutter className="infra-env-form__footer">
        <SplitItem>
            <div id={Portals.createBtn} />
        </SplitItem>
        <SplitItem>
            <div id={Portals.cancelBtn} />
        </SplitItem>
    </Split>
)

type InfraEnvFormProps = {
    control?: any
    handleChange?: any
}

const InfraEnvForm: React.FC<InfraEnvFormProps> = ({ control, handleChange }) => {
    const [infraEnvironments] = useRecoilState(infraEnvironmentsState)
    const [infrastructures] = useRecoilState(infrastructuresState)

    const onValuesChanged = useCallback((values: CIM.EnvironmentStepFormValues) => {
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
        if (values.enableNtpSources) {
            control.active = {
                ...control.active,
                additionalNtpSources: values.additionalNtpSources.split(',').map((s) => s.trim()),
            }
        }
        handleChange(control)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const infraEnvNames = useMemo(() => infraEnvironments.map((ie) => ie.metadata.name), [infraEnvironments])
    return (
        <Grid hasGutter className="infra-env-form">
            <GridItem span={8}>
                <InfraEnvFormPage
                    onValuesChanged={onValuesChanged}
                    usedNames={infraEnvNames}
                    isBMPlatform={isBMPlatform(infrastructures[0])}
                />
            </GridItem>
            <GridItem span={8}>
                <Card>
                    <Split hasGutter>
                        <SplitItem>
                            <CardBody style={{ width: '200px' }}>
                                <MainIcon />
                            </CardBody>
                        </SplitItem>
                        <SplitItem isFilled>
                            <CardTitle>Next steps: Adding hosts</CardTitle>
                            <CardBody>
                                <Stack hasGutter>
                                    <StackItem>
                                        Once you've successfully created your infrastructure environment go to the
                                        details view and add hosts to it.
                                    </StackItem>
                                    <StackItem>
                                        This will allow cluster creators to then pull from the infrastructure
                                        environment any available hosts that have been added.
                                    </StackItem>
                                </Stack>
                            </CardBody>
                        </SplitItem>
                    </Split>
                </Card>
            </GridItem>
            <GridItem>{portals}</GridItem>
        </Grid>
    )
}

export default InfraEnvForm
