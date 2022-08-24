/* Copyright Contributors to the Open Cluster Management project */
import { Modal, ModalVariant, Button, Wizard } from '@patternfly/react-core'
import { Fragment, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useRecoilCallback } from 'recoil'
import { namespacesState } from '../../../../../../atoms'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { getAuthorizedNamespaces, rbacCreate } from '../../../../../../lib/rbac-util'
import { getSecret, ProviderConnection, SecretDefinition, unpackProviderConnection } from '../../../../../../resources'
import { CredentialsForm } from '../../../../../Credentials/CredentialsForm'

export const ModalWithWizard: React.FunctionComponent = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const params = useParams<{ namespace: string; name: string }>()
    const { name, namespace } = params

    let isEditing = false
    let isViewing = false
    if (name !== undefined) {
        isEditing = location.pathname.startsWith('/multicloud/credentials/edit')
        isViewing = !isEditing
    }

    const [error, setError] = useState<Error>()

    // any recoil resources that constantly update because of a time stamp
    const getNamespaces = useRecoilCallback(
        ({ snapshot }) =>
            () =>
                snapshot.getPromise(namespacesState),
        []
    )
    const [projects, setProjects] = useState<string[]>()
    useEffect(() => {
        if (!isEditing && !isViewing) {
            getNamespaces()
                .then((namespaces) => {
                    getAuthorizedNamespaces([rbacCreate(SecretDefinition)], namespaces)
                        .then((namespaces: string[]) => setProjects(namespaces.sort()))
                        .catch(setError)
                })
                .catch(setError)
        }
        return undefined
    }, [getNamespaces, isEditing, isViewing])
    const { t } = useTranslation()

    const [providerConnection, setProviderConnection] = useState<ProviderConnection | undefined>()
    useEffect(() => {
        if (isEditing || isViewing) {
            const result = getSecret({ name, namespace })
            result.promise
                .then((secret) => setProviderConnection(unpackProviderConnection(secret as ProviderConnection)))
                .catch(setError)
            return result.abort
        }
        return undefined
    }, [isEditing, isViewing, name, namespace])

    const handleModalToggle = () => {
        setIsModalOpen(!isModalOpen)
    }

    return (
        <Fragment>
            <Button variant="secondary" onClick={handleModalToggle}>
                {t('Add credential')}
            </Button>
            <Modal
                variant={ModalVariant.large}
                showClose={false}
                isOpen={isModalOpen}
                aria-labelledby="modal-wizard-label"
                aria-describedby="modal-wizard-description"
                onClose={handleModalToggle}
                hasNoBodyWrapper
            >
                <CredentialsForm namespaces={projects} isEditing={false} isViewing={false} />
            </Modal>
        </Fragment>
    )
}
