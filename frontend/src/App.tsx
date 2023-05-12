/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { useMediaQuery } from '@mui/material'
import {
  ApplicationLauncher,
  ApplicationLauncherItem,
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
  Title,
} from '@patternfly/react-core'
import { CaretDownIcon } from '@patternfly/react-icons'
import { AcmTablePaginationContextProvider, AcmToastGroup, AcmToastProvider } from './ui-components'
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Redirect, Route, RouteComponentProps, Switch, useLocation } from 'react-router-dom'
import './App.css'
import { logout } from './logout'
import { LoadingPage } from './components/LoadingPage'
import { configure } from './lib/configure'
import './lib/test-shots'
import './lib/i18n'
import { getUsername } from './lib/username'
import { NavigationPath } from './NavigationPath'
import { setLightTheme, ThemeSwitcher } from './theme'
import { usePluginDataContextValue } from './lib/PluginDataContext'
import { PluginDataContextProvider } from './components/PluginDataContextProvider'
import { LoadPluginData } from './components/LoadPluginData'
import { Truncate } from './components/Truncate'
import { ResourceError, ResourceErrorCode } from './resources'

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
        if (!(error instanceof ResourceError) || error.code !== ResourceErrorCode.RequestAborted) {
          // eslint-disable-next-line no-console
          console.error(error)
          setName('undefined')
        }
      })
    return resp.abort
  }, [])

  return (
    <span className="pf-c-dropdown__toggle">
      <span data-test="username">{name}</span>
      <CaretDownIcon className="pf-c-dropdown__toggle-icon" />
    </span>
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

  const pluginDataContextValue = usePluginDataContextValue()

  return (
    <PluginDataContextProvider value={pluginDataContextValue}>
      <BrowserRouter>
        <Page
          header={<AppHeader />}
          sidebar={<AppSidebar routes={routes} />}
          isManagedSidebar
          defaultManagedSidebarIsOpen={true}
          style={{ height: '100vh' }}
        >
          <LoadPluginData>
            <AcmToastProvider>
              <AcmToastGroup />
              <AcmTablePaginationContextProvider localStorageKey="clusters">
                <Suspense fallback={<LoadingPage />}>
                  <Switch>
                    {routes.map((route) =>
                      route.type === 'group' ? (
                        route.routes.map((route) => (
                          <Route key={route.title} path={route.route} component={route.component} />
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
          </LoadPluginData>
        </Page>
      </BrowserRouter>
    </PluginDataContextProvider>
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
          <div style={{ color: 'white' }}>
            <Title headingLevel="h4" style={{ fontWeight: 'bold', lineHeight: 1.2 }}>
              @stolostron/console
            </Title>
            <Title headingLevel="h3" style={{ fontWeight: 'lighter', lineHeight: 1.2 }}>
              <Truncate content="Development Console" />
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
  return (
    <PageSidebar
      nav={
        <Nav>
          <NavList>
            {routes.map((route) =>
              route.type === 'group' ? (
                <NavExpandable
                  key={route.title}
                  title={route.title}
                  isExpanded
                  isActive={!!route.routes.find((route) => location.pathname.startsWith(route.route))}
                >
                  {route.routes.map((route) => (
                    <NavItem key={route.route} isActive={location.pathname.startsWith(route.route)}>
                      <Link to={route.route}>{route.title}</Link>
                    </NavItem>
                  ))}
                </NavExpandable>
              ) : (
                <NavItem key={route.route} isActive={location.pathname.startsWith(route.route)}>
                  <Link to={route.route}>{route.title}</Link>
                </NavItem>
              )
            )}
          </NavList>
        </Nav>
      }
    />
  )
}
