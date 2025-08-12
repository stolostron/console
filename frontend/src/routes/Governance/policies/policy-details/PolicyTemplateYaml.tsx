/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import YamlEditor from '../../../../components/YamlEditor'
import jsYaml from 'js-yaml'
import { useYamlEditorHeight } from '../../../../hooks/useYamlEditorHeight'
import { useTemplateDetailsContext } from './PolicyTemplateDetail/PolicyTemplateDetailsPage'

export default function PolicyTemplateYaml() {
  const { template } = useTemplateDetailsContext()
  const editorHeight = useYamlEditorHeight()

  return (
    <PageSection>
      <YamlEditor resourceYAML={jsYaml.dump(template, { indent: 2 })} readOnly={true} height={editorHeight} />
    </PageSection>
  )
}
