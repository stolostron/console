/* Copyright Contributors to the Open Cluster Management project */
import { Alert, PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../../lib/acm-i18next'
import { AcmLoadingPage } from '../../../ui-components'
import YAMLEditor from '../components/YamlEditor/YAMLEditor'
import { useSearchDetailsContext } from './DetailsPage'

export default function YAMLPage() {
  const { resource, resourceLoading, resourceError, isHubClusterResource, name, namespace, cluster, kind, apiversion } =
    useSearchDetailsContext()
  const { t } = useTranslation()

  if (resourceError) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant={'danger'} isInline={true} title={`${t('Error querying for resource:')} ${name}`}>
          {resourceError}
        </Alert>
      </PageSection>
    )
  } else if (resourceLoading) {
    return (
      <PageSection hasBodyWrapper={false}>
        <AcmLoadingPage />
      </PageSection>
    )
  }

  return (
    <YAMLEditor
      resource={resource}
      cluster={cluster}
      kind={kind}
      apiVersion={apiversion}
      name={name}
      namespace={namespace}
      isHubClusterResource={isHubClusterResource}
    />
  )
}
