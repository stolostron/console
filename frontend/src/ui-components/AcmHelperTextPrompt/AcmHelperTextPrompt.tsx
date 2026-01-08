/* Copyright Contributors to the Open Cluster Management project */

import { Button, Split, SplitItem } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { ReactNode } from 'react'

export type AcmHelperTextPromptProps = {
  helperText?: ReactNode
  prompt?: { label?: string; href?: string; isDisabled?: boolean }
}

export function AcmHelperTextPrompt(props: AcmHelperTextPromptProps) {
  const { helperText, prompt } = props
  return (
    <Split>
      <SplitItem isFilled>
        <span className="pf-v6-c-form__helper-text">{helperText}</span>
      </SplitItem>
      <SplitItem>
        <Button
          variant="link"
          isInline
          onClick={() => window.open(prompt?.href)}
          isDisabled={prompt?.isDisabled}
          icon={<ExternalLinkAltIcon />}
          iconPosition="end"
        >
          {prompt?.label}
        </Button>
      </SplitItem>
    </Split>
  )
}
