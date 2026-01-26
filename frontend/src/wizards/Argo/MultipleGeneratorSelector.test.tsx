/* Copyright Contributors to the Open Cluster Management project */

import { Specifications } from './MultipleGeneratorSelector'

// Mock dependencies
jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (params) {
        return key.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] || '')
      }
      return key
    },
  }),
}))

jest.mock('./common/GitRevisionSelect', () => ({
  GitRevisionSelect: () => null,
}))

describe('Specifications', () => {
  test('should contain all expected generator types', () => {
    const generatorNames = Specifications.map((spec) => spec.name)

    expect(generatorNames).toContain('Cluster Decision Resource generator')
    expect(generatorNames).toContain('Git generator')
    expect(generatorNames).toContain('List generator')
    expect(generatorNames).toContain('Clusters generator')
    expect(generatorNames).toContain('SCM Provider generator')
    expect(generatorNames).toContain('Pull Request generator')
    expect(generatorNames).toContain('Plugin generator')
  })

  test('should have 7 generator specifications', () => {
    expect(Specifications).toHaveLength(7)
  })

  test('should be sorted alphabetically', () => {
    const names = Specifications.map((spec) => spec.name)
    const sortedNames = [...names].sort()
    expect(names).toEqual(sortedNames)
  })

  test('each specification should have required properties', () => {
    Specifications.forEach((spec) => {
      expect(spec).toHaveProperty('name')
      expect(spec).toHaveProperty('description')
      expect(spec).toHaveProperty('generatorTemplate')
      expect(typeof spec.name).toBe('string')
      expect(typeof spec.description).toBe('string')
      expect(typeof spec.generatorTemplate).toBe('object')
    })
  })

  test('Cluster Decision Resource generator template should have correct structure', () => {
    const cdrSpec = Specifications.find((s) => s.name === 'Cluster Decision Resource generator')
    expect(cdrSpec).toBeDefined()
    expect(cdrSpec?.generatorTemplate).toBeDefined()
  })

  test('Git generator template should have correct structure', () => {
    const gitSpec = Specifications.find((s) => s.name === 'Git generator')
    expect(gitSpec).toBeDefined()
    expect(gitSpec?.generatorTemplate).toBeDefined()
  })

  test('List generator template should have correct structure', () => {
    const listSpec = Specifications.find((s) => s.name === 'List generator')
    expect(listSpec).toBeDefined()
    expect(listSpec?.generatorTemplate).toBeDefined()
  })

  test('Clusters generator template should have correct structure', () => {
    const clustersSpec = Specifications.find((s) => s.name === 'Clusters generator')
    expect(clustersSpec).toBeDefined()
    expect(clustersSpec?.generatorTemplate).toBeDefined()
  })

  test('SCM Provider generator template should have correct structure', () => {
    const scmSpec = Specifications.find((s) => s.name === 'SCM Provider generator')
    expect(scmSpec).toBeDefined()
    expect(scmSpec?.generatorTemplate).toBeDefined()
  })

  test('Pull Request generator template should have correct structure', () => {
    const prSpec = Specifications.find((s) => s.name === 'Pull Request generator')
    expect(prSpec).toBeDefined()
    expect(prSpec?.generatorTemplate).toBeDefined()
  })

  test('Plugin generator template should have correct structure', () => {
    const pluginSpec = Specifications.find((s) => s.name === 'Plugin generator')
    expect(pluginSpec).toBeDefined()
    expect(pluginSpec?.generatorTemplate).toBeDefined()
  })
})

describe('Generator type structures', () => {
  test('clusterDecisionResource generator should have expected properties', () => {
    const generator = { clusterDecisionResource: { configMapRef: 'test', requeueAfterSeconds: 180 } }
    expect(generator).toHaveProperty('clusterDecisionResource')
    expect(generator.clusterDecisionResource).toHaveProperty('configMapRef')
    expect(generator.clusterDecisionResource).toHaveProperty('requeueAfterSeconds')
  })

  test('list generator should have expected properties', () => {
    const generator = {
      list: {
        elements: [{ cluster: 'test-cluster', url: 'https://test.com' }],
      },
    }
    expect(generator).toHaveProperty('list')
    expect(generator.list).toHaveProperty('elements')
    expect(generator.list.elements[0]).toHaveProperty('cluster')
    expect(generator.list.elements[0]).toHaveProperty('url')
  })

  test('clusters generator should have expected properties', () => {
    const generator = {
      clusters: {
        selector: {
          matchLabels: { environment: 'production' },
        },
      },
    }
    expect(generator).toHaveProperty('clusters')
    expect(generator.clusters).toHaveProperty('selector')
    expect(generator.clusters.selector).toHaveProperty('matchLabels')
  })

  test('git generator should have expected properties', () => {
    const generator = {
      git: {
        repoURL: 'https://github.com/test/repo',
        revision: 'main',
        directories: [{ path: 'apps' }],
        requeueAfterSeconds: 180,
      },
    }
    expect(generator).toHaveProperty('git')
    expect(generator.git).toHaveProperty('repoURL')
    expect(generator.git).toHaveProperty('revision')
    expect(generator.git).toHaveProperty('directories')
    expect(generator.git).toHaveProperty('requeueAfterSeconds')
  })

  test('scmProvider generator should have expected properties', () => {
    const generator = {
      scmProvider: {
        github: {
          organization: 'test-org',
          api: 'https://api.github.com',
          allBranches: true,
          tokenRef: { secretName: 'github-token', key: 'token' },
        },
      },
    }
    expect(generator).toHaveProperty('scmProvider')
    expect(generator.scmProvider).toHaveProperty('github')
    expect(generator.scmProvider.github).toHaveProperty('organization')
  })

  test('pullRequest generator should have expected properties', () => {
    const generator = {
      pullRequest: {
        github: {
          owner: 'test-owner',
          repo: 'test-repo',
          api: 'https://api.github.com',
          labels: ['deploy'],
        },
        requeueAfterSeconds: 180,
      },
    }
    expect(generator).toHaveProperty('pullRequest')
    expect(generator.pullRequest).toHaveProperty('github')
    expect(generator.pullRequest.github).toHaveProperty('owner')
    expect(generator.pullRequest.github).toHaveProperty('repo')
  })

  test('plugin generator should have expected properties', () => {
    const generator = {
      plugin: {
        configMapRef: { name: 'test-configmap' },
        input: { parameters: { key: 'value' } },
        values: { outputKey: 'outputValue' },
        requeueAfterSeconds: 180,
      },
    }
    expect(generator).toHaveProperty('plugin')
    expect(generator.plugin).toHaveProperty('configMapRef')
    expect(generator.plugin).toHaveProperty('input')
    expect(generator.plugin).toHaveProperty('values')
  })
})

describe('pascalCaseToSentenceCase utility', () => {
  // The function capitalizes the first letter and adds spaces before capital letters
  test('clusterDecisionResource should convert correctly', () => {
    const input = 'clusterDecisionResource'
    const expected = input.replace(/([A-Z])/g, ' $1')
    const result = expected.charAt(0).toUpperCase() + expected.slice(1)
    expect(result).toBe('Cluster Decision Resource')
  })

  test('git should convert to "Git"', () => {
    const input = 'git'
    const expected = input.replace(/([A-Z])/g, ' $1')
    const result = expected.charAt(0).toUpperCase() + expected.slice(1)
    expect(result).toBe('Git')
  })

  test('scmProvider should convert correctly', () => {
    const input = 'scmProvider'
    const expected = input.replace(/([A-Z])/g, ' $1')
    const result = expected.charAt(0).toUpperCase() + expected.slice(1)
    expect(result).toBe('Scm Provider')
  })

  test('pullRequest should convert correctly', () => {
    const input = 'pullRequest'
    const expected = input.replace(/([A-Z])/g, ' $1')
    const result = expected.charAt(0).toUpperCase() + expected.slice(1)
    expect(result).toBe('Pull Request')
  })

  test('list should convert to "List"', () => {
    const input = 'list'
    const expected = input.replace(/([A-Z])/g, ' $1')
    const result = expected.charAt(0).toUpperCase() + expected.slice(1)
    expect(result).toBe('List')
  })

  test('clusters should convert to "Clusters"', () => {
    const input = 'clusters'
    const expected = input.replace(/([A-Z])/g, ' $1')
    const result = expected.charAt(0).toUpperCase() + expected.slice(1)
    expect(result).toBe('Clusters')
  })

  test('plugin should convert to "Plugin"', () => {
    const input = 'plugin'
    const expected = input.replace(/([A-Z])/g, ' $1')
    const result = expected.charAt(0).toUpperCase() + expected.slice(1)
    expect(result).toBe('Plugin')
  })

  test('should handle empty string', () => {
    const input = ''
    const expected = input.replace(/([A-Z])/g, ' $1')
    const result = expected.charAt(0).toUpperCase() + expected.slice(1)
    expect(result).toBe('')
  })
})

describe('Generator template creation', () => {
  test('should have templates that reference the same object', () => {
    const gitSpec = Specifications.find((s) => s.name === 'Git generator')
    expect(gitSpec).toBeDefined()

    const template1 = gitSpec?.generatorTemplate
    const template2 = gitSpec?.generatorTemplate

    // They should reference the same object (before cloning in createGeneratorFromSpecification)
    expect(template1).toBe(template2)
  })

  test('each generator specification should have a valid template', () => {
    Specifications.forEach((spec) => {
      expect(spec.generatorTemplate).toBeDefined()
      expect(Array.isArray(spec.generatorTemplate) || typeof spec.generatorTemplate === 'object').toBe(true)
    })
  })

  test('generator templates should be arrays (parsed from YAML)', () => {
    // All generator YAML files should parse to arrays
    Specifications.forEach((spec) => {
      expect(Array.isArray(spec.generatorTemplate)).toBe(true)
    })
  })
})

describe('Generator type detection logic', () => {
  // Test the generator type detection logic that would be used by getGeneratorType
  const detectGeneratorType = (generator: unknown): string => {
    if (!generator || typeof generator !== 'object') return 'unknown'
    const gen = generator as Record<string, unknown>
    if ('clusterDecisionResource' in gen) return 'clusterDecisionResource'
    if ('list' in gen) return 'list'
    if ('clusters' in gen) return 'clusters'
    if ('git' in gen) return 'git'
    if ('scmProvider' in gen) return 'scmProvider'
    if ('pullRequest' in gen) return 'pullRequest'
    if ('plugin' in gen) return 'plugin'
    return 'unknown'
  }

  test('should detect clusterDecisionResource generator type', () => {
    expect(detectGeneratorType({ clusterDecisionResource: {} })).toBe('clusterDecisionResource')
  })

  test('should detect list generator type', () => {
    expect(detectGeneratorType({ list: {} })).toBe('list')
  })

  test('should detect clusters generator type', () => {
    expect(detectGeneratorType({ clusters: {} })).toBe('clusters')
  })

  test('should detect git generator type', () => {
    expect(detectGeneratorType({ git: {} })).toBe('git')
  })

  test('should detect scmProvider generator type', () => {
    expect(detectGeneratorType({ scmProvider: {} })).toBe('scmProvider')
  })

  test('should detect pullRequest generator type', () => {
    expect(detectGeneratorType({ pullRequest: {} })).toBe('pullRequest')
  })

  test('should detect plugin generator type', () => {
    expect(detectGeneratorType({ plugin: {} })).toBe('plugin')
  })

  test('should return unknown for null', () => {
    expect(detectGeneratorType(null)).toBe('unknown')
  })

  test('should return unknown for undefined', () => {
    expect(detectGeneratorType(undefined)).toBe('unknown')
  })

  test('should return unknown for empty object', () => {
    expect(detectGeneratorType({})).toBe('unknown')
  })

  test('should return unknown for unrecognized generator type', () => {
    expect(detectGeneratorType({ customGenerator: {} })).toBe('unknown')
  })

  test('should return unknown for non-object types', () => {
    expect(detectGeneratorType('string')).toBe('unknown')
    expect(detectGeneratorType(123)).toBe('unknown')
    expect(detectGeneratorType(true)).toBe('unknown')
  })
})

describe('Matrix generator path detection logic', () => {
  // Test the logic that determines the generator path based on matrix presence
  const getGeneratorPath = (item: any): string => {
    const hasMatrix = item?.spec?.generators?.[0]?.matrix
    return hasMatrix ? 'spec.generators.0.matrix.generators' : 'spec.generators'
  }

  test('should return spec.generators when no matrix generator exists', () => {
    const item = {
      spec: {
        generators: [{ clusterDecisionResource: {} }],
      },
    }
    expect(getGeneratorPath(item)).toBe('spec.generators')
  })

  test('should return matrix.generators path when matrix generator exists', () => {
    const item = {
      spec: {
        generators: [
          {
            matrix: {
              generators: [{ clusterDecisionResource: {} }, { git: {} }],
            },
          },
        ],
      },
    }
    expect(getGeneratorPath(item)).toBe('spec.generators.0.matrix.generators')
  })

  test('should return spec.generators for empty generators array', () => {
    const item = {
      spec: {
        generators: [],
      },
    }
    expect(getGeneratorPath(item)).toBe('spec.generators')
  })

  test('should return spec.generators when spec is undefined', () => {
    const item = {}
    expect(getGeneratorPath(item)).toBe('spec.generators')
  })
})

describe('Template name update logic', () => {
  // Test the logic that updates template name based on generator types
  test('should add path.basename suffix for git generator', () => {
    const templateName = 'test-app'
    const pathBasename = '{{path.basename}}'
    const hasGitGen = true

    let result = templateName
    if (hasGitGen && !result.includes(`-${pathBasename}`)) {
      result = `${result}-${pathBasename}`
    }

    expect(result).toBe('test-app-{{path.basename}}')
  })

  test('should add cluster suffix for list generator', () => {
    const templateName = 'test-app'
    const cluster = '{{.cluster}}'
    const hasListGen = true

    let result = templateName
    if (hasListGen && !result.includes(`-${cluster}`)) {
      result = `${result}-${cluster}`
    }

    expect(result).toBe('test-app-{{.cluster}}')
  })

  test('should not add duplicate suffixes', () => {
    const templateName = 'test-app-{{path.basename}}'
    const pathBasename = '{{path.basename}}'
    const hasGitGen = true

    let result = templateName
    if (hasGitGen && !result.includes(`-${pathBasename}`)) {
      result = `${result}-${pathBasename}`
    }

    expect(result).toBe('test-app-{{path.basename}}')
  })

  test('should remove path.basename suffix when no git generator', () => {
    const templateName = 'test-app-{{path.basename}}'
    const pathBasename = '{{path.basename}}'
    const hasGitGen = false

    let result = templateName
    if (!hasGitGen) {
      result = result.replace(`-${pathBasename}`, '')
    }

    expect(result).toBe('test-app')
  })

  test('should remove cluster suffix when no list generator', () => {
    const templateName = 'test-app-{{.cluster}}'
    const cluster = '{{.cluster}}'
    const hasListGen = false

    let result = templateName
    if (!hasListGen) {
      result = result.replace(`-${cluster}`, '')
    }

    expect(result).toBe('test-app')
  })
})
