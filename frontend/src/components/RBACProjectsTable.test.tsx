/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import i18next from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { RBACProjectsTable, ProjectTableData } from './RBACProjectsTable'
import type { RoleAssignmentHookType } from '../routes/UserManagement/RoleAssignments/hook/RoleAssignmentDataHook'
import { PluginContext, defaultPlugin } from '../lib/PluginContext'
import { PluginDataContext, defaultContext as pluginDataDefaultContext } from '../lib/PluginDataContext'
import { AcmTableStateProvider } from '../ui-components'

const baseRoleAssignmentData: RoleAssignmentHookType = {
  users: [],
  groups: [],
  serviceAccounts: [],
  roles: [],
  clusterSets: [],
  allClusterNames: [],
}

function createMockUseRoleAssignmentDataHook(data?: Partial<RoleAssignmentHookType>) {
  return () => ({
    roleAssignmentData: { ...baseRoleAssignmentData, ...data },
    isLoading: false,
    isUsersLoading: false,
    isGroupsLoading: false,
    isRolesLoading: false,
    isClusterSetLoading: false,
  })
}

const sampleProjects: ProjectTableData[] = [
  {
    name: 'alpha',
    type: 'Namespace',
    clusters: ['local-cluster'],
  },
  {
    name: 'beta',
    type: 'Namespace',
    clusters: ['local-cluster', 'dev-cluster'],
  },
]

const i18n = i18next.createInstance()
i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: {} } },
})

function renderProjectsTable(props: React.ComponentProps<typeof RBACProjectsTable>) {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <PluginContext.Provider value={defaultPlugin}>
          <PluginDataContext.Provider value={{ ...pluginDataDefaultContext, loadStarted: true, loadCompleted: true }}>
            <AcmTableStateProvider localStorageKey="test-table">
              <RBACProjectsTable {...props} />
            </AcmTableStateProvider>
          </PluginDataContext.Provider>
        </PluginContext.Provider>
      </I18nextProvider>
    </MemoryRouter>
  )
}

describe('RBACProjectsTable', () => {
  it('renders provided projects', async () => {
    renderProjectsTable({
      selectedClusters: ['local-cluster'],
      projects: sampleProjects,
      useRoleAssignmentDataHook: createMockUseRoleAssignmentDataHook(),
    })

    expect(await screen.findByText('alpha')).toBeInTheDocument()
    expect(screen.getByText('beta')).toBeInTheDocument()
  })

  it('fires selection callback when a row is selected', async () => {
    const onSelectionChange = jest.fn()
    renderProjectsTable({
      selectedClusters: ['local-cluster'],
      projects: sampleProjects,
      onSelectionChange,
      useRoleAssignmentDataHook: createMockUseRoleAssignmentDataHook(),
    })

    const checkboxes = await screen.findAllByRole('checkbox')
    await userEvent.click(checkboxes[1])

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalled()
    })

    const selected = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1][0]
    expect(selected).toEqual([sampleProjects[0]])
  })

  it('builds projects from common namespaces when no projects are provided', async () => {
    const mockHook = createMockUseRoleAssignmentDataHook({
      clusterSets: [
        {
          name: 'sample-set',
          clusters: [
            { name: 'local-cluster', namespaces: ['shared', 'alpha'] },
            { name: 'dev-cluster', namespaces: ['shared', 'beta'] },
          ],
        },
      ],
    })

    renderProjectsTable({
      selectedClusters: ['local-cluster', 'dev-cluster'],
      useRoleAssignmentDataHook: mockHook,
    })

    expect(await screen.findByText('shared')).toBeInTheDocument()
  })
})
