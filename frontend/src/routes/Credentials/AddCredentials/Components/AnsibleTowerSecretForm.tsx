/* Copyright Contributors to the Open Cluster Management project */

import { AcmAlertGroup, AcmForm, AcmSelect, AcmSubmit, AcmTextInput } from '@open-cluster-management/ui-components'
import { ActionGroup, Button, SelectOption, Title } from '@patternfly/react-core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { IRequestResult } from '../../../../lib/resource-request'
import { validateKubernetesDnsName } from '../../../../lib/validation'
import { NavigationPath } from '../../../../NavigationPath'
import {
    AnsibleTowerSecret,
    createAnsibleTowerSecret,
    replaceAnsibleTowerSecret,
} from '../../../../resources/ansible-tower-secret'

export default function AnsibleTowerSecretForm(props: {
    projects: string[]
    ansibleSecret: AnsibleTowerSecret
    isEditing?: boolean
}) {
    const [ansibleSecret, setAnsibleSecret] = useState<AnsibleTowerSecret>(props.ansibleSecret)
    const history = useHistory()

    function updateAnsibleSecret(update: (ansibleSecret: AnsibleTowerSecret) => void) {
        const copy = { ...ansibleSecret }
        update(copy)
        setAnsibleSecret(copy)
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
                value={ansibleSecret.metadata.name}
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
                value={ansibleSecret.spec!.host}
                onChange={(host) => {
                    updateAnsibleSecret((ansibleSecret) => {
                        ansibleSecret.spec!.host = host
                    })
                }}
                // validation={(value) => validateKubernetesDnsName(value, 'Connection name', t)}
                isRequired
            />
            <AcmTextInput
                id="ansibleToken"
                label={t('addConnection.ansible.token.label')}
                placeholder={t('addConnection.ansible.token.placeholder')}
                labelHelp={t('')}
                value={ansibleSecret.spec!.token}
                onChange={(token) => {
                    updateAnsibleSecret((ansibleSecret) => {
                        ansibleSecret.spec!.token = token
                    })
                }}
                // validation={(value) => validateKubernetesDnsName(value, 'Connection name', t)}
                isRequired
            />
            <AcmAlertGroup isInline canClose padTop />
            {props.isEditing && (
                <ActionGroup>
                    <AcmSubmit
                        id="submit"
                        variant="primary"
                        onClick={() => {
                            const data = JSON.parse(JSON.stringify(ansibleSecret)) as AnsibleTowerSecret
                            let result: IRequestResult<AnsibleTowerSecret>

                            if (props.isEditing) {
                                result = replaceAnsibleTowerSecret(data)
                            } else {
                                result = createAnsibleTowerSecret(data)
                            }
                            return result.promise
                                .then(() => {
                                    history.push(NavigationPath.credentials)
                                })
                                .catch((err) => {
                                    /* istanbul ignore else */
                                    // if (err instanceof Error) {
                                    //     alertContext.addAlert({
                                    //         type: 'danger',
                                    //         title: t('common:request.failed'),
                                    //         message: err.message,
                                    //     })
                                    // }
                                })
                        }}
                        label={
                            props.isEditing ? t('addConnection.saveButton.label') : t('addConnection.addButton.label')
                        }
                        processingLabel={
                            props.isEditing
                                ? t('addConnection.savingButton.label')
                                : t('addConnection.addingButton.label')
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
            )}
        </AcmForm>
    )
}
