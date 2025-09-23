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
  resourceType: 'User' | 'Group' | 'Role'
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
          <div>
            {resourceType === 'User'
              ? t('User not found')
              : resourceType === 'Group'
                ? t('Group not found')
                : t('Role not found')}
          </div>
        </PageSection>
      )
    default: {
      // Reorder the resource to match Kubernetes standard format (first three fields)
      const orderedResource =
        resource && typeof resource === 'object'
          ? {
              apiVersion: (resource as any).apiVersion,
              kind: (resource as any).kind,
              metadata: (resource as any).metadata,
              ...resource,
            }
          : resource

      return (
        <PageSection>
          <YamlEditor resourceYAML={dump(orderedResource, { indent: 2 })} readOnly={true} height={customHeight} />
        </PageSection>
      )
    }
  }
}

export { RBACResourceYaml }
