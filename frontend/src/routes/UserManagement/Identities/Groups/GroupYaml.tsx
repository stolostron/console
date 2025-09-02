/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'
import { dump } from 'js-yaml'
import YamlEditor from '../../../../components/YamlEditor'
import { AcmLoadingPage } from '../../../../ui-components'
import { useYamlEditorHeight } from '../../../../hooks/useYamlEditorHeight'
import { useGroupDetailsContext } from './GroupPage'

const GroupYaml = () => {
  const { t } = useTranslation()
  const { group, loading } = useGroupDetailsContext()

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
        <PageSection>
          <div>{t('Group not found')}</div>
        </PageSection>
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
