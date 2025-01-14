/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import YamlEditor from '../../../../components/YamlEditor'
import jsYaml from 'js-yaml'
import { useEffect, useState } from 'react'
import { useTemplateDetailsContext } from './PolicyTemplateDetail/PolicyTemplateDetailsPage'

export default function PolicyTemplateYaml() {
  const { template } = useTemplateDetailsContext()
  const [editorHeight, setEditorHeight] = useState<number>(500)

  useEffect(() => {
    function handleResize() {
      let editorHeight = window.innerHeight - 260
      const globalHeader = document.getElementsByClassName('co-global-notification')
      /* istanbul ignore if */
      if (globalHeader.length > 0) {
        editorHeight = editorHeight - globalHeader.length * 33
      }

      setEditorHeight(editorHeight)
    }
    // init
    handleResize()

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <PageSection>
      <YamlEditor resourceYAML={jsYaml.dump(template, { indent: 2 })} readOnly={true} height={editorHeight} />
    </PageSection>
  )
}
