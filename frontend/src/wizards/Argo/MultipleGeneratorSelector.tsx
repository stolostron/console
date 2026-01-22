/* eslint-disable prettier/prettier */
import { css } from '@emotion/css'
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
import { useContext, useMemo } from 'react'
import set from 'set-value'
import {
  useEditMode,
  ItemContext,
  EditMode,
  WizArrayInput,
  WizHidden,
  WizSelect,
  Section,
  useData,
  WizTextInput,
} from '@patternfly-labs/react-form-wizard'
import { IResource } from '../common/resources/IResource'
import { useTranslation } from '../../lib/acm-i18next'

const fieldGroupBodyGapOverride = css`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .pf-v6-c-form__field-group-body {
    gap: 8px;
  }
`

const hideLastChild = css`
  > * > *:last-child {
    display: none !important;
  }
`

export function MultipleGeneratorSelector(props: { resources: IResource[], disableForm: boolean }) {
  const appSet = useContext(ItemContext) || ({} as IResource)
  const { update } = useData() // Wizard framework sets this context
  let generatorPath = 'spec.generators'
  let generators = get(appSet, generatorPath)
  const matrixGenerator = generators?.[0]?.matrix
  if (matrixGenerator && matrixGenerator.generators) {
    generatorPath = 'spec.generators.0.matrix.generators'
    generators = matrixGenerator.generators
  }

  // if there are more than one generator and no matrix generator, add a matrix generator
  if (generators && generators.length > 1 && !matrixGenerator) {
    set(appSet, 'spec.generators', [{matrix: {generators: generators}}], { preservePaths: false })
    update()
  }
  // if is one generator and a matrix generator, remove the matrix generator
  if (generators && generators.length === 1 && matrixGenerator) {
    set(appSet, 'spec.generators', generators, { preservePaths: false })
    update()
  }


  const editMode = useEditMode()
  const { t } = useTranslation()
  return (
    <Section
      label={t('Generators')}
      description={t(
        'Generators determine where applications are deployed by substituting values into a template from which applications are created. Up to two generators may be defined. '
      )}
    >
      <div className={`${fieldGroupBodyGapOverride} ${generators?.length >= 2 ? hideLastChild : ''}`}>
        <WizArrayInput
          key="generators"
          id="generators"
          path={generatorPath}
          placeholder={t('Add generator')}
          required
          dropdownItems={Specifications.map((specification) => ({
            label: specification.description,
            action: () => createGeneratorFromSpecification(specification),
          }))}
          collapsedContent={<GeneratorCollapsedContent />}
          defaultCollapsed={editMode !== EditMode.Create}
        >
          <GeneratorInputForm disableForm={props.disableForm} generatorPath={generatorPath} />
        </WizArrayInput>
      </div>
    </Section>
  )
}

function GeneratorCollapsedContent() {
 const generator = useContext(ItemContext)
  const generatorType = getGeneratorType(generator)
  const { t } = useTranslation()
  return <div>
    <Title headingLevel="h6">{t('{{type}} Generator', { type: pascalCaseToSentenceCase(generatorType) })}</Title>
  </div>
}

function GeneratorInputForm(props: { disableForm: boolean, generatorPath: string }) {
  const generator = useContext(ItemContext)
  const generatorType = getGeneratorType(generator)
  const requeueTimes = useMemo(() => [30, 60, 120, 180, 300], [])
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <WizHidden hidden={() => generatorType !== 'clusterDecisionResource'}>
        <HelperText>
          <HelperTextItem >{t('Cluster names are defined in the Placement step')}</HelperTextItem>
        </HelperText>
        <WizSelect
          path="clusterDecisionResource.requeueAfterSeconds"
          label={t('Requeue time')}
          options={requeueTimes}
          labelHelp={t('Cluster decision resource requeue time in seconds')}
          required
          disabled={props.disableForm}
        />
      </WizHidden>
      <WizHidden hidden={() => generatorType !== 'git'}>
        <HelperText>
          <HelperTextItem>{t('Cluster names are defined in the Placement step')}</HelperTextItem>
        </HelperText>
        <WizTextInput
          path="git.repoURL"
          label={t('Repository URL')}
          placeholder={t('Enter the repository URL')}
          required
          disabled={props.disableForm}
        />
        
      </WizHidden>

      <WizHidden hidden={() => generatorType !== 'unknown'}>
        <div>
          <Title headingLevel="h6">Generator</Title>
        </div>
      </WizHidden>
    </div>
  )
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

// function isExistingTemplateName(name: string, policies: IResource[]) {
//   for (const policy of policies) {
//     const existingTemplates = get(policy, 'spec.policy-templates')
//     if (Array.isArray(existingTemplates)) {
//       if (
//         existingTemplates.find((existingTemplate) => {
//           return get(existingTemplate, 'objectDefinition.metadata.name') === name
//         })
//       ) {
//         return true
//       }
//     }
//   }
//   return false
// }

function createGeneratorFromSpecification(specification: (typeof Specifications)[number]) {
  return klona(specification.generatorTemplate)

  // const generatorName = get(generator, 'metadata.name')
  // if (policyName) {
  //   newPolicyTemplates.forEach((t) => {
  //     const name: string = get(t, 'objectDefinition.metadata.name')
  //     if (name) {
  //       set(t, 'objectDefinition.metadata.name', name.replace('{{name}}', policyName))
  //     }
  //   })
  // }

  // // make each policy template name unique in policy and globally
  // if (policy) {
  //   const existingTemplates = get(policy, 'spec.policy-templates')
  //   for (const newPolicyTemplate of newPolicyTemplates) {
  //     const name: string = get(newPolicyTemplate, 'objectDefinition.metadata.name')
  //     if (!name) continue
  //     let counter = 1
  //     let newName = name
  //     while (
  //       (Array.isArray(existingTemplates) &&
  //         existingTemplates.find((existingTemplate) => {
  //           return get(existingTemplate, 'objectDefinition.metadata.name') === newName
  //         })) ||
  //       isExistingTemplateName(newName, props.resources)
  //     ) {
  //       newName = name + '-' + (counter++).toString()
  //     }
  //     set(newPolicyTemplate, 'objectDefinition.metadata.name', newName)
  //   }
  // }
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
