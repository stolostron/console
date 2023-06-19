/* Copyright Contributors to the Open Cluster Management project */
import {
    Card,
    CardBody,
    CardTitle,
    Grid,
    GridItem,
    PageSection,
    Split,
    SplitItem,
    Stack,
    StackItem,
} from '@patternfly/react-core'
import { CIM } from '@openshift-assisted/ui-lib'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { FormikProps } from 'formik'

import { useTranslation } from '../../../lib/acm-i18next'
import MainIcon from '../../../logos/OnPremiseBannerIcon.svg'
import { useSharedAtoms, useRecoilState } from '../../../shared-recoil'

import './InfraEnvForm.css'

const { InfraEnvFormPage, getLabels } = CIM

// where to put Create/Cancel buttons
export const Portals = Object.freeze({
    editBtn: 'edit-button-portal-id',
    createBtn: 'create-button-portal-id',
    cancelBtn: 'cancel-button-portal-id',
})

const portals = (
    <PageSection variant="light" isFilled>
        <Split hasGutter>
            <SplitItem>
                <div id={Portals.createBtn} />
            </SplitItem>
            <SplitItem>
                <div id={Portals.cancelBtn} />
            </SplitItem>
        </Split>
    </PageSection>
)

type InfraEnvFormProps = {
    control?: any
    handleChange?: any
}

const InfraEnvForm: React.FC<InfraEnvFormProps> = ({ control, handleChange }) => {
    const { t } = useTranslation()

    const { infraEnvironmentsState } = useSharedAtoms()
    const [infraEnvironments] = useRecoilState(infraEnvironmentsState)
    const formRef = useRef<FormikProps<any>>(null)

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
                additionalNtpSources: values.additionalNtpSources
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
            }
        }
        handleChange(control)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        control.validate = () => {
            return formRef?.current?.submitForm().then(() => {
                return formRef?.current?.errors
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const infraEnvNames = useMemo(() => infraEnvironments.map((ie) => ie.metadata?.name!), [infraEnvironments])
    return (
        <>
            <PageSection variant="light" isFilled>
                <Grid hasGutter className="infra-env-form">
                    <GridItem span={8}>
                        <InfraEnvFormPage
                            onValuesChanged={onValuesChanged}
                            usedNames={infraEnvNames}
                            formRef={formRef}
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
                                    <CardTitle>{t('Next steps: Adding hosts')}</CardTitle>
                                    <CardBody>
                                        <Stack hasGutter>
                                            <StackItem>
                                                {t(
                                                    'After your infrastructure environment is successfully created, open the details view and click the "Add hosts" button.'
                                                )}
                                            </StackItem>
                                            <StackItem>
                                                {t(
                                                    'Adding hosts allows cluster creators to pull any available hosts from the infrastructure environment.'
                                                )}
                                            </StackItem>
                                        </Stack>
                                    </CardBody>
                                </SplitItem>
                            </Split>
                        </Card>
                    </GridItem>
                </Grid>
            </PageSection>
            {portals}
        </>
    )
}

export default InfraEnvForm
