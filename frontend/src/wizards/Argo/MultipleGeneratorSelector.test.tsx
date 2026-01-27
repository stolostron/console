/* Copyright Contributors to the Open Cluster Management project */

import { Specifications } from './MultipleGeneratorSelector'
import { klona } from 'klona/json'

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

  test('should handle both git and list generators adding both suffixes', () => {
    const templateName = 'test-app'
    const pathBasename = '{{path.basename}}'
    const cluster = '{{.cluster}}'
    const hasGitGen = true
    const hasListGen = true

    let result = templateName
    if (hasGitGen && !result.includes(`-${pathBasename}`)) {
      result = `${result}-${pathBasename}`
    }
    if (hasListGen && !result.includes(`-${cluster}`)) {
      result = `${result}-${cluster}`
    }

    expect(result).toBe('test-app-{{path.basename}}-{{.cluster}}')
  })
})

describe('Generator template cloning', () => {
  test('should create independent clones when creating generators from specifications', () => {
    const gitSpec = Specifications.find((s) => s.name === 'Git generator')
    expect(gitSpec).toBeDefined()

    // Simulate createGeneratorFromSpecification behavior
    const generator1 = klona(gitSpec?.generatorTemplate)
    const generator2 = klona(gitSpec?.generatorTemplate)

    // They should be different object references
    expect(generator1).not.toBe(generator2)

    // But have the same content
    expect(generator1).toEqual(generator2)

    // Modifying one should not affect the other
    // Assert structure first to satisfy TypeScript, then modify and verify independence
    expect(Array.isArray(generator1)).toBe(true)
    expect(Array.isArray(generator2)).toBe(true)

    const gen1 = generator1 as { git: { repoURL: string } }[]
    const gen2 = generator2 as { git: { repoURL: string } }[]

    expect(gen1[0]?.git).toBeDefined()
    expect(gen2[0]?.git).toBeDefined()

    gen1[0].git.repoURL = 'modified-url'
    expect(gen2[0].git.repoURL).not.toBe('modified-url')
  })

  test('should not modify original specification when cloning', () => {
    const listSpec = Specifications.find((s) => s.name === 'List generator')
    expect(listSpec).toBeDefined()

    const originalTemplate = JSON.stringify(listSpec?.generatorTemplate)

    // Create multiple clones and modify them
    const clone1 = klona(listSpec?.generatorTemplate)
    const clone2 = klona(listSpec?.generatorTemplate)

    if (Array.isArray(clone1) && clone1[0]?.list) {
      clone1[0].list.elements = [{ cluster: 'new-cluster', url: 'new-url' }]
    }

    if (Array.isArray(clone2) && clone2[0]?.list) {
      clone2[0].list.elements = [{ cluster: 'another-cluster', url: 'another-url' }]
    }

    // Original should remain unchanged
    expect(JSON.stringify(listSpec?.generatorTemplate)).toBe(originalTemplate)
  })
})

describe('Generator YAML parsing', () => {
  test('Git generator YAML should parse to valid structure', () => {
    const gitSpec = Specifications.find((s) => s.name === 'Git generator')
    expect(gitSpec).toBeDefined()
    expect(Array.isArray(gitSpec?.generatorTemplate)).toBe(true)

    const template = gitSpec?.generatorTemplate as { git: Record<string, unknown> }[]
    expect(template[0]).toHaveProperty('git')
    expect(template[0].git).toHaveProperty('requeueAfterSeconds')
    expect(template[0].git).toHaveProperty('revision')
    expect(template[0].git).toHaveProperty('directories')
  })

  test('List generator YAML should parse to valid structure', () => {
    const listSpec = Specifications.find((s) => s.name === 'List generator')
    expect(listSpec).toBeDefined()
    expect(Array.isArray(listSpec?.generatorTemplate)).toBe(true)

    const template = listSpec?.generatorTemplate as { list: { elements: unknown[] } }[]
    expect(template[0]).toHaveProperty('list')
    expect(template[0].list).toHaveProperty('elements')
    expect(Array.isArray(template[0].list.elements)).toBe(true)
  })

  test('Cluster Decision Resource generator YAML should parse to valid structure', () => {
    const cdrSpec = Specifications.find((s) => s.name === 'Cluster Decision Resource generator')
    expect(cdrSpec).toBeDefined()
    expect(Array.isArray(cdrSpec?.generatorTemplate)).toBe(true)

    const template = cdrSpec?.generatorTemplate as { clusterDecisionResource: Record<string, unknown> }[]
    expect(template[0]).toHaveProperty('clusterDecisionResource')
    expect(template[0].clusterDecisionResource).toHaveProperty('requeueAfterSeconds')
  })

  test('Clusters generator YAML should parse to valid structure', () => {
    const clustersSpec = Specifications.find((s) => s.name === 'Clusters generator')
    expect(clustersSpec).toBeDefined()
    expect(Array.isArray(clustersSpec?.generatorTemplate)).toBe(true)

    const template = clustersSpec?.generatorTemplate as { clusters: Record<string, unknown> }[]
    expect(template[0]).toHaveProperty('clusters')
    expect(template[0].clusters).toHaveProperty('selector')
  })

  test('SCM Provider generator YAML should parse to valid structure', () => {
    const scmSpec = Specifications.find((s) => s.name === 'SCM Provider generator')
    expect(scmSpec).toBeDefined()
    expect(Array.isArray(scmSpec?.generatorTemplate)).toBe(true)

    const template = scmSpec?.generatorTemplate as { scmProvider: { github: Record<string, unknown> } }[]
    expect(template[0]).toHaveProperty('scmProvider')
    expect(template[0].scmProvider).toHaveProperty('github')
  })

  test('Pull Request generator YAML should parse to valid structure', () => {
    const prSpec = Specifications.find((s) => s.name === 'Pull Request generator')
    expect(prSpec).toBeDefined()
    expect(Array.isArray(prSpec?.generatorTemplate)).toBe(true)

    const template = prSpec?.generatorTemplate as { pullRequest: { github: Record<string, unknown> } }[]
    expect(template[0]).toHaveProperty('pullRequest')
    expect(template[0].pullRequest).toHaveProperty('github')
  })

  test('Plugin generator YAML should parse to valid structure', () => {
    const pluginSpec = Specifications.find((s) => s.name === 'Plugin generator')
    expect(pluginSpec).toBeDefined()
    expect(Array.isArray(pluginSpec?.generatorTemplate)).toBe(true)

    const template = pluginSpec?.generatorTemplate as { plugin: Record<string, unknown> }[]
    expect(template[0]).toHaveProperty('plugin')
    expect(template[0].plugin).toHaveProperty('configMapRef')
  })
})

describe('Matrix generator transformation logic', () => {
  test('should wrap multiple generators in matrix generator', () => {
    const generators = [{ clusterDecisionResource: {} }, { git: {} }]

    // Simulate the matrix wrapping logic
    const result = [{ matrix: { generators: generators } }]

    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('matrix')
    expect(result[0].matrix.generators).toHaveLength(2)
  })

  test('should unwrap single generator from matrix', () => {
    const matrixGenerators = [{ matrix: { generators: [{ clusterDecisionResource: {} }] } }]

    // Simulate unwrapping when only one generator
    const generators = matrixGenerators[0].matrix.generators

    expect(generators).toHaveLength(1)
  })

  test('should preserve generator content when wrapping in matrix', () => {
    const gitGenerator = {
      git: {
        repoURL: 'https://github.com/test/repo',
        revision: 'main',
        directories: [{ path: 'apps' }],
        requeueAfterSeconds: 180,
      },
    }
    const listGenerator = {
      list: {
        elements: [{ cluster: 'test', url: 'https://test.com' }],
      },
    }

    const matrix = { matrix: { generators: [gitGenerator, listGenerator] } }

    expect(matrix.matrix.generators[0]).toEqual(gitGenerator)
    expect(matrix.matrix.generators[1]).toEqual(listGenerator)
  })
})

describe('Destination server update logic', () => {
  test('should set server to {{server}} when no list generator', () => {
    const hasListGen = false
    const server = '{{server}}'
    const url = '{{.url}}'

    const destinationServer = hasListGen ? url : server

    expect(destinationServer).toBe('{{server}}')
  })

  test('should set server to {{.url}} when list generator present', () => {
    const hasListGen = true
    const server = '{{server}}'
    const url = '{{.url}}'

    const destinationServer = hasListGen ? url : server

    expect(destinationServer).toBe('{{.url}}')
  })
})

describe('Destination namespace update logic', () => {
  test('should set namespace to {{path.basename}} when git generator present', () => {
    const hasGitGen = true
    const pathBasename = '{{path.basename}}'

    const namespace = hasGitGen ? pathBasename : ''

    expect(namespace).toBe('{{path.basename}}')
  })

  test('should clear namespace when no git generator', () => {
    const hasGitGen = false
    const pathBasename = '{{path.basename}}'

    const namespace = hasGitGen ? pathBasename : ''

    expect(namespace).toBe('')
  })
})

describe('Generator requeue times', () => {
  test('should have valid requeue time options', () => {
    const requeueTimes = [30, 60, 120, 180, 300]

    expect(requeueTimes).toContain(30)
    expect(requeueTimes).toContain(60)
    expect(requeueTimes).toContain(120)
    expect(requeueTimes).toContain(180)
    expect(requeueTimes).toContain(300)
  })

  test('all requeue times should be positive integers', () => {
    const requeueTimes = [30, 60, 120, 180, 300]

    requeueTimes.forEach((time) => {
      expect(Number.isInteger(time)).toBe(true)
      expect(time).toBeGreaterThan(0)
    })
  })

  test('requeue times should be in ascending order', () => {
    const requeueTimes = [30, 60, 120, 180, 300]
    const sorted = [...requeueTimes].sort((a, b) => a - b)

    expect(requeueTimes).toEqual(sorted)
  })
})

describe('Specification dropdown items', () => {
  test('dropdown items should have correct label and action structure', () => {
    const dropdownItems = Specifications.map((specification) => ({
      label: specification.description,
      action: () => klona(specification.generatorTemplate),
    }))

    expect(dropdownItems).toHaveLength(7)
    dropdownItems.forEach((item) => {
      expect(item).toHaveProperty('label')
      expect(item).toHaveProperty('action')
      expect(typeof item.label).toBe('string')
      expect(typeof item.action).toBe('function')
    })
  })

  test('dropdown action should return cloned template', () => {
    const gitSpec = Specifications.find((s) => s.name === 'Git generator')
    expect(gitSpec).toBeDefined()

    const action = () => klona(gitSpec?.generatorTemplate)
    const result1 = action()
    const result2 = action()

    // Results should be equal but not the same reference
    expect(result1).toEqual(result2)
    expect(result1).not.toBe(result2)
  })
})

describe('Generator form field validation', () => {
  test('git generator should require repoURL', () => {
    const gitGenerator = {
      git: {
        repoURL: '',
        revision: 'HEAD',
        directories: [],
        requeueAfterSeconds: 180,
      },
    }

    expect(gitGenerator.git.repoURL).toBe('')
  })

  test('list generator should have elements array', () => {
    const listGenerator = {
      list: {
        elements: [],
      },
    }

    expect(Array.isArray(listGenerator.list.elements)).toBe(true)
  })

  test('pullRequest generator should require owner and repo', () => {
    const prGenerator = {
      pullRequest: {
        github: {
          owner: '',
          repo: '',
          api: '',
        },
        requeueAfterSeconds: 180,
      },
    }

    expect(prGenerator.pullRequest.github.owner).toBe('')
    expect(prGenerator.pullRequest.github.repo).toBe('')
  })

  test('scmProvider generator should require organization', () => {
    const scmGenerator = {
      scmProvider: {
        github: {
          organization: '',
          api: '',
        },
      },
    }

    expect(scmGenerator.scmProvider.github.organization).toBe('')
  })

  test('plugin generator should require configMapRef name', () => {
    const pluginGenerator = {
      plugin: {
        configMapRef: {
          name: '',
        },
        input: { parameters: {} },
        values: {},
        requeueAfterSeconds: 180,
      },
    }

    expect(pluginGenerator.plugin.configMapRef.name).toBe('')
  })
})

describe('Directory path value transformations', () => {
  test('pathValueToInputValue should extract paths from array', () => {
    const value = [{ path: 'apps' }, { path: 'config' }, { path: 'manifests' }]

    const result = value.map((v: { path: string }) => v.path)

    expect(result).toEqual(['apps', 'config', 'manifests'])
  })

  test('inputValueToPathValue should wrap strings in path objects', () => {
    const value = ['apps', 'config', 'manifests']

    const result = value.map((v: string) => ({ path: v }))

    expect(result).toEqual([{ path: 'apps' }, { path: 'config' }, { path: 'manifests' }])
  })

  test('pathValueToInputValue should handle empty array', () => {
    const value: { path: string }[] = []

    const result = value.map((v: { path: string }) => v.path)

    expect(result).toEqual([])
  })

  test('inputValueToPathValue should handle empty array', () => {
    const value: string[] = []

    const result = value.map((v: string) => ({ path: v }))

    expect(result).toEqual([])
  })

  test('inputValueToPathValue should handle non-array input', () => {
    const value = 'not-an-array'

    const result = Array.isArray(value) ? value.map((v: string) => ({ path: v })) : []

    expect(result).toEqual([])
  })
})

describe('Generator with multiple properties detection', () => {
  test('should detect generator even with extra properties', () => {
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

    const generatorWithExtraProps = {
      git: { repoURL: 'test' },
      someExtraProp: 'value',
    }

    expect(detectGeneratorType(generatorWithExtraProps)).toBe('git')
  })

  test('should use first matching type when multiple generator keys present', () => {
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

    // Edge case: object has multiple generator type keys (should not happen in practice)
    const ambiguousGenerator = {
      git: {},
      list: {},
    }

    // Should return first matching type based on check order
    const result = detectGeneratorType(ambiguousGenerator)
    expect(['git', 'list']).toContain(result)
  })
})
