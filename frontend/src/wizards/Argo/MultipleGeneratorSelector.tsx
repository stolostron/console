/* Copyright Contributors to the Open Cluster Management project */
import YAML from 'yaml'
import generatorClusterDecisionResource from './generators/generator-clusterDecisionResource.yaml'
import generatorList from './generators/generator-list.yaml'
import generatorClusters from './generators/generator-clusters.yaml'
import generatorGit from './generators/generator-git.yaml'
import generatorSCMProvider from './generators/generator-scmProvider.yaml'
import generatorPullRequest from './generators/generator-pullRequest.yaml'
import generatorPlugin from './generators/generator-plugin.yaml'
import { HelperText, HelperTextItem, Title } from '@patternfly/react-core'
import get from 'get-value'
import { klona } from 'klona/json'
import { useContext, useEffect, useMemo, useRef } from 'react'
import set from 'set-value'
import {
  useEditMode,
  ItemContext,
  EditMode,
  WizArrayInput,
  WizCheckbox,
  WizHidden,
  WizKeyValue,
  WizSelect,
  useData,
  WizTextInput,
  WizMultiSelect,
} from '@patternfly-labs/react-form-wizard'
import { IResource } from '../common/resources/IResource'
import { useTranslation } from '../../lib/acm-i18next'
import { Channel } from './ArgoWizard'
import { validateWebURL } from '../../lib/validation'
import { GitRevisionSelect } from './common/GitRevisionSelect'

export interface MultipleGeneratorSelectorProps {
  resources: IResource[]
  channels: Channel[] | undefined
  gitChannels: string[]
  helmChannels: string[]
  gitGeneratorRepos: { urls: string[]; versions: string[]; paths: string[] }
  disableForm: boolean
  generatorPath: string
}

export function MultipleGeneratorSelector(props: MultipleGeneratorSelectorProps) {
  const { generatorPath } = props
  const item = useContext(ItemContext)

  const editMode = useEditMode()
  const generators = get(item, generatorPath)
  const { t } = useTranslation()
  return (
    <WizArrayInput
      key="generators"
      id="generators"
      path={generatorPath}
      placeholder={generators?.length >= 2 ? undefined : t('Add generator')}
      required
      dropdownItems={Specifications.map((specification) => ({
        label: specification.description,
        action: () => createGeneratorFromSpecification(specification),
      }))}
      collapsedContent={<GeneratorCollapsedContent />}
      defaultCollapsed={editMode !== EditMode.Create}
    >
      <GeneratorInputForm {...props} />
    </WizArrayInput>
  )
}

function GeneratorCollapsedContent() {
  const generator = useContext(ItemContext)
  const generatorType = getGeneratorType(generator)
  const { t } = useTranslation()
  return (
    <div>
      <Title headingLevel="h6">{t('{{type}} Generator', { type: pascalCaseToSentenceCase(generatorType) })}</Title>
    </div>
  )
}

function GeneratorInputForm(props: MultipleGeneratorSelectorProps) {
  const { gitGeneratorRepos, channels, disableForm } = props
  // this is an array dependency in Wiz which doesn't compare by stringify
  // so if you change the array object, react thinks the value changed
  // which causes infinite loop
  const directoryPaths = useRef<string[]>([])
  const generator = useContext(ItemContext)
  const generatorType = getGeneratorType(generator)
  const requeueTimes = useMemo(() => [30, 60, 120, 180, 300], [])
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Cluster Decision Resource generator - uses Placement to determine target clusters */}
      <WizHidden hidden={() => generatorType !== 'clusterDecisionResource'}>
        <HelperText>
          <HelperTextItem>{t('The Placement step defines where applications are deployed.')}</HelperTextItem>
        </HelperText>
        <WizSelect
          path="clusterDecisionResource.requeueAfterSeconds"
          label={t('Requeue time')}
          options={requeueTimes}
          labelHelp={t('cluster.decision.resource.requeue.time.description')}
          required
          disabled={disableForm}
        />
      </WizHidden>
      {/* Git generator - uses a Git repository to determine target clusters */}
      <WizHidden hidden={() => generatorType !== 'git'}>
        <HelperText>
          <HelperTextItem>
            {t('Use the manifest files in a git repository directory to generate applications')}
          </HelperTextItem>
        </HelperText>
        <WizSelect
          path="git.repoURL"
          label={t('URL')}
          labelHelp={t('The URL path for the Git repository.')}
          placeholder={t('Enter or select a Git URL')}
          options={gitGeneratorRepos.urls}
          validation={validateWebURL}
          required
          isCreatable
          disabled={disableForm}
        />
        <GitRevisionSelect
          channels={channels ?? []}
          path="git.repoURL"
          target="git.revision"
          revisions={gitGeneratorRepos.versions}
        />
        <WizMultiSelect
          label="Directory paths"
          placeholder="Select or enter a directory path"
          path="git.directories"
          required
          options={[...gitGeneratorRepos.paths, 'default', 'development', 'production']}
          isCreatable
          disabled={disableForm}
          pathValueToInputValue={(value: unknown) => {
            if (Array.isArray(value)) {
              directoryPaths.current.splice(
                0,
                directoryPaths.current.length,
                ...value.map((v: { path: string }) => v.path)
              )
            }
            return directoryPaths.current
          }}
          inputValueToPathValue={(value: unknown) => {
            return Array.isArray(value) ? value.map((v: string) => ({ path: v })) : []
          }}
        />
        <WizSelect
          path="git.requeueAfterSeconds"
          label={t('Requeue time')}
          options={requeueTimes}
          labelHelp={t('Git requeue time in seconds')}
          disabled={disableForm}
        />
      </WizHidden>
      {/* List generator - uses a list of clusters to determine target clusters */}
      <WizHidden hidden={() => generatorType !== 'list'}>
        <HelperText>
          <HelperTextItem>{t('Use the list of clusters to generate applications')}</HelperTextItem>
        </HelperText>
        <WizArrayInput
          path="list.elements"
          label={t('List elements')}
          placeholder={t('Add element')}
          collapsedContent="{cluster}"
        >
          <WizTextInput
            path="cluster"
            label={t('Cluster')}
            placeholder={t('Enter the cluster name')}
            required
            disabled={disableForm}
          />
          <WizTextInput
            path="url"
            label={t('URL')}
            placeholder={t('Enter the cluster URL')}
            required
            disabled={disableForm}
          />
        </WizArrayInput>
      </WizHidden>
      {/* Clusters generator - uses a cluster selector to determine target cluster */}
      <WizHidden hidden={() => generatorType !== 'clusters'}>
        <HelperText>
          <HelperTextItem>{t('Use a cluster selector to determine target clusters')}</HelperTextItem>
        </HelperText>
        <WizKeyValue
          path="clusters.selector.matchLabels"
          label={t('Match labels')}
          labelHelp={t('Labels to match clusters by')}
          placeholder={t('Add label')}
          disabled={disableForm}
        />
      </WizHidden>
      {/* SCM Provider generator - uses an SCM provider to determine target clusters */}
      <WizHidden hidden={() => generatorType !== 'scmProvider'}>
        <HelperText>
          <HelperTextItem>{t('Use an SCM provider to determine target clusters')}</HelperTextItem>
        </HelperText>
        <WizTextInput
          path="scmProvider.github.organization"
          label={t('Organization')}
          placeholder={t('Enter the GitHub organization')}
          required
          disabled={disableForm}
        />
        <WizTextInput
          path="scmProvider.github.api"
          label={t('API URL')}
          placeholder={t('Enter the GitHub API URL')}
          disabled={disableForm}
        />
        <WizCheckbox path="scmProvider.github.allBranches" label={t('All branches')} disabled={disableForm} />
        <WizTextInput
          path="scmProvider.github.tokenRef.secretName"
          label={t('Token secret name')}
          placeholder={t('Enter the token secret name')}
          disabled={disableForm}
        />
        <WizTextInput
          path="scmProvider.github.tokenRef.key"
          label={t('Token key')}
          placeholder={t('Enter the token key')}
          disabled={disableForm}
        />
        <WizTextInput
          path="scmProvider.github.appSecretName"
          label={t('App secret name')}
          placeholder={t('Enter the app secret name')}
          disabled={disableForm}
        />
      </WizHidden>
      {/* Pull Request generator - uses a Pull Request to determine target clusters */}
      <WizHidden hidden={() => generatorType !== 'pullRequest'}>
        <HelperText>
          <HelperTextItem>{t('Use a Pull Request to determine target clusters')}</HelperTextItem>
        </HelperText>
        <WizTextInput
          path="pullRequest.github.owner"
          label={t('Owner')}
          placeholder={t('Enter the GitHub owner')}
          required
          disabled={disableForm}
        />
        <WizTextInput
          path="pullRequest.github.repo"
          label={t('Repository')}
          placeholder={t('Enter the repository name')}
          required
          disabled={disableForm}
        />
        <WizTextInput
          path="pullRequest.github.api"
          label={t('API URL')}
          placeholder={t('Enter the GitHub API URL')}
          disabled={disableForm}
        />
        <WizTextInput
          path="pullRequest.github.tokenRef.secretName"
          label={t('Token secret name')}
          placeholder={t('Enter the token secret name')}
          disabled={disableForm}
        />
        <WizTextInput
          path="pullRequest.github.tokenRef.key"
          label={t('Token key')}
          placeholder={t('Enter the token key')}
          disabled={disableForm}
        />
        <WizTextInput
          path="pullRequest.github.appSecretName"
          label={t('App secret name')}
          placeholder={t('Enter the app secret name')}
          disabled={disableForm}
        />
        <WizMultiSelect
          path="pullRequest.github.labels"
          label={t('Labels')}
          placeholder={t('Enter labels')}
          options={[]}
          isCreatable
          disabled={disableForm}
        />
        <WizSelect
          path="pullRequest.requeueAfterSeconds"
          label={t('Requeue time')}
          options={requeueTimes}
          labelHelp={t('Pull request requeue time in seconds')}
          disabled={disableForm}
        />
      </WizHidden>
      {/* Plugin generator - uses a Plugin to determine target clusters */}
      <WizHidden hidden={() => generatorType !== 'plugin'}>
        <HelperText>
          <HelperTextItem>{t('Use a Plugin to determine target clusters')}</HelperTextItem>
        </HelperText>
        <WizTextInput
          path="plugin.configMapRef.name"
          label={t('ConfigMap name')}
          placeholder={t('Enter the ConfigMap name')}
          required
          disabled={disableForm}
        />
        <WizKeyValue
          path="plugin.input.parameters"
          label={t('Input parameters')}
          labelHelp={t('Key-value parameters to pass to the plugin')}
          placeholder={t('Add input parameter')}
          disabled={disableForm}
        />
        <WizKeyValue
          path="plugin.values"
          label={t('Values')}
          labelHelp={t('Values to include in the generated parameters')}
          placeholder={t('Add value')}
          disabled={disableForm}
        />
        <WizSelect
          path="plugin.requeueAfterSeconds"
          label={t('Requeue time')}
          options={requeueTimes}
          labelHelp={t('Plugin requeue time in seconds')}
          disabled={disableForm}
        />
      </WizHidden>
    </div>
  )
}

export interface SyncGeneratorProps {
  setGeneratorPath: (path: string) => void
  prevGenState: React.MutableRefObject<{ hasGitGen?: boolean; hasListGen?: boolean }>
  generatorPath: string
}

// syncs the app name with the template name based on the generators selected
export function SyncGenerator(props: SyncGeneratorProps) {
  const { setGeneratorPath, prevGenState, generatorPath } = props
  const item = useContext(ItemContext)
  const { update } = useData()
  const appName = get(item, 'metadata.name')
  const generators = get(item, generatorPath) as IResource[] | undefined
  const generatorsString = JSON.stringify(generators)
  const { hasGitGen, hasListGen } = useMemo(
    () => ({
      hasGitGen: generators?.some((gen: unknown) => getGeneratorType(gen) === 'git'),
      hasListGen: generators?.some((gen) => getGeneratorType(gen) === 'list'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generatorsString]
  )

  // fixup yaml based on what generators are selected
  useEffect(() => {
    if (!generators) return

    let shouldUpdate = false

    function fix(path: string, value: unknown) {
      set(item, path, value, { preservePaths: true })
      shouldUpdate = true
    }

    const matrixGenerator = get(item, 'spec.generators.0.matrix')
    // if there are more than one generator and no matrix generator, add a matrix generator
    if (generators.length > 1 && !matrixGenerator) {
      setGeneratorPath('spec.generators.0.matrix.generators')
      fix('spec.generators', [{ matrix: { generators: generators } }])
    }
    // if is one generator and a matrix generator, remove the matrix generator
    if (generators.length === 1 && matrixGenerator?.generators.length === 1) {
      setGeneratorPath('spec.generators')
      fix('spec.generators', generators)
    }
    // clean up errant syncs
    if (matrixGenerator && generators.length === 1 && Object.keys(generators[0]).length > 1) {
      fix('spec.generators', [{ matrix: matrixGenerator }])
    }

    const url = '{{.url}}'
    const cluster = '{{.cluster}}'
    const server = '{{server}}'
    const pathBasename = '{{path.basename}}'
    const templateNamePath = 'spec.template.metadata.name'
    const destinationNamePathNamespace = 'spec.template.spec.destination.namespace'
    const destinationNamePathServer = 'spec.template.spec.destination.server'
    const templateName = get(item, templateNamePath) ?? ''

    // Handle git generator
    if (hasGitGen) {
      if (
        !templateName.startsWith(appName) ||
        !templateName.includes('{{name}}') ||
        !templateName.includes(pathBasename)
      ) {
        fix(templateNamePath, `${appName}-{{name}}-${pathBasename}`)
        fix(destinationNamePathNamespace, `${pathBasename}`)
      }
    }

    // Handle list generator
    if (hasListGen) {
      if (templateName !== `${appName}-${cluster}`) {
        fix(templateNamePath, `${appName}-${cluster}`)
        fix(destinationNamePathServer, url)
      }
    }

    // handle generators that don't affect template
    if (!hasGitGen && !hasListGen) {
      if (templateName !== `${appName}-{{name}}`) {
        fix(templateNamePath, `${appName}-{{name}}`)
      }
      // Only reset destination when hasGitGen or hasListGen have changed
      if (prevGenState.current.hasGitGen !== hasGitGen || prevGenState.current.hasListGen !== hasListGen) {
        fix(destinationNamePathNamespace, '')
        fix(destinationNamePathServer, server)
      }
    }

    prevGenState.current = { hasGitGen, hasListGen }

    if (shouldUpdate) {
      update()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatorPath, appName, hasGitGen, hasListGen])

  return <></>
}

function getGeneratorType(generator: unknown): string {
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

function createGeneratorFromSpecification(specification: (typeof Specifications)[number]) {
  return klona(specification.generatorTemplate)
}

export const Specifications: {
  name: string
  description: string
  generatorTemplate: object
}[] = [
  getGeneratorSpecification('Cluster Decision Resource generator', generatorClusterDecisionResource),
  getGeneratorSpecification('Git generator', generatorGit),
  getGeneratorSpecification('List generator', generatorList),
  getGeneratorSpecification('Clusters generator', generatorClusters),
  getGeneratorSpecification('SCM Provider generator', generatorSCMProvider),
  getGeneratorSpecification('Pull Request generator', generatorPullRequest),
  getGeneratorSpecification('Plugin generator', generatorPlugin),
].sort((a, b) => {
  if (a.name < b.name) {
    return -1
  }
  return a.name > b.name ? 1 : 0
})

function getGeneratorSpecification(description: string, yaml: string) {
  const resource = YAML.parseAllDocuments(yaml).map((doc) => doc.toJSON())
  return {
    name: description,
    description,
    generatorTemplate: resource as object,
  }
}

function pascalCaseToSentenceCase(text: string) {
  const result = text?.replace(/([A-Z])/g, ' $1') ?? ''
  const finalResult = result.charAt(0).toUpperCase() + result.slice(1)
  return finalResult
}
