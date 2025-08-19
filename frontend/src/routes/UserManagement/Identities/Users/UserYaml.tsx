/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { useQuery } from '../../../../lib/useQuery'
import { listUsers } from '../../../../resources/rbac'
import { useMemo } from 'react'
import { dump } from 'js-yaml'
import YamlEditor from '../../../../components/YamlEditor'
import { AcmLoadingPage } from '../../../../ui-components'
import { useYamlEditorHeight } from '../../../../hooks/useYamlEditorHeight'

const UserYaml = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()
  const { data: users, loading } = useQuery(listUsers)

  const user = useMemo(
    () => (id ? users?.find((u) => u.metadata.uid === id || u.metadata.name === id) : undefined),
    [users, id]
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
    case !user:
      return (
        <PageSection>
          <div>{t('User not found')}</div>
        </PageSection>
      )
    default:
      return (
        <PageSection>
          <YamlEditor resourceYAML={dump(user, { indent: 2 })} readOnly={true} height={customHeight} />
        </PageSection>
      )
  }
}

export { UserYaml }
