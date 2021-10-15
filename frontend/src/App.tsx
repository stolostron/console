/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import {
    AcmTablePaginationContextProvider,
    AcmToastGroup,
    AcmToastProvider,
} from '@open-cluster-management/ui-components'
import {
    Dropdown,
    DropdownItem,
    DropdownToggle,
    Nav,
    NavExpandable,
    NavItem,
    NavItemSeparator,
    NavList,
    Page,
    PageHeader,
    PageSection,
    PageSidebar,
    Title,
} from '@patternfly/react-core'
import RedHatIcon from '@patternfly/react-icons/dist/js/icons/redhat-icon'
import { Fragment, lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { BrowserRouter, Link, Redirect, Route, RouteComponentProps, Switch, useLocation } from 'react-router-dom'
import './App.css'
import { LoadData } from './atoms'
import { LoadingPage } from './components/LoadingPage'
import './lib/i18n'
import { NavigationPath } from './NavigationPath'

const ApplicationsPage = lazy(() => import('./routes/Applications/Applications'))

const ClusterManagementPage = lazy(() => import('./routes/Infrastructure/Clusters/Clusters'))
const CreateBareMetalAssetPage = lazy(() => import('./routes/Infrastructure/BareMetalAssets/CreateBareMetalAsset'))

const CredentialPage = lazy(() => import('./routes/Credentials/CredentialsForm'))
const CredentialsPage = lazy(() => import('./routes/Credentials/Credentials'))
const AnsibleAutomationFormPage = lazy(() => import('./routes/Infrastructure/Automations/AnsibleAutomationsForm'))
const BareMetalAssetsPage = lazy(() => import('./routes/Infrastructure/BareMetalAssets/BareMetalAssetsPage'))
const AnsibleAutomationsPage = lazy(() => import('./routes/Infrastructure/Automations/AnsibleAutomations'))
const InfraEnvironmentsPage = lazy(() => import('./routes/Infrastructure/InfraEnvironments/InfraEnvironmentsPage'))
const CreateInfraEnv = lazy(() => import('./routes/Infrastructure/InfraEnvironments/CreateInfraEnv'))
const InfraEnvironmentDetailsPage = lazy(
    () => import('./routes/Infrastructure/InfraEnvironments/Details/InfraEnvironmentDetailsPage')
)

const GovernancePage = lazy(() => import('./routes/Governance/Governance'))
const WelcomePage = lazy(() => import('./routes/Home/Welcome/Welcome'))

interface IRoute {
    type: 'route'
    route: NavigationPath
    title: string
    component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any> | undefined
}

interface IRouteGroup {
    type: 'group'
    title: string
    routes: IRoute[]
}

export default function App() {
    const routes: (IRoute | IRouteGroup)[] = useMemo(
        () => [
            {
                title: 'Home',
                type: 'group',
                routes: [
                    {
                        title: 'Welcome',
                        type: 'route',
                        route: NavigationPath.welcome,
                        component: WelcomePage,
                    },
                    // {
                    //     title: 'Overview',
                    //     type: 'route',
                    //     route: NavigationPath.overview,
                    //     component: OverviewPage,
                    // },
                ],
            },
            {
                title: 'Infrastructure',
                type: 'group',
                routes: [
                    {
                        title: 'Clusters',
                        type: 'route',
                        route: NavigationPath.clusters,
                        component: ClusterManagementPage,
                    },
                    {
                        title: 'Bare metal assets',
                        type: 'route',
                        route: NavigationPath.bareMetalAssets,
                        component: BareMetalAssetsPage,
                    },
                    {
                        title: 'Automation',
                        type: 'route',
                        route: NavigationPath.ansibleAutomations,
                        component: AnsibleAutomationsPage,
                    },
                    {
                        title: 'Infrastructure environments',
                        type: 'route',
                        route: NavigationPath.infraEnvironments,
                        component: InfraEnvironmentsPage,
                    },
                ],
            },
            {
                title: 'Applications',
                type: 'route',
                route: NavigationPath.applications,
                component: ApplicationsPage,
            },
            {
                title: 'Governance',
                type: 'route',
                route: NavigationPath.governance,
                component: GovernancePage,
            },

            {
                title: 'Credentials',
                type: 'route',
                route: NavigationPath.credentials,
                component: CredentialsPage,
            },
        ],
        []
    )

    return (
        <BrowserRouter>
            <Page
                header={<AppHeader />}
                sidebar={<AppSidebar routes={routes} />}
                isManagedSidebar
                defaultManagedSidebarIsOpen={true}
                style={{ height: '100vh' }}
            >
                <LoadData>
                    <AcmToastProvider>
                        <AcmToastGroup />
                        <AcmTablePaginationContextProvider localStorageKey="clusters">
                            <Suspense fallback={<LoadingPage />}>
                                <Switch>
                                    <Route path={NavigationPath.addCredentials} component={CredentialPage} />
                                    <Route path={NavigationPath.editCredentials} component={CredentialPage} />
                                    <Route path={NavigationPath.viewCredentials} component={CredentialPage} />

                                    <Route
                                        exact
                                        path={NavigationPath.addAnsibleAutomation}
                                        component={AnsibleAutomationFormPage}
                                    />
                                    <Route
                                        exact
                                        path={NavigationPath.editAnsibleAutomation}
                                        component={AnsibleAutomationFormPage}
                                    />
                                    <Route
                                        exact
                                        path={NavigationPath.editBareMetalAsset}
                                        component={CreateBareMetalAssetPage}
                                    />
                                    <Route
                                        exact
                                        path={NavigationPath.createBareMetalAsset}
                                        component={CreateBareMetalAssetPage}
                                    />
                                    <Route
                                        exact
                                        path={NavigationPath.infraEnvironmentDetails}
                                        component={InfraEnvironmentDetailsPage}
                                    />
                                    <Route exact path={NavigationPath.createInfraEnv} component={CreateInfraEnv} />

                                    {routes.map((route) =>
                                        route.type === 'group' ? (
                                            route.routes.map((route) => (
                                                <Route path={route.route} component={route.component} />
                                            ))
                                        ) : (
                                            <Route path={route.route} component={route.component} />
                                        )
                                    )}

                                    <Route path={NavigationPath.console} component={WelcomePage} />
                                    <Route path="*">
                                        <Redirect to={NavigationPath.console} />
                                    </Route>
                                </Switch>
                            </Suspense>
                        </AcmTablePaginationContextProvider>
                    </AcmToastProvider>
                </LoadData>
            </Page>
        </BrowserRouter>
    )
}

function AppHeader() {
    return (
        <PageHeader
            logo={
                <div style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
                    <RedHatIcon size="lg" style={{ color: '#EE0000', marginTop: -8 }} />
                    <div style={{ color: 'white' }}>
                        <Title headingLevel="h4" style={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                            Red Hat
                        </Title>
                        <Title headingLevel="h3" style={{ fontWeight: 'lighter', lineHeight: 1.2 }}>
                            Advanced Cluster Management for Kubernetes
                        </Title>
                    </div>
                </div>
            }
            showNavToggle
        />
    )
}

function AppSidebar(props: { routes: (IRoute | IRouteGroup)[] }) {
    const { routes } = props
    const location = useLocation()
    const [open, setOpen] = useState(false)
    const dropdownItems = [
        <DropdownItem key="cluster-management">Cluster Management</DropdownItem>,
        <DropdownItem key="administrator">Administrator</DropdownItem>,
        <DropdownItem key="developer">Developer</DropdownItem>,
    ]
    const onToggle = useCallback(() => {
        setOpen((open) => !open)
    }, [])
    const onSelect = useCallback(() => {
        setOpen((open) => !open)
    }, [])
    return (
        <PageSidebar
            nav={
                <Fragment>
                    <Nav>
                        <NavItemSeparator style={{ margin: 0 }} />
                    </Nav>
                    <PageSection variant="dark" style={{ paddingLeft: 8, paddingRight: 8 }}>
                        <Dropdown
                            isPlain
                            onSelect={onSelect}
                            toggle={
                                <DropdownToggle id="toggle-id" onToggle={onToggle}>
                                    Cluster Management
                                </DropdownToggle>
                            }
                            isOpen={open}
                            dropdownItems={dropdownItems}
                            width="100%"
                        />
                    </PageSection>
                    <Nav>
                        <NavItemSeparator style={{ marginTop: 0 }} />
                        <NavList>
                            {routes.map((route) =>
                                route.type === 'group' ? (
                                    <NavExpandable
                                        title={route.title}
                                        isExpanded
                                        isActive={!!route.routes.find((route) => location.pathname === route.route)}
                                    >
                                        {route.routes.map((route) => (
                                            <NavItem key={route.route} isActive={location.pathname === route.route}>
                                                <Link to={route.route}>{route.title}</Link>
                                            </NavItem>
                                        ))}
                                    </NavExpandable>
                                ) : (
                                    <NavItem key={route.route} isActive={location.pathname === route.route}>
                                        <Link to={route.route}>{route.title}</Link>
                                    </NavItem>
                                )
                            )}
                        </NavList>
                    </Nav>
                </Fragment>
            }
            className="sidebar"
        />
    )
}
