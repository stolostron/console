/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { useMediaQuery } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { getBackendUrl, listMultiClusterHubs } from './resources'
import { getApplinks, IAppSwitcherData } from './lib/applinks'
import { configure } from './lib/configure'
import { getUsername } from './lib/username'
import {
    AcmIcon,
    AcmIconVariant,
    AcmTablePaginationContextProvider,
    AcmToastGroup,
    AcmToastProvider,
} from '@stolostron/ui-components'
import {
    AboutModal,
    ApplicationLauncher,
    ApplicationLauncherGroup,
    ApplicationLauncherSeparator,
    ApplicationLauncherItem,
    Button,
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
    PageHeaderTools,
    PageHeaderToolsGroup,
    PageHeaderToolsItem,
    PageSection,
    PageSidebar,
    Spinner,
    TextContent,
    TextList,
    TextListItem,
    Title,
} from '@patternfly/react-core'
import { CaretDownIcon, OpenshiftIcon, PlusCircleIcon, QuestionCircleIcon, RedhatIcon } from '@patternfly/react-icons'
import logo from './assets/RHACM-Logo.svg'
import { Fragment, lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Redirect, Route, RouteComponentProps, Switch, useLocation } from 'react-router-dom'
import './App.css'
import { LoadData } from './atoms'
import { LoadingPage } from './components/LoadingPage'
import './lib/i18n'
import { NavigationPath } from './NavigationPath'

// HOME
const WelcomePage = lazy(() => import('./routes/Home/Welcome/Welcome'))
const OverviewPage = lazy(() => import('./routes/Home/Overview/OverviewPage'))
const Search = lazy(() => import('./routes/Home/Search/Search'))

// INFRASTRUCTURE
const Clusters = lazy(() => import('./routes/Infrastructure/Clusters/Clusters'))
const BareMetalAssets = lazy(() => import('./routes/Infrastructure/BareMetalAssets/BareMetalAssets'))
const Automations = lazy(() => import('./routes/Infrastructure/Automations/Automations'))
const InfraEnvironments = lazy(() => import('./routes/Infrastructure/InfraEnvironments/InfraEnvironments'))

// GOVERNANCE
const Governance = lazy(() => import('./routes/Governance/Governance'))

// APPLICATIONS
const Applications = lazy(() => import('./routes/Applications/Applications'))

// CREDENTIALS
const Credentials = lazy(() => import('./routes/Credentials/Credentials'))

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

function api<T>(url: string, headers?: Record<string, unknown>): Promise<T> {
    return fetch(url, headers).then((response) => {
        if (!response.ok) {
            throw new Error(response.statusText)
        }
        return response.json() as Promise<T>
    })
}

function apiNoJSON(url: string, headers?: Record<string, unknown>): Promise<unknown> {
    return fetch(url, headers).then((response) => {
        if (!response.ok) {
            throw new Error(response.statusText)
        }
        return response.text() as Promise<unknown>
    })
}

function launchToOCP(urlSuffix: string) {
    api<{ data: { consoleURL: string } }>(
        '/multicloud/api/v1/namespaces/openshift-config-managed/configmaps/console-public/'
    )
        .then(({ data }) => {
            window.open(`${data.consoleURL}/${urlSuffix}`)
        })
        .catch((error) => {
            // eslint-disable-next-line no-console
            console.error(error)
        })
}

function checkOCPVersion(switcherExists: (arg0: boolean) => void) {
    if (process.env.NODE_ENV === 'test') return
    api<{ gitVersion: string }>('/multicloud/version/')
        .then(({ gitVersion }) => {
            if (parseFloat(gitVersion.substr(1, 4)) >= 1.2) {
                switcherExists(true)
            } else {
                switcherExists(false)
            }
        })
        .catch((error) => {
            // eslint-disable-next-line no-console
            console.error(error)
            switcherExists(false)
        })
}

function UserDropdownToggle() {
    const [name, setName] = useState<string>('loading...')

    useEffect(() => {
        // Get the username from the console backend
        const resp = getUsername()
        resp.promise
            .then((payload) => {
                payload && payload.body && payload.body.username ? setName(payload.body.username) : setName('undefined')
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.error(error)
                setName('undefined')
            })
    }, [])

    return (
        <span className="pf-c-dropdown__toggle">
            <span className="co-username" data-test="username">
                {name}
            </span>
            <CaretDownIcon className="pf-c-dropdown__toggle-icon" />
        </span>
    )
}

type AboutDropdownProps = {
    aboutClick: () => void
}
function AboutDropdown(props: AboutDropdownProps) {
    const [aboutDDIsOpen, aboutDDSetOpen] = useState<boolean>(false)

    function DocsButton() {
        return (
            <ApplicationLauncherItem href="https://access.redhat.com/documentation/en-us/red_hat_advanced_cluster_management_for_kubernetes/2.4/">
                Documentation
            </ApplicationLauncherItem>
        )
    }
    function AboutButton() {
        return (
            <ApplicationLauncherItem component="button" onClick={() => props.aboutClick()}>
                About
            </ApplicationLauncherItem>
        )
    }

    return (
        <ApplicationLauncher
            aria-label="about-menu"
            data-test="about-dropdown"
            className="co-app-launcher co-about-menu"
            onSelect={() => aboutDDSetOpen(false)}
            onToggle={() => aboutDDSetOpen(!aboutDDIsOpen)}
            isOpen={aboutDDIsOpen}
            items={[<DocsButton key="docs" />, <AboutButton key="about_modal_button" />]}
            data-quickstart-id="qs-masthead-helpmenu"
            position="right"
            toggleIcon={<QuestionCircleIcon style={{ color: '#EDEDED' }} />}
        />
    )
}

function UserDropdown() {
    const [userIsOpen, userSetOpen] = useState<boolean>(false)

    function configureClient() {
        // Get the user token endpoint from the console backend to launch to the OCP Display Token page
        const resp = configure()
        resp.promise
            .then((payload) => {
                payload && payload.token_endpoint ? window.open(`${payload.token_endpoint}/request`, '_blank') : ''
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.error(error)
            })
    }

    function logout() {
        console.log('***** starting logout function')
        // Get username so we know if user is kube:admin
        let admin = false
        const userResp = getUsername()
        userResp.promise
            .then((payload) => {
                if (payload && payload.body && payload.body.username) {
                    admin = payload.body.username === 'kube:admin'
                }
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.error(error)
            })
        // Get user's oauth token endpoint
        let oauthTokenEndpoint = ''
        const configResp = configure()
        configResp.promise
            .then((payload) => {
                payload && payload.token_endpoint ? (oauthTokenEndpoint = payload.token_endpoint) : ''
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.error(error)
            })
        const logoutUrl = getBackendUrl() + '/logout'
        console.log(location.href)
        console.log(location.origin)
        apiNoJSON(logoutUrl)
            .then(() => {
                const onLogout = (delay = 0, isAdmin = false) => {
                    return setTimeout(() => {
                        // location.assign(getBackendUrl() + '/login')
                        // location.assign('https://multicloud-console.apps.cs-aws-410-hr4pw.dev02.red-chesterfield.com/')
                        console.log('======Logout> ' + isAdmin + ' <=====')
                        isAdmin ? (location.pathname = '/') : location.reload()
                        // location.reload(true)
                        // location.assign(href)
                    }, delay)
                }
                console.log('****** admin flag=')
                console.dir(admin)
                console.log('****** end debug')
                if (admin) {
                    // strip the oauthTokenEndpoint back to just the domain host to create the oauth logout endpoint
                    const adminLogoutPath = oauthTokenEndpoint.substring(0, oauthTokenEndpoint.length - 12) + '/logout'
                    console.log('>****** kube:admin logout url')
                    console.log(adminLogoutPath)
                    console.log('<*******')
                    const form = document.createElement('form')
                    form.target = 'hidden-form'
                    form.method = 'POST'
                    form.action = adminLogoutPath
                    const iframe = document.createElement('iframe')
                    iframe.setAttribute('type', 'hidden')
                    iframe.name = 'hidden-form'
                    iframe.onload = () => onLogout(500, admin)
                    document.body.appendChild(iframe)

                    // const input = document.createElement('input')
                    // input.type = 'hidden'
                    // input.name = 'then'
                    // input.value = location.origin + '/'
                    // form.appendChild(input)
                    document.body.appendChild(form)
                    form.submit()
                } else {
                    onLogout(500, admin)
                }
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.error(error)
            })
    }

    function LogoutButton() {
        return (
            <ApplicationLauncherItem component="button" id="logout" onClick={() => logout()}>
                Logout
            </ApplicationLauncherItem>
        )
    }
    function ConfigureButton() {
        return (
            <ApplicationLauncherItem component="button" id="configure" onClick={() => configureClient()}>
                Configure client
            </ApplicationLauncherItem>
        )
    }

    return (
        <ApplicationLauncher
            aria-label="user-menu"
            data-test="user-dropdown"
            className="co-app-launcher co-user-menu"
            onSelect={() => userSetOpen(false)}
            onToggle={() => userSetOpen(!userIsOpen)}
            isOpen={userIsOpen}
            items={[<ConfigureButton key="user_configure" />, <LogoutButton key="user_logout" />]}
            data-quickstart-id="qs-masthead-usermenu"
            position="right"
            toggleIcon={<UserDropdownToggle />}
        />
    )
}

function AboutModalVersion() {
    const [version, setVersion] = useState<string>('undefined')

    useEffect(() => {
        const mchs = listMultiClusterHubs()
        mchs.promise
            .then((hubs) => {
                hubs.length > 0 ? setVersion(hubs[0].status.currentVersion) : setVersion('undefined')
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.error(error)
                setVersion('undefined')
            })
    }, [])

    return <span className="version-details__no">{version === 'undefined' ? <Spinner size="md" /> : version}</span>
}

function AboutContent() {
    return (
        <TextContent>
            <TextList component="dl">
                <TextListItem component="dt">ACM Version</TextListItem>
                <TextListItem component="dd">
                    <AboutModalVersion />
                </TextListItem>
            </TextList>
        </TextContent>
    )
}

const useStyles = makeStyles({
    about: {
        height: 'min-content',
    },
})

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
                    {
                        title: 'Overview',
                        type: 'route',
                        route: NavigationPath.overview,
                        component: OverviewPage,
                    },
                    {
                        title: 'Search',
                        type: 'route',
                        route: NavigationPath.search,
                        component: Search,
                    },
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
                        component: Clusters,
                    },
                    {
                        title: 'Bare metal assets',
                        type: 'route',
                        route: NavigationPath.bareMetalAssets,
                        component: BareMetalAssets,
                    },
                    {
                        title: 'Automation',
                        type: 'route',
                        route: NavigationPath.ansibleAutomations,
                        component: Automations,
                    },
                    {
                        title: 'Infrastructure environments',
                        type: 'route',
                        route: NavigationPath.infraEnvironments,
                        component: InfraEnvironments,
                    },
                ],
            },
            {
                title: 'Applications',
                type: 'route',
                route: NavigationPath.applications,
                component: Applications,
            },
            {
                title: 'Governance',
                type: 'route',
                route: NavigationPath.governance,
                component: Governance,
            },

            {
                title: 'Credentials',
                type: 'route',
                route: NavigationPath.credentials,
                component: Credentials,
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
                                    {routes.map((route) =>
                                        route.type === 'group' ? (
                                            route.routes.map((route) => (
                                                <Route path={route.route} component={route.component} />
                                            ))
                                        ) : (
                                            <Route path={route.route} component={route.component} />
                                        )
                                    )}
                                    <Route path="*">
                                        <Redirect to={NavigationPath.welcome} />
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
    const isFullWidthPage = useMediaQuery('(min-width: 1200px)', { noSsr: true })
    const [isNavOpen, setNavOpen] = useState(window?.localStorage?.getItem('isNavOpen') !== 'false')
    useEffect(() => {
        if (!isFullWidthPage) {
            setNavOpen(false)
        } else {
            if (window?.localStorage?.getItem('isNavOpen') !== 'false') {
                setNavOpen(true)
            }
        }
    }, [isFullWidthPage])
    const [aboutModalOpen, setAboutModalOpen] = useState<boolean>(false)
    const [appSwitcherExists, setAppSwitcherExists] = useState<boolean>(true)

    const classes = useStyles()

    function OCPButton() {
        return (
            <ApplicationLauncherItem
                key="ocp_launch"
                isExternal
                icon={<OpenshiftIcon style={{ color: '#EE0000' }} />}
                component="button"
                onClick={() => launchToOCP('')}
            >
                Red Hat Openshift Container Platform
            </ApplicationLauncherItem>
        )
    }

    function AppSwitcherTopBar() {
        const [extraItems, setExtraItems] = useState<Record<string, [IAppSwitcherData]>>({})
        const [appSwitcherOpen, setAppSwitcherOpen] = useState<boolean>(false)

        useEffect(() => {
            const appLinks = getApplinks()
            appLinks.promise
                .then((payload) => {
                    setExtraItems(payload.data)
                })
                .catch((error) => {
                    // eslint-disable-next-line no-console
                    console.error(error)
                    setExtraItems({})
                })
        }, [])

        const extraMenuItems = []
        let count = 0
        for (const section in extraItems) {
            extraMenuItems.push(
                <ApplicationLauncherGroup label={section} key={section}>
                    {extraItems[section].map((sectionItem) => (
                        <ApplicationLauncherItem
                            key={sectionItem.name + '-launcher'}
                            isExternal
                            icon={<img src={sectionItem.icon} />}
                            component="button"
                            onClick={() => window.open(sectionItem.url, '_blank')}
                        >
                            {sectionItem.name}
                        </ApplicationLauncherItem>
                    ))}
                    {count < Object.keys(extraItems).length - 1 && <ApplicationLauncherSeparator key="separator" />}
                </ApplicationLauncherGroup>
            )
            count = count + 1
        }
        return (
            <ApplicationLauncher
                hidden={appSwitcherExists}
                aria-label="app-menu"
                data-test="app-dropdown"
                className="co-app-launcher co-app-menu"
                onSelect={() => setAppSwitcherOpen(false)}
                onToggle={() => setAppSwitcherOpen(!appSwitcherOpen)}
                isOpen={appSwitcherOpen}
                items={[
                    <ApplicationLauncherGroup label="Red Hat applications" key="ocp-group">
                        <OCPButton />
                        <ApplicationLauncherItem
                            key="app_launch"
                            isExternal
                            icon={<AcmIcon icon={AcmIconVariant.redhat} />}
                            component="button"
                            onClick={() => window.open('https://cloud.redhat.com/openshift/', '_blank')}
                        >
                            Openshift Cluster Manager
                        </ApplicationLauncherItem>
                        {Object.keys(extraItems).length > 0 && <ApplicationLauncherSeparator key="separator" />}
                    </ApplicationLauncherGroup>,
                    ...extraMenuItems,
                ]}
                data-quickstart-id="qs-masthead-appmenu"
                position="right"
                style={{ verticalAlign: '0.125em' }}
            />
        )
    }

    useEffect(() => {
        checkOCPVersion(setAppSwitcherExists)
    }, [])

    const headerTools = (
        <PageHeaderTools>
            <PageHeaderToolsGroup
                visibility={{
                    default: 'hidden',
                    lg: 'visible',
                }}
            >
                <PageHeaderToolsItem>
                    <AppSwitcherTopBar></AppSwitcherTopBar>
                    <Button
                        aria-label="create-button"
                        onClick={() => launchToOCP('k8s/all-namespaces/import')}
                        variant="link"
                        icon={<PlusCircleIcon style={{ color: '#EDEDED' }} />}
                    />
                    <AboutDropdown aboutClick={() => setAboutModalOpen(!aboutModalOpen)} />
                    <AboutModal
                        isOpen={aboutModalOpen}
                        onClose={() => setAboutModalOpen(!aboutModalOpen)}
                        brandImageSrc={logo}
                        brandImageAlt="ACM logo"
                        className={classes.about}
                    >
                        <AboutContent />
                    </AboutModal>
                </PageHeaderToolsItem>
            </PageHeaderToolsGroup>
            <PageHeaderToolsGroup>
                <PageHeaderToolsItem>
                    <UserDropdown />
                </PageHeaderToolsItem>
            </PageHeaderToolsGroup>
        </PageHeaderTools>
    )

    return (
        <PageHeader
            logo={
                <div style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
                    <RedhatIcon size="lg" style={{ color: '#EE0000', marginTop: -8 }} />
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
            headerTools={headerTools}
            showNavToggle
            isNavOpen={isNavOpen}
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
                                        key={route.title}
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
