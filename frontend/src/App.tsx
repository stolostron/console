/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { useMediaQuery } from '@mui/material'
import {
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  Page,
  PageSidebar,
  Title,
  PageSidebarBody,
  Dropdown,
  MenuToggleElement,
  MenuToggle,
  DropdownItem,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadToggle,
  PageToggleButton,
  Flex,
} from '@patternfly/react-core'
import { BarsIcon, CaretDownIcon } from '@patternfly/react-icons'
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
import { isRequestAbortedError } from './resources/utils'
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

// GOVERNANCE
const Governance = lazy(() => import('./routes/Governance/Governance'))

// APPLICATIONS
const Applications = lazy(() => import('./routes/Applications/Applications'))

// CREDENTIALS
const Credentials = lazy(() => import('./routes/Credentials/Credentials'))

// ACCESS CONTROL
const AccessControlManagement = lazy(() => import('./routes/AccessControlManagement/AccessControlManagement'))

// IDENTITIES & ROLES
const IdentitiesManagement = lazy(() => import('./routes/UserManagement/Identities/IdentitiesManagement'))
const RolesManagement = lazy(() => import('./routes/UserManagement/Roles/RolesManagement'))

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

function UserDropdown() {
  const [userIsOpen, userSetOpen] = useState<boolean>(false)
  const [name, setName] = useState<string>('loading...')
  useEffect(() => {
    // Get the username from the console backend
    const resp = getUsername()
    resp.promise
      .then((payload) => {
        setName(payload.body.username ?? 'undefined')
      })
      .catch((error) => {
        if (!isRequestAbortedError(error)) {
          setName('undefined')
        }
      })
    return resp.abort
  }, [])

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

  return (
    <Dropdown
      aria-label="user-menu"
      data-test="user-dropdown"
      data-quickstart-id="qs-masthead-usermenu"
      onSelect={() => userSetOpen(false)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => {
            userSetOpen(!userIsOpen)
          }}
          variant="plain"
          isExpanded={userIsOpen}
        >
          <span className="pf-v5-c-dropdown__toggle">
            <span data-test="username">{name}</span>
            <CaretDownIcon className="pf-v5-c-dropdown__toggle-icon" />
          </span>
        </MenuToggle>
      )}
      isOpen={userIsOpen}
      isPlain={true}
    >
      <DropdownItem key="user_configure" onClick={configureClient}>
        Configure client
      </DropdownItem>
      <DropdownItem key="user_logout" onClick={logout}>
        Logout
      </DropdownItem>
    </Dropdown>
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
  {
    title: 'Access control',
    type: 'route',
    path: NavigationPath.accessControlManagement,
    match: MatchType.SubRoutes,
    element: <AccessControlManagement />,
  },
  {
    title: 'User Management',
    type: 'group',
    routes: [
      {
        title: 'Roles',
        type: 'route',
        path: NavigationPath.roles,
        match: MatchType.SubRoutes,
        element: <RolesManagement />,
      },
      {
        title: 'Identities',
        type: 'route',
        path: NavigationPath.identities,
        match: MatchType.SubRoutes,
        element: <IdentitiesManagement />,
      },
    ],
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
  const toggleNav = () => {
    setNavOpen(!isNavOpen)
    window.localStorage.setItem('isNavOpen', String(isNavOpen))
  }
  useEffect(() => {
    if (!isFullWidthPage) {
      setNavOpen(false)
    } else {
      if (window?.localStorage?.getItem('isNavOpen') !== 'false') {
        setNavOpen(true)
      }
    }
  }, [isFullWidthPage])

  return (
    <Masthead style={{ gridTemplateColumns: '1fr auto' }}>
      <Flex>
        <MastheadToggle>
          <PageToggleButton
            variant="plain"
            aria-label="Global navigation"
            isSidebarOpen={isNavOpen}
            onSidebarToggle={toggleNav}
            id="vertical-nav-toggle"
          >
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadBrand>
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
        </MastheadBrand>
        <MastheadContent style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {process.env.NODE_ENV === 'development' && <ThemeSwitcher />}
          <UserDropdown />
        </MastheadContent>
      </Flex>
    </Masthead>
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
