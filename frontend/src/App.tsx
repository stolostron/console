/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { useMediaQuery } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import {
    AboutModal,
    ApplicationLauncher,
    ApplicationLauncherGroup,
    ApplicationLauncherItem,
    ApplicationLauncherSeparator,
    Button,
    Dropdown,
    DropdownItem,
    DropdownToggle,
    Nav,
    NavExpandable,
    NavItem,
    NavList,
    Page,
    PageHeader,
    PageHeaderTools,
    PageHeaderToolsGroup,
    PageHeaderToolsItem,
    PageSidebar,
    Spinner,
    TextContent,
    TextList,
    TextListItem,
    Title,
    Truncate,
} from '@patternfly/react-core'
import {
    CaretDownIcon,
    CodeIcon,
    CogsIcon,
    OpenshiftIcon,
    PlusCircleIcon,
    QuestionCircleIcon,
    RedhatIcon,
} from '@patternfly/react-icons'
import {
    AcmIcon,
    AcmIconVariant,
    AcmTablePaginationContextProvider,
    AcmToastGroup,
    AcmToastProvider,
} from './ui-components'
import { t } from 'i18next'
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Redirect, Route, RouteComponentProps, Switch, useLocation } from 'react-router-dom'
import './App.css'
import ACMPerspectiveIcon from './assets/ACM-icon.svg'
import logo from './assets/RHACM-Logo.svg?url'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { LoadData, logout } from './atoms'
import { LoadingPage } from './components/LoadingPage'
import { getApplinks, IAppSwitcherData } from './lib/applinks'
import { configure } from './lib/configure'
import { DOC_HOME } from './lib/doc-util'
import './lib/i18n'
import { getMCHVersion } from './lib/mchVersion'
import { getUsername } from './lib/username'
import { NavigationPath } from './NavigationPath'
import { setLightTheme, ThemeSwitcher } from './theme'
import { checkOCPVersion, launchToOCP } from './lib/ocp-utils'

// HOME
const WelcomePage = lazy(() => import('./routes/Home/Welcome/Welcome'))
const OverviewPage = lazy(() => import('./routes/Home/Overview/OverviewPage'))
const Search = lazy(() => import('./routes/Home/Search/Search'))

// INFRASTRUCTURE
const Clusters = lazy(() => import('./routes/Infrastructure/Clusters/Clusters'))
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
            <span data-test="username">{name}</span>
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
        return <ApplicationLauncherItem href={DOC_HOME}>Documentation</ApplicationLauncherItem>
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
            aria-label={t('About dropdown')}
            data-test="about-dropdown"
            onSelect={() => aboutDDSetOpen(false)}
            onToggle={() => aboutDDSetOpen(!aboutDDIsOpen)}
            isOpen={aboutDDIsOpen}
            items={[<DocsButton key="docs" />, <AboutButton key="about_modal_button" />]}
            data-quickstart-id="qs-masthead-helpmenu"
            position="right"
            toggleIcon={<QuestionCircleIcon />}
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
                if (payload && payload.token_endpoint) {
                    window.open(`${payload.token_endpoint}/request`, '_blank')
                }
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.error(error)
            })
    }

    function LogoutButton() {
        return (
            <ApplicationLauncherItem component="button" id="logout" onClick={logout}>
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
    const [version, setVersion] = useState<string | undefined>()

    useEffect(() => {
        getMCHVersion().promise.then((result) => setVersion(result?.mchVersion))
    }, [])

    return <span className="version-details__no">{version ? version : <Spinner size="md" />}</span>
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
    perspective: {
        // 'font-size': '$co-side-nav-font-size',
        // 'justify-content': 'space-between',
        width: '100%',
        padding: 0,
        color: 'var(--pf-global--Color--light-100)',
        minHeight: '24px',

        '& .pf-c-dropdown__toggle-icon': {
            // color: 'var(--pf-global--Color--light-100)',
            // 'font-size': '$co-side-nav-section-font-size',
            // 'margin-right': 'var(--pf-c-dropdown__toggle-icon--MarginRight)',
            // 'margin-left': 'var(--pf-c-dropdown__toggle-icon--MarginLeft)',
            // 'line-height': 'var(--pf-c-dropdown__toggle-icon--LineHeight)',
        },

        // '& .pf-c-dropdown__menu-item': {
        //     'padding-left': '7px',
        //     '& h2': {
        //         'font-size': '12px',
        //         'padding-left': '7px',
        //     },
        // },

        '& .pf-c-title': {
            // color: 'var(--pf-global--Color--light-100)',
            // 'font-family': 'var(--pf-global--FontFamily--sans-serif)',
            '& .oc-nav-header__icon': {
                'margin-right': 'var(--pf-global--spacer--sm)',
                'vertical-align': '-0.125em',
            },
            // '& h2': {
            //     'font-size': '$co-side-nav-section-font-size',
            // 'font-family': 'var(--pf-global--FontFamily--sans-serif)',
            // },
        },

        '&::before': {
            border: 'none',
        },
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
                        title: 'Automation',
                        type: 'route',
                        route: NavigationPath.ansibleAutomations,
                        component: Automations,
                    },
                    {
                        title: 'Host inventory',
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

    // Enforce light mode for standalone
    useLayoutEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            setLightTheme(true)
        }
    }, [])

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
                                                <Route
                                                    key={route.title}
                                                    path={route.route}
                                                    component={route.component}
                                                />
                                            ))
                                        ) : (
                                            <Route key={route.title} path={route.route} component={route.component} />
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
                onClick={() => launchToOCP('', true)}
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
                aria-label={t('Application menu')}
                data-test="app-dropdown"
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
                            onClick={() => window.open('https://console.redhat.com/openshift', '_blank')}
                        >
                            Openshift Cluster Manager
                        </ApplicationLauncherItem>
                        {Object.keys(extraItems).length > 0 && <ApplicationLauncherSeparator key="separator" />}
                    </ApplicationLauncherGroup>,
                    ...extraMenuItems,
                ]}
                data-quickstart-id="qs-masthead-appmenu"
                position="right"
                // style={{ verticalAlign: '0.125em' }}
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
                {process.env.NODE_ENV === 'development' && (
                    <PageHeaderToolsItem>
                        <ThemeSwitcher />
                    </PageHeaderToolsItem>
                )}
                <PageHeaderToolsItem>
                    <AppSwitcherTopBar />
                </PageHeaderToolsItem>
                <PageHeaderToolsItem>
                    <Button
                        aria-label={t('Add new resource')}
                        onClick={() => launchToOCP('k8s/all-namespaces/import', true)}
                        variant="plain"
                        icon={<PlusCircleIcon />}
                    />
                </PageHeaderToolsItem>
                <PageHeaderToolsItem>
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
                            <Truncate content="Advanced Cluster Management for Kubernetes" />
                        </Title>
                    </div>
                </div>
            }
            logoProps={{ style: { textDecoration: 'none', cursor: 'default' } }}
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
    const classes = useStyles()
    const dropdownItems = [
        <DropdownItem
            icon={<ACMPerspectiveIcon />}
            key="cluster-management"
            style={{ fontSize: 'smaller', fontWeight: 'bold' }}
        >
            Advanced Cluster Management
        </DropdownItem>,
        <DropdownItem
            icon={<CogsIcon />}
            key="administrator"
            onClick={() => launchToOCP('?perspective=admin', false)}
            style={{ fontSize: 'smaller', fontWeight: 'bold' }}
        >
            Administrator
        </DropdownItem>,
        <DropdownItem
            icon={<CodeIcon />}
            key="developer"
            onClick={() => launchToOCP('?perspective=dev', false)}
            style={{ fontSize: 'smaller', fontWeight: 'bold' }}
        >
            Developer
        </DropdownItem>,
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
                <Nav>
                    <NavList>
                        <NavItem>
                            <Dropdown
                                onSelect={onSelect}
                                toggle={
                                    <DropdownToggle
                                        id="toggle-id"
                                        onToggle={onToggle}
                                        className={classes.perspective}
                                        icon={<ACMPerspectiveIcon />}
                                        style={{ fontSize: 'small', backgroundColor: 'transparent' }}
                                    >
                                        Advanced Cluster Management
                                    </DropdownToggle>
                                }
                                isOpen={open}
                                dropdownItems={dropdownItems}
                                width="100%"
                            />
                        </NavItem>
                        {/* <NavItemSeparator style={{ marginTop: 0 }} /> */}
                        {routes.map((route) =>
                            route.type === 'group' ? (
                                <NavExpandable
                                    key={route.title}
                                    title={route.title}
                                    isExpanded
                                    isActive={!!route.routes.find((route) => location.pathname === route.route)}
                                >
                                    {route.routes.map((route) => (
                                        <NavItem key={route.route} isActive={location.pathname.startsWith(route.route)}>
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
            }
            // className="sidebar"
        />
    )
}
