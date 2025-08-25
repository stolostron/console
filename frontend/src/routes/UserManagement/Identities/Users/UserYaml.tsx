/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { dump } from 'js-yaml'
import YamlEditor from '../../../../components/YamlEditor'
import { AcmLoadingPage } from '../../../../ui-components'
import { useYamlEditorHeight } from '../../../../hooks/useYamlEditorHeight'
import { useUserDetailsContext } from './UserPage'

const UserYaml = () => {
  const { t } = useTranslation()
  const { user, loading } = useUserDetailsContext()

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
