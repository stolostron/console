/* Copyright Contributors to the Open Cluster Management project */
import { ICatalogCard, ItemView, PageHeader } from '@stolostron/react-data-view'
import { Fragment, useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from '../../lib/acm-i18next'
import { DOC_LINKS } from '../../lib/doc-util'
import { NavigationPath } from '../../NavigationPath'
import { AcmIcon, AcmIconVariant } from '../../ui-components'

export function CreateInfrastructureCredentials() {
    const [t] = useTranslation()
    const history = useHistory()

    const cards = useMemo(() => {
        const newCards: ICatalogCard[] = [
            {
                id: 'aws',
                icon: <AcmIcon icon={AcmIconVariant.aws} />,
                title: t('Amazon Web Services'),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.addCredentials,
                        search: '?infrastructureType=AWS',
                    }),
            },
            {
                id: 'azure',
                icon: <AcmIcon icon={AcmIconVariant.azure} />,
                title: t('Microsoft Azure'),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.addCredentials,
                        search: '?infrastructureType=Azure',
                    }),
            },
            {
                id: 'google',
                icon: <AcmIcon icon={AcmIconVariant.gcp} />,
                title: t('Google Cloud'),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.addCredentials,
                        search: '?infrastructureType=GCP',
                    }),
            },
            {
                id: 'openstack',
                icon: <AcmIcon icon={AcmIconVariant.redhat} />,
                title: t('Red Hat OpenStack Platform'),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.addCredentials,
                        search: '?infrastructureType=OpenStack',
                    }),
            },
            {
                id: 'rhv',
                icon: <AcmIcon icon={AcmIconVariant.redhat} />,
                title: t('Red Hat Virtualization'),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.addCredentials,
                        search: '?infrastructureType=RHV',
                    }),
            },
            {
                id: 'vsphere',
                icon: <AcmIcon icon={AcmIconVariant.vmware} />,
                title: t('VMware vSphere'),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.addCredentials,
                        search: '?infrastructureType=vSphere',
                    }),
            },
            {
                id: 'hostinventory',
                icon: <AcmIcon icon={AcmIconVariant.hybrid} />,
                title: t('Host inventory'),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.addCredentials,
                        search: '?infrastructureType=hostInventory',
                    }),
            },
            {
                id: 'ansible',
                icon: <AcmIcon icon={AcmIconVariant.ansible} />,
                title: t('Red Hat Ansible Automation Platform'),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.addCredentials,
                        search: '?infrastructureType=Ansible',
                    }),
            },
            {
                id: 'redhatcloud',
                icon: <AcmIcon icon={AcmIconVariant.redhat} />,
                title: t('Red Hat Openshift Cluster Manager'),
                onClick: () =>
                    history.push({
                        pathname: NavigationPath.addCredentials,
                        search: '?infrastructureType=RedHatCloud',
                    }),
            },
        ]
        return newCards
    }, [history, t])

    const keyFn = useCallback((card: ICatalogCard) => card.id, [])

    const breadcrumbs = useMemo(
        () => [{ label: t('Credentials'), to: NavigationPath.credentials }, { label: t('Credential type') }],
        [t]
    )

    return (
        <Fragment>
            <PageHeader
                title={t('Credential type')}
                description={
                    <Fragment>
                        <p>{t('Choose your credential type.')}</p>
                        <a href={DOC_LINKS.CREATE_CONNECTION} target="_blank" rel="noreferrer">
                            {t('What are the different credentials types?')}
                        </a>
                    </Fragment>
                }
                breadcrumbs={breadcrumbs}
            />
            <ItemView
                items={cards}
                itemKeyFn={keyFn}
                itemToCardFn={(card) => card}
                onBack={() => history.push(NavigationPath.credentials)}
                onCancel={() => history.push(NavigationPath.credentials)}
            />
        </Fragment>
    )
}
