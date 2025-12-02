/* Copyright Contributors to the Open Cluster Management project */

import { createProject, ProjectProperties } from './project'
import { createResource, replaceResource } from './utils/resource-request'
import { NamespaceApiVersion, NamespaceKind } from '.'

// Mock the resource request utilities
jest.mock('./utils/resource-request', () => ({
  createResource: jest.fn(),
  replaceResource: jest.fn(),
}))

const mockCreateResource = createResource as jest.MockedFunction<typeof createResource>
const mockReplaceResource = replaceResource as jest.MockedFunction<typeof replaceResource>

describe('createProject', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock for createResource
    mockCreateResource.mockReturnValue({
      promise: Promise.resolve({
        apiVersion: 'project.openshift.io/v1',
        kind: 'Project',
        metadata: { name: 'test-project' },
      }),
      abort: jest.fn(),
    })

    // Default mock for replaceResource
    mockReplaceResource.mockReturnValue({
      promise: Promise.resolve({
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { name: 'test-project' },
      }),
      abort: jest.fn(),
    })
  })

  it('should throw error when name is undefined', () => {
    expect(() => createProject(undefined)).toThrow('Project name is undefined')
  })

  it('should throw error when name is empty string', () => {
    expect(() => createProject('')).toThrow('Project name is undefined')
  })

  it('should create project with name only', () => {
    const result = createProject('test-project')

    expect(mockCreateResource).toHaveBeenCalledWith({
      apiVersion: 'project.openshift.io/v1',
      kind: 'ProjectRequest',
      metadata: {
        name: 'test-project',
      },
    })
    expect(result).toHaveProperty('promise')
    expect(result).toHaveProperty('abort')
  })

  it('should create project with labels', () => {
    const labels = {
      app: 'test-app',
      environment: 'development',
    }

    createProject('test-project', labels)

    expect(mockCreateResource).toHaveBeenCalledWith({
      apiVersion: 'project.openshift.io/v1',
      kind: 'ProjectRequest',
      metadata: {
        name: 'test-project',
      },
    })
  })

  it('should create project with all properties', () => {
    const properties: ProjectProperties = {
      displayName: 'Test Project',
      description: 'A test project for testing',
    }

    createProject('test-project', undefined, properties)

    expect(mockCreateResource).toHaveBeenCalledWith({
      apiVersion: 'project.openshift.io/v1',
      kind: 'ProjectRequest',
      metadata: { name: 'test-project' },
      displayName: 'Test Project',
      description: 'A test project for testing',
    })
  })

  it('should create project with partial properties', () => {
    const properties: ProjectProperties = {
      displayName: 'Test Project',
      // description is omitted
    }

    createProject('test-project', undefined, properties)

    expect(mockCreateResource).toHaveBeenCalledWith({
      apiVersion: 'project.openshift.io/v1',
      kind: 'ProjectRequest',
      metadata: { name: 'test-project' },
      displayName: 'Test Project',
      // description should not be present
    })
  })

  it('should create project with empty properties object', () => {
    const properties: ProjectProperties = {}

    createProject('test-project', undefined, properties)

    expect(mockCreateResource).toHaveBeenCalledWith({
      apiVersion: 'project.openshift.io/v1',
      kind: 'ProjectRequest',
      metadata: { name: 'test-project' },
      // displayName and description should not be present when empty
    })
  })

  it('should create project with labels and properties', () => {
    const labels = { team: 'frontend' }
    const properties: ProjectProperties = {
      displayName: 'Frontend Project',
      description: 'Project for frontend team',
    }

    createProject('frontend-project', labels, properties)

    expect(mockCreateResource).toHaveBeenCalledWith({
      apiVersion: 'project.openshift.io/v1',
      kind: 'ProjectRequest',
      metadata: { name: 'frontend-project' },
      displayName: 'Frontend Project',
      description: 'Project for frontend team',
    })
  })

  it('should handle labels by updating namespace after project creation', async () => {
    const labels = { environment: 'production' }
    const mockProject = {
      apiVersion: 'project.openshift.io/v1' as const,
      kind: 'Project' as const,
      metadata: { name: 'prod-project' },
    }

    mockCreateResource.mockReturnValue({
      promise: Promise.resolve(mockProject),
      abort: jest.fn(),
    })

    const result = createProject('prod-project', labels)

    // Wait for the promise to resolve
    await result.promise

    // Verify that replaceResource is called to update the namespace with labels
    expect(mockReplaceResource).toHaveBeenCalledWith({
      apiVersion: NamespaceApiVersion,
      kind: NamespaceKind,
      metadata: {
        ...mockProject.metadata,
        labels,
      },
    })
  })

  it('should call replaceResource when labels are provided', async () => {
    const labels = { environment: 'staging' }
    const mockProject = {
      apiVersion: 'project.openshift.io/v1' as const,
      kind: 'Project' as const,
      metadata: { name: 'staging-project' },
    }

    mockCreateResource.mockReturnValue({
      promise: Promise.resolve(mockProject),
      abort: jest.fn(),
    })

    const result = createProject('staging-project', labels)

    // The main promise should resolve with the project
    await expect(result.promise).resolves.toEqual(mockProject)

    // Wait a bit to ensure the labels update promise has time to execute
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Verify that replaceResource was called to update namespace with labels
    expect(mockReplaceResource).toHaveBeenCalledWith({
      apiVersion: NamespaceApiVersion,
      kind: NamespaceKind,
      metadata: {
        ...mockProject.metadata,
        labels,
      },
    })
  })

  it('should filter out undefined property values', () => {
    const properties: ProjectProperties = {
      displayName: 'Test Project',
      description: undefined,
    }

    createProject('test-project', undefined, properties)

    expect(mockCreateResource).toHaveBeenCalledWith({
      apiVersion: 'project.openshift.io/v1',
      kind: 'ProjectRequest',
      metadata: { name: 'test-project' },
      displayName: 'Test Project',
      // description should not be included
    })
  })

  it('should filter out empty string property values', () => {
    const properties: ProjectProperties = {
      displayName: '',
      description: 'Valid description',
    }

    createProject('test-project', undefined, properties)

    expect(mockCreateResource).toHaveBeenCalledWith({
      apiVersion: 'project.openshift.io/v1',
      kind: 'ProjectRequest',
      metadata: { name: 'test-project' },
      description: 'Valid description',
      // displayName should not be included due to empty string
    })
  })

  it('should return the same response structure as createResource', () => {
    const mockResponse = {
      promise: Promise.resolve({
        apiVersion: 'project.openshift.io/v1' as const,
        kind: 'Project' as const,
        metadata: { name: 'test-project' },
      }),
      abort: jest.fn(),
    }

    mockCreateResource.mockReturnValue(mockResponse)

    const result = createProject('test-project')

    expect(result).toBe(mockResponse)
  })
})
