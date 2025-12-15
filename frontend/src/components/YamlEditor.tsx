/* Copyright Contributors to the Open Cluster Management project */
import jsYaml from 'js-yaml'
import { useMemo } from 'react'
import { YamlCodeEditor } from 'nxtcm-components'

/**
 *
 * @param resourceYaml - JSON object of current resource
 * @param fieldPath  - path to field ex: /metadata/labels, /spec/tolerations
 */
export const findResourceFieldLineNumber = (resourceYaml: object, fieldPath: string) => {
  const fieldIndentation = (fieldPath.split('/').length - 2) * 2
  const field = fieldPath.split('/')[fieldPath.split('/').length - 1]
  const indentationStr = ''.padStart(fieldIndentation, ' ')
  const parsedYaml = jsYaml.dump(resourceYaml).split('\n')
  return parsedYaml.indexOf(`${indentationStr}${field}:`) + 1
}

export default function YAMLEditor(props: {
  resourceYAML: string
  readOnly: boolean
  height: number // in pixels - to be converted to string
  setResourceYaml?: React.Dispatch<React.SetStateAction<string>>
  defaultScrollToLine?: number
}) {
  const { resourceYAML, readOnly, height, setResourceYaml } = props

  const editorHeight: string = useMemo(() => {
    return height < 100 ? '100px' : `${height}px`
  }, [height])

  const handleChange = (value: string) => {
    setResourceYaml?.(value)
  }

  return (
    <div
      style={{
        minHeight: '100px',
        flex: 1,
        position: 'relative',
      }}
    >
      <YamlCodeEditor
        code={resourceYAML}
        onChange={setResourceYaml ? handleChange : undefined}
        height={editorHeight}
        isReadOnly={readOnly}
        isLineNumbersVisible={true}
        enableSyntaxHighlighting={true}
      />
    </div>
  )
}
