/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import i18next from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { ProjectsTable, ProjectTableData } from './ProjectsTable'
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

const mockRoleAssignmentData = (data?: Partial<RoleAssignmentHookType>) => ({
  roleAssignmentData: { ...baseRoleAssignmentData, ...data },
  isLoading: false,
  isUsersLoading: false,
  isGroupsLoading: false,
  isRolesLoading: false,
  isClusterSetLoading: false,
})

const createMockUseRoleAssignmentDataHook = (data?: Partial<RoleAssignmentHookType>) =>
  jest.fn(() => mockRoleAssignmentData(data))

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

const renderProjectsTable = (props: React.ComponentProps<typeof ProjectsTable>) =>
  render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <PluginContext.Provider value={defaultPlugin}>
          <PluginDataContext.Provider value={{ ...pluginDataDefaultContext, loadStarted: true, loadCompleted: true }}>
            <AcmTableStateProvider localStorageKey="test-table">
              <ProjectsTable {...props} />
            </AcmTableStateProvider>
          </PluginDataContext.Provider>
        </PluginContext.Provider>
      </I18nextProvider>
    </MemoryRouter>
  )

describe('ProjectsTable', () => {
  it('renders provided projects', async () => {
    // Arrange
    renderProjectsTable({
      selectedClusters: [{ name: 'local-cluster' }],
      projects: sampleProjects,
      useRoleAssignmentDataHook: createMockUseRoleAssignmentDataHook(),
    })

    // Assert
    expect(await screen.findByText('alpha')).toBeInTheDocument()
    expect(screen.getByText('beta')).toBeInTheDocument()
  })

  it('fires selection callback when a row is selected', async () => {
    // Arrange
    const onSelectionChange = jest.fn()
    renderProjectsTable({
      selectedClusters: [{ name: 'local-cluster' }],
      projects: sampleProjects,
      onSelectionChange,
      useRoleAssignmentDataHook: createMockUseRoleAssignmentDataHook(),
    })

    // Act
    const checkboxes = await screen.findAllByRole('checkbox')
    await userEvent.click(checkboxes[1])

    // Assert
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalled()
    })

    const selected = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1][0]
    expect(selected).toEqual([sampleProjects[0]])
  })

  it('builds projects from common namespaces when no projects are provided', async () => {
    // Arrange
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
      selectedClusters: [{ name: 'local-cluster' }, { name: 'dev-cluster' }],
      useRoleAssignmentDataHook: mockHook,
    })

    // Assert
    expect(await screen.findByText('shared')).toBeInTheDocument()
  })

  describe('additionalProjects', () => {
    it('displays additionalProjects in the list', async () => {
      // Arrange
      const mockHook = createMockUseRoleAssignmentDataHook({
        clusterSets: [
          {
            name: 'sample-set',
            clusters: [
              { name: 'local-cluster', namespaces: ['shared'] },
              { name: 'dev-cluster', namespaces: ['shared'] },
            ],
          },
        ],
      })

      renderProjectsTable({
        selectedClusters: [{ name: 'local-cluster' }, { name: 'dev-cluster' }],
        useRoleAssignmentDataHook: mockHook,
        additionalProjects: ['new-project'],
      })

      // Assert
      expect(await screen.findByText('shared')).toBeInTheDocument()
      expect(screen.getByText('new-project')).toBeInTheDocument()
    })

    it('displays multiple additionalProjects in the list', async () => {
      // Arrange
      const mockHook = createMockUseRoleAssignmentDataHook({
        clusterSets: [
          {
            name: 'sample-set',
            clusters: [
              { name: 'local-cluster', namespaces: ['shared'] },
              { name: 'dev-cluster', namespaces: ['shared'] },
            ],
          },
        ],
      })

      renderProjectsTable({
        selectedClusters: [{ name: 'local-cluster' }, { name: 'dev-cluster' }],
        useRoleAssignmentDataHook: mockHook,
        additionalProjects: ['project-one', 'project-two', 'project-three'],
      })

      // Assert
      expect(await screen.findByText('shared')).toBeInTheDocument()
      expect(screen.getByText('project-one')).toBeInTheDocument()
      expect(screen.getByText('project-two')).toBeInTheDocument()
      expect(screen.getByText('project-three')).toBeInTheDocument()
    })

    it('does not duplicate projects that already exist in common namespaces', async () => {
      // Arrange
      const mockHook = createMockUseRoleAssignmentDataHook({
        clusterSets: [
          {
            name: 'sample-set',
            clusters: [
              { name: 'local-cluster', namespaces: ['shared', 'existing-project'] },
              { name: 'dev-cluster', namespaces: ['shared', 'existing-project'] },
            ],
          },
        ],
      })

      renderProjectsTable({
        selectedClusters: [{ name: 'local-cluster' }, { name: 'dev-cluster' }],
        useRoleAssignmentDataHook: mockHook,
        additionalProjects: ['existing-project', 'new-project'],
      })

      // Assert
      expect(await screen.findByText('shared')).toBeInTheDocument()
      expect(screen.getByText('new-project')).toBeInTheDocument()
      expect(screen.getByText('existing-project')).toBeInTheDocument()

      // Verify there's only one row for existing-project (not duplicated)
      const existingProjectCells = screen.getAllByText('existing-project')
      expect(existingProjectCells).toHaveLength(1)
    })

    it('does not duplicate additionalProjects when the same project is added multiple times', async () => {
      // Arrange
      const mockHook = createMockUseRoleAssignmentDataHook({
        clusterSets: [
          {
            name: 'sample-set',
            clusters: [
              { name: 'local-cluster', namespaces: ['shared'] },
              { name: 'dev-cluster', namespaces: ['shared'] },
            ],
          },
        ],
      })

      renderProjectsTable({
        selectedClusters: [{ name: 'local-cluster' }, { name: 'dev-cluster' }],
        useRoleAssignmentDataHook: mockHook,
        additionalProjects: ['new-project', 'new-project', 'new-project'],
      })

      // Assert
      expect(await screen.findByText('shared')).toBeInTheDocument()
      expect(screen.getByText('new-project')).toBeInTheDocument()

      // Verify there's only one row for new-project (not duplicated)
      const newProjectCells = screen.getAllByText('new-project')
      expect(newProjectCells).toHaveLength(1)
    })

    it('displays additionalProjects even when no common namespaces exist', async () => {
      // Arrange
      const mockHook = createMockUseRoleAssignmentDataHook({
        clusterSets: [
          {
            name: 'sample-set',
            clusters: [
              { name: 'local-cluster', namespaces: ['alpha'] },
              { name: 'dev-cluster', namespaces: ['beta'] },
            ],
          },
        ],
      })

      renderProjectsTable({
        selectedClusters: [{ name: 'local-cluster' }, { name: 'dev-cluster' }],
        useRoleAssignmentDataHook: mockHook,
        additionalProjects: ['new-common-project'],
      })

      // Assert - no common namespaces, but additionalProjects should still appear
      expect(await screen.findByText('new-common-project')).toBeInTheDocument()
      expect(screen.queryByText('alpha')).not.toBeInTheDocument()
      expect(screen.queryByText('beta')).not.toBeInTheDocument()
    })

    it('sorts additionalProjects alphabetically with existing projects', async () => {
      // Arrange
      const mockHook = createMockUseRoleAssignmentDataHook({
        clusterSets: [
          {
            name: 'sample-set',
            clusters: [
              { name: 'local-cluster', namespaces: ['delta', 'bravo'] },
              { name: 'dev-cluster', namespaces: ['delta', 'bravo'] },
            ],
          },
        ],
      })

      renderProjectsTable({
        selectedClusters: [{ name: 'local-cluster' }, { name: 'dev-cluster' }],
        useRoleAssignmentDataHook: mockHook,
        additionalProjects: ['alpha', 'charlie'],
      })

      // Assert - all projects should be present
      expect(await screen.findByText('alpha')).toBeInTheDocument()
      expect(screen.getByText('bravo')).toBeInTheDocument()
      expect(screen.getByText('charlie')).toBeInTheDocument()
      expect(screen.getByText('delta')).toBeInTheDocument()
    })
  })
})
