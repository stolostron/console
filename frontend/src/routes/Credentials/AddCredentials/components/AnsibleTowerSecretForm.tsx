/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmForm,
    AcmSelect,
    AcmSubmit,
    AcmTextInput,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button, SelectOption, Title } from '@patternfly/react-core'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { validateKubernetesDnsName } from '../../../../lib/validation'
import { NavigationPath } from '../../../../NavigationPath'
import { AnsibleTowerSecret } from '../../../../resources/ansible-tower-secret'
import { ProviderConnection } from '../../../../resources/provider-connection'

export default function AnsibleTowerSecretForm(props: {
    providerConnection: ProviderConnection
    projects: string[]
    ansibleSecret: AnsibleTowerSecret
    setAnsibleSecret: Function
    isEditing?: boolean
}) {
    const [ansibleSecret, setAnsibleSecret] = useState<AnsibleTowerSecret>(props.ansibleSecret)
    const alertContext = useContext(AcmAlertContext)
    const history = useHistory()

    function updateAnsibleSecret(update: (ansibleSecret: AnsibleTowerSecret) => void) {
        const copy = { ...ansibleSecret }
        update(copy)
        setAnsibleSecret(copy)
        props.setAnsibleSecret(copy)
    }

    const { t } = useTranslation(['connection', 'cluster', 'common', 'create'])
    return (
        <AcmForm>
            <Title headingLevel="h4" size="xl">
                Enter Credential Information
            </Title>
            <AcmTextInput
                id="ansibleSecretName"
                label={t('addConnection.ansible.secretname.label')}
                placeholder={t('addConnection.ansible.secretname.placeholder')}
                labelHelp={t('')}
                value={props.ansibleSecret.metadata.name}
                onChange={(name) => {
                    updateAnsibleSecret((ansibleSecret) => {
                        ansibleSecret.metadata.name = name
                    })
                }}
                validation={(value) => validateKubernetesDnsName(value, 'Connection name', t)}
                isRequired
                isDisabled={props.isEditing}
            />
            <AcmSelect
                id="namespaceName"
                label={t('addConnection.namespaceName.label')}
                placeholder={t('addConnection.namespaceName.placeholder')}
                labelHelp={t('addConnection.namespaceName.labelHelp')}
                value={ansibleSecret.metadata.namespace}
                onChange={(namespace) => {
                    updateAnsibleSecret((ansibleSecret) => {
                        ansibleSecret.metadata.namespace = namespace
                    })
                }}
                hidden={!props.isEditing}
                isDisabled={props.isEditing}
            >
                {props.projects.map((project) => (
                    <SelectOption key={project} value={project}>
                        {project}
                    </SelectOption>
                ))}
            </AcmSelect>
            <AcmTextInput
                id="ansibleHostName"
                label={t('addConnection.ansible.host.label')}
                placeholder={t('addConnection.ansible.host.placeholder')}
                labelHelp={t('')}
                value={props.ansibleSecret.spec!.host}
                onChange={(host) => {
                    updateAnsibleSecret((ansibleSecret) => {
                        ansibleSecret.spec!.host = host
                    })
                }}
                // validation={(value) => validateKubernetesDnsName(value, 'Connection name', t)}
                // isRequired
            />
            <AcmTextInput
                id="ansibleToken"
                label={t('addConnection.ansible.token.label')}
                placeholder={t('addConnection.ansible.token.placeholder')}
                labelHelp={t('')}
                value={props.ansibleSecret.spec!.token}
                onChange={(token) => {
                    updateAnsibleSecret((ansibleSecret) => {
                        ansibleSecret.spec!.token = token
                    })
                }}
                validation={(value) => validateKubernetesDnsName(value, 'Connection name', t)}
                isRequired
            />

            <AcmAlertGroup isInline canClose padTop />
            <ActionGroup>
                <AcmSubmit
                    id="submit"
                    variant="primary"
                    hidden={!props.isEditing}
                    onClick={() => {
                        // const data = JSON.parse(JSON.stringify(providerConnection)) as ProviderConnection
                        // const providerID = getProviderConnectionProviderID(data)
                        // if (providerID !== ProviderID.AWS) {
                        //     delete data.spec!.awsAccessKeyID
                        //     delete data.spec!.awsSecretAccessKeyID
                        // }
                        // if (providerID !== ProviderID.AZR) {
                        //     delete data.spec!.baseDomainResourceGroupName
                        //     delete data.spec!.clientId
                        //     delete data.spec!.clientSecret
                        //     delete data.spec!.subscriptionId
                        //     delete data.spec!.tenantId
                        // }
                        // if (providerID !== ProviderID.BMC) {
                        //     delete data.spec!.libvirtURI
                        //     delete data.spec!.sshKnownHosts
                        //     delete data.spec!.imageMirror
                        //     delete data.spec!.bootstrapOSImage
                        //     delete data.spec!.clusterOSImage
                        //     delete data.spec!.additionalTrustBundle
                        // }
                        // if (providerID !== ProviderID.GCP) {
                        //     delete data.spec!.gcProjectID
                        //     delete data.spec!.gcServiceAccountKey
                        // }
                        // if (providerID !== ProviderID.VMW) {
                        //     delete data.spec!.username
                        //     delete data.spec!.password
                        //     delete data.spec!.vcenter
                        //     delete data.spec!.cacertificate
                        //     delete data.spec!.vmClusterName
                        //     delete data.spec!.datacenter
                        //     delete data.spec!.datastore
                        // }
                        // if (providerID !== ProviderID.CRH) {
                        //     delete data.spec!.ocmAPIToken
                        // }
                        // if (providerID !== ProviderID.OST) {
                        //     delete data.spec!.openstackCloudsYaml
                        //     delete data.spec!.openstackCloud
                        // }
                        // delete data.data
                        // alertContext.clearAlerts()
                        // let result: IRequestResult<ProviderConnection>
                        // if (props.isEditing) {
                        //     result = replaceProviderConnection(data)
                        // } else {
                        //     result = createProviderConnection(data)
                        // }
                        // return result.promise
                        //     .then(() => {
                        //         history.push(NavigationPath.credentials)
                        //     })
                        //     .catch((err) => {
                        //         /* istanbul ignore else */
                        //         if (err instanceof Error) {
                        //             alertContext.addAlert({
                        //                 type: 'danger',
                        //                 title: t('common:request.failed'),
                        //                 message: err.message,
                        //             })
                        //         }
                        //     })
                    }}
                    label={props.isEditing ? t('addConnection.saveButton.label') : t('addConnection.addButton.label')}
                    processingLabel={
                        props.isEditing ? t('addConnection.savingButton.label') : t('addConnection.addingButton.label')
                    }
                />
                <Button
                    variant="link"
                    onClick={
                        /* istanbul ignore next */ () => {
                            history.push(NavigationPath.credentials)
                        }
                    }
                >
                    {t('addConnection.cancelButton.label')}
                </Button>
            </ActionGroup>
        </AcmForm>
    )
}
