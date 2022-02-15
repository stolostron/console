/* Copyright Contributors to the Open Cluster Management project */

import { ApplicationWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/Application/ApplicationWizard'
import { ArgoWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/Argo/ArgoWizard'
import { PageSection } from '@patternfly/react-core'
import { AcmErrorBoundary, AcmPage, AcmPageContent, AcmPageHeader } from '@stolostron/ui-components'
import moment from 'moment-timezone'
import { useMemo } from 'react'
import { useHistory } from 'react-router'
import { useRecoilState } from 'recoil'
import { channelsState, gitOpsClustersState, namespacesState, placementsState, secretsState } from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
import { isType } from '../../../lib/is-type'
import { NavigationPath } from '../../../NavigationPath'
import { createResources, IResource, unpackProviderConnection } from '../../../resources'
import { useLocation } from 'react-router-dom'

const Portals = Object.freeze({
    editBtn: 'edit-button-portal-id',
    createBtn: 'create-button-portal-id',
    cancelBtn: 'cancel-button-portal-id',
})

export default function CreateApplicationPage() {
    const { t } = useTranslation()

    // create portals for buttons in header
    const switches = (
        <div className="switch-controls">
            <div id={Portals.editBtn} />
        </div>
    )

    const portals = (
        <div className="portal-controls">
            <div id={Portals.cancelBtn} />
            <div id={Portals.createBtn} />
        </div>
    )

    return (
        <AcmPage
            header={
                <AcmPageHeader
                    title={t('Create application')}
                    breadcrumb={[
                        { text: t('Applications'), to: NavigationPath.applications },
                        { text: t('Create application'), to: '' },
                    ]}
                    switches={switches}
                    actions={portals}
                />
            }
        >
            <AcmErrorBoundary>
                <AcmPageContent id="create-application">
                    <PageSection className="pf-c-content" variant="light" isFilled type="wizard">
                        <CreateApplication />
                    </PageSection>
                </AcmPageContent>
            </AcmErrorBoundary>
        </AcmPage>
    )
}

export function CreateApplication() {
    const location = useLocation().pathname.split('/').at(-1)
    const history = useHistory()
    const [placements] = useRecoilState(placementsState)
    const [gitOpsClusters] = useRecoilState(gitOpsClustersState)
    const [channels] = useRecoilState(channelsState)
    const gitChannels = useMemo(
        () => channels.filter((channel) => channel.spec.type === 'Git' || channel.spec.type === 'GitHub'),
        [channels]
    )
    // const helmChannels = useMemo(() => channels.filter((channel) => channel.spec.type === 'HelmRepo'), [channels])
    const [namespaces] = useRecoilState(namespacesState)
    const [secrets] = useRecoilState(secretsState)
    const providerConnections = secrets.map(unpackProviderConnection)

    const availableArgoNS = gitOpsClusters
        .map((gitOpsCluster) => gitOpsCluster.spec?.argoServer?.argoNamespace)
        .filter(isType)
    const availablePlacements = placements.map((placement) => placement.metadata.name).filter(isType)
    const availableNamespace = namespaces.map((namespace) => namespace.metadata.name).filter(isType)
    const ansibleCredentials = providerConnections.filter(
        (providerConnection) =>
            providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans'
    )
    const availableAnsibleCredentials = ansibleCredentials
        .map((ansibleCredential) => ansibleCredential.metadata.name)
        .filter(isType)

    const currentTimeZone = moment.tz.guess(true)
    const timeZones = currentTimeZone
        ? [currentTimeZone, ...moment.tz.names().filter((e) => e !== currentTimeZone)]
        : moment.tz.names()

    if (location === 'subscription')
        return (
            <ApplicationWizard
                addClusterSets={NavigationPath.clusterSets}
                ansibleCredentials={availableAnsibleCredentials}
                argoServers={availableArgoNS}
                namespaces={availableNamespace}
                placements={availablePlacements}
                onCancel={() => history.push('.')}
                onSubmit={(resources) =>
                    createResources(resources as IResource[]).then((error) => {
                        history.push(NavigationPath.applications)
                        return error
                    })
                }
                // gitChannels={gitChannels.map((channel) => channel.spec.pathname)}
                // helmChannels={helmChannels.map((channel) => channel.spec.pathname)}
                channels={gitChannels as unknown as any}
                timeZones={timeZones}
            />
        )
    // placeholder for ArgoWizard
    else
        return (
            <></>
            // <ArgoWizard
            //     addClusterSets={NavigationPath.clusterSets}
            //     ansibleCredentials={availableAnsibleCredentials}
            //     argoServers={availableArgoNS}
            //     namespaces={availableNamespace}
            //     placements={availablePlacements}
            //     onCancel={() => history.push('.')}
            //     onSubmit={(resources) =>
            //         createResources(resources as IResource[]).then((error) => {
            //             history.push(NavigationPath.applications)
            //             return error
            //         })
            //     }
            //     // gitChannels={gitChannels.map((channel) => channel.spec.pathname)}
            //     // helmChannels={helmChannels.map((channel) => channel.spec.pathname)}
            //     // channels={gitChannels as unknown as any}
            //     timeZones={timeZones}
            // />
        )
}
