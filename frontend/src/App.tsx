/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { useMediaQuery } from '@mui/material'
import { Nav, NavExpandable, NavItem, NavList, Page, PageSidebar, Title, PageSidebarBody } from '@patternfly/react-core'
import {
  ApplicationLauncher,
  ApplicationLauncherItem,
  PageHeader,
  PageHeaderTools,
  PageHeaderToolsGroup,
  PageHeaderToolsItem,
} from '@patternfly/react-core/deprecated'
import { CaretDownIcon } from '@patternfly/react-icons'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React, { lazy, ReactNode, Suspense, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom-v5-compat'
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
import { createRoutePathFunction, MatchType, NavigationPath } from './NavigationPath'
import { ResourceError, ResourceErrorCode } from './resources/utils'
import { setLightTheme, ThemeSwitcher } from './theme'
import { AcmTablePaginationContextProvider, AcmToastGroup, AcmToastProvider } from './ui-components'

// HOME
const WelcomePage = lazy(() => import('./routes/Home/Welcome/Welcome'))
const OverviewPage = lazy(() => import('./routes/Home/Overview/Overview'))
const Search = lazy(() => import('./routes/Search/Search'))

// INFRASTRUCTURE
const Clusters = lazy(() => import('./routes/Infrastructure/Clusters/Clusters'))
const Automations = lazy(() => import('./routes/Infrastructure/Automations/Automations'))
const InfraEnvironments = lazy(() => import('./routes/Infrastructure/InfraEnvironments/InfraEnvironments'))
const VirtualMachines = lazy(() => import('./routes/Infrastructure/VirtualMachines/VirtualMachines'))

// GOVERNANCEjkjhkl
const Governance = lazy(() => import('./routes/Governance/Governance'))

// APPLICATIONS
const Applications = lazy(() => import('./routes/Applications/Applications'))

// CREDENTIALS
const Credentials = lazy(() => import('./routes/Credentials/Credentials'))

interface IRoute {
  type: 'route'
  path: NavigationPath
  match: MatchType
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
        setName(payload.body.username ?? 'undefined')
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
    <span className="pf-v5-c-dropdown__toggle">
      <span data-test="username">{name}</span>
      <CaretDownIcon className="pf-v5-c-dropdown__toggle-icon" />
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

const routes: (IRoute | IRouteGroup)[] = [
  {
    title: 'Home',
    type: 'group',
    routes: [
      {
        title: 'Welcome',
        type: 'route',
        path: NavigationPath.welcome,
        match: MatchType.Exact,
        element: <WelcomePage />,
      },
      {
        title: 'Overview',
        type: 'route',
        path: NavigationPath.overview,
        match: MatchType.SubRoutes,
        element: <OverviewPage />,
      },
    ],
  },
  {
    title: 'Search',
    type: 'route',
    path: NavigationPath.search,
    match: MatchType.SubRoutes,
    element: <Search />,
  },
  {
    title: 'Infrastructure',
    type: 'group',
    routes: [
      {
        title: 'Clusters',
        type: 'route',
        path: NavigationPath.clusters,
        match: MatchType.SubRoutes,
        element: <Clusters />,
      },
      {
        title: 'Automation',
        type: 'route',
        path: NavigationPath.ansibleAutomations,
        match: MatchType.SubRoutes,
        element: <Automations />,
      },
      {
        title: 'Host inventory',
        type: 'route',
        path: NavigationPath.infraEnvironments,
        match: MatchType.SubRoutes,
        element: <InfraEnvironments />,
      },
      {
        title: 'Virtual machines',
        type: 'route',
        path: NavigationPath.virtualMachines,
        match: MatchType.SubRoutes,
        element: <VirtualMachines />,
      },
    ],
  },
  {
    title: 'Applications',
    type: 'route',
    path: NavigationPath.applications,
    match: MatchType.SubRoutes,
    element: <Applications />,
  },
  {
    title: 'Governance',
    type: 'route',
    path: NavigationPath.governance,
    match: MatchType.SubRoutes,
    element: <Governance />,
  },

  {
    title: 'Credentials',
    type: 'route',
    path: NavigationPath.credentials,
    match: MatchType.SubRoutes,
    element: <Credentials />,
  },
]

const absolutePath = createRoutePathFunction(NavigationPath.emptyPath)

function mapRoutes(routes: (IRoute | IRouteGroup)[]): ReactNode[] {
  return routes.map((route) => {
    if (route.type === 'group') {
      return mapRoutes(route.routes)
    } else {
      const { title, path, match, element } = route
      return <Route key={title} path={absolutePath(path, match)} element={element} />
    }
  })
}

export default function App() {
  // Enforce light mode for standalone
  useLayoutEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      setLightTheme(true)
    }
  }, [])

  const pluginDataContextValue = usePluginDataContextValue()

  const mappedRoutes = useMemo(() => mapRoutes(routes), [])

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
                  <Routes>
                    {mappedRoutes}
                    <Route path="*" element={<Navigate to={NavigationPath.welcome} replace />} />
                  </Routes>
                </Suspense>
              </AcmTablePaginationContextProvider>
            </AcmToastProvider>
          </LoadPluginData>
        </Page>
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" panelPosition="bottom" />
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
    <PageSidebar>
      <PageSidebarBody>
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
      </PageSidebarBody>
    </PageSidebar>
  )
}
