/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import { Text, TextContent, TextVariants } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { useTranslation } from 'react-i18next'
// import { useState } from 'react'
import { Policy } from '../../../resources'

const useStyles = makeStyles({
    body: {
        position: 'relative',
        top: '-35px',
        padding: '0 8px',
        '& section': {
            paddingTop: 'var(--pf-global--spacer--lg)',
        },
    },
    titleText: {
        paddingBottom: 'var(--pf-global--spacer--xl)',
        '& h4': {
            color: 'var(--pf-global--Color--200)',
        },
    },
    infoArea: {
        fontSize: 'var(--pf-global--FontSize--sm)',
        marginBottom: '2rem',
    },
    sectionSeparator: {
        borderBottom: '1px solid #D2D2D2',
        margin: '0 -2rem 1rem -2rem',
    },

})

export function PolicyAutomationSidebar(props: { policy: Policy }) {
    const { policy } = props
    const classes = useStyles()
    const { t } = useTranslation()

    // const buildPolicyAutomationJSON = ({
    //     policyAutoName,
    //     policyAutoNS,
    //     policyName,
    //     annotations,
    //     resourceVersion,
    //     extraVars,
    //     credentialName,
    //     jobTemplateName,
    //     ansScheduleMode,
    // }) => {
    //     const [credentialName, setCredentialName] = useState('')
    //     const [jobTemplateName, setJobTemplateName] = useState('')
    //     const [extraVars, setExtraVars] = usestate('')
    //     const [ansScheduleMode, setAnsScheduleMode] = useState('')

    //     const modalData = ansScheduleMode ? ansScheduleMode : stateAnsScheduleMode
    //     let mode
    //     switch (modalData) {
    //         case 'once':
    //         case 'disabled':
    //             mode = modalData
    //             break
    //         case 'manual':
    //         default:
    //             mode = 'disabled'
    //             break
    //     }
    //     const jsonTemp = {
    //         kind: 'PolicyAutomation',
    //         apiVersion: 'policy.open-cluster-management.io/v1beta1',
    //         metadata: {
    //             name: policyAutoName ? policyAutoName : '',
    //             namespace: policyAutoNS ? policyAutoNS : '',
    //         },
    //         spec: {
    //             policyRef: policyName ? policyName : '',
    //             mode,
    //             automationDef: {
    //                 type: 'AnsibleJob',
    //                 name: jobTemplateName ? jobTemplateName : stateJobTemplateName,
    //                 secret: credentialName ? credentialName : stateCredentialName,
    //             },
    //         },
    //     }
    //     if (annotations) {
    //         jsonTemp.metadata.annotations = annotations
    //     }
    //     if (resourceVersion) {
    //         jsonTemp.metadata.resourceVersion = resourceVersion
    //     }
    //     if (stateExtraVars || extraVars) {
    //         _.set(jsonTemp, extraVarsStr, this.yamlToJSON(stateExtraVars || extraVars))
    //     }
    //     return jsonTemp
    // }

    // initialize = async () => {
    //     const { data } = this.props
    //     const policyName = _.get(data, metaNameStr)
    //     const policyAutomation = _.get(data, 'policyAutomation')
    //     if (policyAutomation) {
    //         const policyAutoName = _.get(policyAutomation, metaNameStr)
    //         const policyAutoNS = _.get(policyAutomation, metaNSStr)
    //         let annotations = _.get(policyAutomation, 'metadata.annotations')
    //         const resourceVersion = _.get(policyAutomation, 'metadata.resourceVersion')
    //         const credentialName = _.get(policyAutomation, 'spec.automationDef.secret')
    //         const jobTemplateName = _.get(policyAutomation, 'spec.automationDef.name')
    //         const extraVarsJSON = _.get(policyAutomation, extraVarsStr)
    //         let extraVars = null
    //         if (typeof extraVarsJSON === 'object' && Object.keys(extraVarsJSON).length > 0) {
    //             extraVars = this.jsonToYAML(extraVarsJSON)
    //         }
    //         let ansScheduleMode = _.get(policyAutomation, 'spec.mode')
    //         if (annotations && annotations['policy.open-cluster-management.io/rerun'] === 'true') {
    //             ansScheduleMode = 'manual'
    //         } else {
    //             annotations = { 'policy.open-cluster-management.io/rerun': 'false' }
    //         }
    //         const initialJSON = this.buildPolicyAutomationJSON({
    //             policyAutoName,
    //             policyAutoNS,
    //             policyName,
    //             annotations,
    //             resourceVersion,
    //             extraVars,
    //             credentialName,
    //             jobTemplateName,
    //             ansScheduleMode,
    //         })
    //         this.setState({
    //             policyAutoName,
    //             credentialName,
    //             jobTemplateName,
    //             extraVars,
    //             ansScheduleMode,
    //             initialJSON,
    //         })
    //     }
    //     this.setState({
    //         initializeFinished: true,
    //     })
    // }


    const policyCompliance = (policy: Policy) => {
        console.log('status', policy.status)
        switch (policy.status?.compliant) {
            case 'Compliant':
                return (
                    <div>
                        <CheckCircleIcon color="var(--pf-global--success-color--100)" /> {t('Without violations')}
                    </div>
                )
            case 'NonCompliant':
                return (
                    <div>
                        <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" /> {t('With violations')}
                    </div>
                )
            default:
                return (
                    <div>
                        <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" /> {t('No status')}
                    </div>
                )
        }
    }

    return (
        <div className={classes.body}>
            <TextContent className={classes.titleText}>
                <Text component={TextVariants.h1}>{t('Create policy violation automation')}</Text>
                {/* {alertTitle && notifcationOpen && (
                    <Alert variant={alertVariant} isInline={true} actionClose={actionClose}></Alert>
                )} */}
                <Text component={TextVariants.p}>
                    {t(
                        'Create a new policy automation to automate the selected policy for any violations. You can also schedule the automation to run once, continuously, or disable.'
                    )}
                </Text>
            </TextContent>
            <div className={classes.sectionSeparator} />
            <TextContent>
                <Text component={TextVariants.h2}> {t('Policy name')}</Text>
                <Text component={TextVariants.p} className={classes.infoArea}>
                    {policy.metadata.name}
                </Text>
            </TextContent>
            <TextContent>
                <Text component={TextVariants.h2}> {t('Cluster violations')}</Text>
                <div className={classes.infoArea}>{policyCompliance(policy)}</div>
            </TextContent>
            <TextContent>
                {/* TODO TOOL TIP FOR ANSIBLE TOWER URL */}
                <Text component={TextVariants.h2}> {t('Ansible Tower URL')}</Text>
                <Text component={TextVariants.p}>{policy.metadata.name}</Text>
            </TextContent>
        </div>
    )
}
