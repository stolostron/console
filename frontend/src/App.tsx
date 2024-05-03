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
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom-v5-compat'
import './App.css'
import { LoadingPage } from './components/LoadingPage'
import { LoadPluginData } from './components/LoadPluginData'
import { PluginDataContextProvider } from './components/PluginDataContextProvider'
import { Truncate } from './components/Truncate'
import { configure } from './lib/configure'
import './lib/i18n'
import { usePluginDataContextValue } from './lib/PluginDataContext'
import './lib/test-shots'
import { getUsername } from './lib/username'
import { logout } from './logout'
import { NavigationPath } from './NavigationPath'
import { ResourceError, ResourceErrorCode } from './resources'
import { setLightTheme, ThemeSwitcher } from './theme'
import { AcmTablePaginationContextProvider, AcmToastGroup, AcmToastProvider } from './ui-components'

// HOME
const WelcomePage = lazy(() => import('./routes/Home/Welcome/Welcome'))
const OverviewPage = lazy(() => import('./routes/Home/Overview/Overview'))
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
  path: string
  title: string
  element: React.ReactNode
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
            path: NavigationPath.welcome,
            element: <WelcomePage />,
          },
          {
            title: 'Overview',
            type: 'route',
            path: NavigationPath.overview,
            element: <OverviewPage />,
          },
          {
            title: 'Search',
            type: 'route',
            path: NavigationPath.search,
            element: <Search />,
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
            path: NavigationPath.clusters,
            element: <Clusters />,
          },
          {
            title: 'Automation',
            type: 'route',
            path: NavigationPath.ansibleAutomations,
            element: <Automations />,
          },
          {
            title: 'Host inventory',
            type: 'route',
            path: NavigationPath.infraEnvironments,
            element: <InfraEnvironments />,
          },
        ],
      },
      {
        title: 'Applications',
        type: 'route',
        path: NavigationPath.applications,
        element: <Applications />,
      },
      {
        title: 'Governance',
        type: 'route',
        path: NavigationPath.governance,
        element: <Governance />,
      },

      {
        title: 'Credentials',
        type: 'route',
        path: NavigationPath.credentials,
        element: <Credentials />,
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
                <Routes>
                  {routes.map((route) =>
                    route.type === 'group' ? (
                      route.routes.map((route) => (
                        <Route key={route.title} path={route.path + '/*'} element={route.element} />
                      ))
                    ) : (
                      <Route key={route.title} path={route.path + '/*'} element={route.element} />
                    )
                  )}
                  <Route path="*" element={<Navigate to={NavigationPath.welcome} replace />} />
                </Routes>
              </Suspense>
            </AcmTablePaginationContextProvider>
          </AcmToastProvider>
        </LoadPluginData>
      </Page>
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
                  isActive={!!route.routes.find((route) => location.pathname.startsWith(route.path))}
                >
                  {route.routes.map((route) => (
                    <NavItem key={route.path} isActive={location.pathname.startsWith(route.path)}>
                      <Link to={route.path}>{route.title}</Link>
                    </NavItem>
                  ))}
                </NavExpandable>
              ) : (
                <NavItem key={route.path} isActive={location.pathname.startsWith(route.path)}>
                  <Link to={route.path}>{route.title}</Link>
                </NavItem>
              )
            )}
          </NavList>
        </Nav>
      }
    />
  )
}
