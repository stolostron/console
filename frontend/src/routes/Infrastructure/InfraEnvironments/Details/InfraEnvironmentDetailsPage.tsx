/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmButton,
    AcmPage,
    AcmPageHeader,
    AcmRoute,
    AcmSecondaryNav,
    AcmSecondaryNavItem,
} from '@open-cluster-management/ui-components'
import isEqual from 'lodash/isEqual'
import { Page } from '@patternfly/react-core'
import { Fragment, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Redirect, Route, RouteComponentProps, Switch, useHistory, useLocation } from 'react-router-dom'
import { useRecoilState, useRecoilValue, waitForAll } from 'recoil'
import { CIM } from 'openshift-assisted-ui-lib'
import { acmRouteState, infraEnvironmentsState } from '../../../../atoms'
import { ErrorPage } from '../../../../components/ErrorPage'
import { NavigationPath } from '../../../../NavigationPath'
import DetailsTab from './DetailsTab'
import HostsTab from './HostsTab'
import { ResourceError, createResource, patchResource } from '../../../../resources'

const { AddHostModal, getBareMetalHostCredentialsSecret, getBareMetalHost } = CIM

type InfraEnvironmentDetailsPageProps = RouteComponentProps<{ namespace: string; name: string }>

const InfraEnvironmentDetailsPage: React.FC<InfraEnvironmentDetailsPageProps> = ({ match }) => {
    const { t } = useTranslation(['infraenv'])
    const history = useHistory()
    const location = useLocation()
    const [, setRoute] = useRecoilState(acmRouteState)
    useEffect(() => setRoute(AcmRoute.InfraEnvironments), [setRoute])
    const [isoModalOpen, setISOModalOpen] = useState(false)

    const [infraEnvironments] = useRecoilValue(waitForAll([infraEnvironmentsState]))

    const infraEnv = infraEnvironments.find(
        (i) => i.metadata.name === match.params.name && i.metadata.namespace === match.params.namespace
    )

    if (!infraEnv) {
        return (
            <Page>
                <ErrorPage
                    error={new ResourceError('Not found', 404)}
                    actions={
                        <AcmButton role="link" onClick={() => history.push(NavigationPath.infraEnvironments)}>
                            {t('button.backToInfraEnvs')}
                        </AcmButton>
                    }
                />
            </Page>
        )
    }

    return (
        <>
            <AcmPage
                hasDrawer
                header={
                    <AcmPageHeader
                        breadcrumb={[
                            { text: t('infraenvs'), to: NavigationPath.infraEnvironments },
                            { text: infraEnv.metadata.name, to: '' },
                        ]}
                        title={infraEnv.metadata.name}
                        navigation={
                            <AcmSecondaryNav>
                                <AcmSecondaryNavItem
                                    isActive={
                                        location.pathname ===
                                        NavigationPath.infraEnvironmentOverview
                                            .replace(':namespace', match.params.namespace)
                                            .replace(':name', match.params.name)
                                    }
                                >
                                    <Link
                                        to={NavigationPath.infraEnvironmentOverview
                                            .replace(':namespace', match.params.namespace)
                                            .replace(':name', match.params.name)}
                                    >
                                        {t('tab.details')}
                                    </Link>
                                </AcmSecondaryNavItem>
                                <AcmSecondaryNavItem
                                    isActive={
                                        location.pathname ===
                                        NavigationPath.infraEnvironmentHosts
                                            .replace(':namespace', match.params.namespace)
                                            .replace(':name', match.params.name)
                                    }
                                >
                                    <Link
                                        to={NavigationPath.infraEnvironmentHosts
                                            .replace(':namespace', match.params.namespace)
                                            .replace(':name', match.params.name)}
                                    >
                                        {t('tab.hosts')}
                                    </Link>
                                </AcmSecondaryNavItem>
                            </AcmSecondaryNav>
                        }
                        actions={<AcmButton onClick={() => setISOModalOpen(true)}>{t('Add host')}</AcmButton>}
                    />
                }
            >
                <Suspense fallback={<Fragment />}>
                    <Switch>
                        <Route exact path={NavigationPath.infraEnvironmentOverview}>
                            <DetailsTab infraEnv={infraEnv} />
                        </Route>
                        <Route exact path={NavigationPath.infraEnvironmentHosts}>
                            <HostsTab infraEnv={infraEnv} />
                        </Route>
                        <Route exact path={NavigationPath.infraEnvironmentDetails}>
                            <Redirect
                                to={NavigationPath.infraEnvironmentOverview
                                    .replace(':namespace', match.params.namespace)
                                    .replace(':name', match.params.name)}
                            />
                        </Route>
                    </Switch>
                </Suspense>
            </AcmPage>
            <AddHostModal
                infraEnv={infraEnv}
                isOpen={isoModalOpen}
                onClose={() => setISOModalOpen(false)}
                onCreate={async (values: CIM.AddBmcValues, nmState: CIM.NMStateK8sResource) => {
                    const secret = getBareMetalHostCredentialsSecret(values, infraEnv.metadata.namespace)
                    const secretRes = await createResource<any>(secret).promise
                    if (nmState) {
                        await createResource<any>(nmState).promise
                        const matchLabels = { infraEnv: infraEnv.metadata.name }
                        if (!isEqual(infraEnv.spec.nmStateConfigLabelSelector?.matchLabels, matchLabels)) {
                            const op = Object.prototype.hasOwnProperty.call(infraEnv.spec, 'nmStateConfigLabelSelector')
                                ? 'replace'
                                : 'add'
                            await patchResource(infraEnv, [
                                {
                                    op: op,
                                    path: `/spec/nmStateConfigLabelSelector`,
                                    value: {
                                        matchLabels,
                                    },
                                },
                            ]).promise
                        }
                    }
                    const bmh: CIM.BareMetalHostK8sResource = getBareMetalHost(values, infraEnv, secretRes)
                    return createResource(bmh).promise
                }}
            />
        </>
    )
}

export default InfraEnvironmentDetailsPage
