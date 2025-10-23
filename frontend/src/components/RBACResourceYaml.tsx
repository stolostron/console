/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../lib/acm-i18next'
import jsYaml from 'js-yaml'
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
  const editorHeight = useYamlEditorHeight()

  switch (true) {
    case loading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case !resource: {
      const getNotFoundMessage = () => {
        if (resourceType === 'User') return t('User not found')
        if (resourceType === 'Group') return t('Group not found')
        return t('Role not found')
      }

      return (
        <PageSection>
          <div>{getNotFoundMessage()}</div>
        </PageSection>
      )
    }
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
          <YamlEditor
            resourceYAML={jsYaml.dump(orderedResource, { indent: 2 })}
            readOnly={true}
            height={editorHeight}
          />
        </PageSection>
      )
    }
  }
}

export { RBACResourceYaml }
