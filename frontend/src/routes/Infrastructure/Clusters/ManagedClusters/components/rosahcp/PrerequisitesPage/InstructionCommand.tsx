import { ClipboardCopy, clipboardCopyFunc, Content } from '@patternfly/react-core'

type Props = {
  children: string
  textAriaLabel?: string
  className?: string
}

const InstructionCommand = ({ children, textAriaLabel, className, ...props }: Props) => {
  return (
    <Content component="pre" className={className}>
      <ClipboardCopy
        isReadOnly
        textAriaLabel={textAriaLabel}
        onCopy={(event, text) => {
          clipboardCopyFunc(event, text)
        }}
        className={className}
        {...props}
      >
        {children}
      </ClipboardCopy>
    </Content>
  )
}

export default InstructionCommand
