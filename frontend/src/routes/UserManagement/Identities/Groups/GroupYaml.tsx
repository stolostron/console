/* Copyright Contributors to the Open Cluster Management project */
import { Page, PageSection } from '@patternfly/react-core'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useQuery } from '../../../../lib/useQuery'
import { listGroups } from '../../../../resources/rbac'
import { useMemo } from 'react'
import { dump } from 'js-yaml'
import YamlEditor from '../../../../components/YamlEditor'
import { AcmButton, AcmLoadingPage } from '../../../../ui-components'
import { useYamlEditorHeight } from '../../../../hooks/useYamlEditorHeight'
import { ErrorPage } from '../../../../components/ErrorPage'
import { NavigationPath } from '../../../../NavigationPath'
import { ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { useNavigate } from 'react-router-dom-v5-compat'

const GroupYaml = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const { data: groups, loading } = useQuery(listGroups)
  const navigate = useNavigate()

  const group = useMemo(
    () => (id ? groups?.find((u) => u.metadata.uid === id || u.metadata.name === id) : undefined),
    [groups, id]
  )
  const baseHeight = useYamlEditorHeight()
  const customHeight = Math.min(baseHeight, 450)

  switch (true) {
    case loading:
      return (
        <PageSection>
          <AcmLoadingPage />
        </PageSection>
      )
    case !group:
      return (
        <Page>
          <ErrorPage
            error={new ResourceError(ResourceErrorCode.NotFound)}
            actions={
              <AcmButton
                role="link"
                onClick={() => navigate(NavigationPath.identitiesGroups)}
                style={{ marginRight: '10px' }}
              >
                {t('button.backToGroups')}
              </AcmButton>
            }
          />
        </Page>
      )
    default:
      return (
        <PageSection>
          <YamlEditor resourceYAML={dump(group, { indent: 2 })} readOnly={true} height={customHeight} />
        </PageSection>
      )
  }
}

export { GroupYaml }
