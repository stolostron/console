/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../lib/acm-i18next'
import { dump } from 'js-yaml'
import YamlEditor from './YamlEditor'
import { AcmLoadingPage } from '../ui-components'
import { useYamlEditorHeight } from '../hooks/useYamlEditorHeight'

interface RBACResourceYamlProps<T> {
  resource: T | undefined
  loading: boolean
  resourceType: 'User' | 'Group'
}

const RBACResourceYaml = <T,>({ resource, loading, resourceType }: RBACResourceYamlProps<T>) => {
  const { t } = useTranslation()
  const baseHeight = useYamlEditorHeight()
  const customHeight = Math.min(baseHeight, 450)

  switch (true) {
    case loading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case !resource:
      return (
        <PageSection>
          <div>{resourceType === 'User' ? t('User not found') : t('Group not found')}</div>
        </PageSection>
      )
    default:
      return (
        <PageSection>
          <YamlEditor resourceYAML={dump(resource, { indent: 2 })} readOnly={true} height={customHeight} />
        </PageSection>
      )
  }
}

export { RBACResourceYaml }
