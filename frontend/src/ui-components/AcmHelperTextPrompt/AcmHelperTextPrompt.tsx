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
        <span className="pf-c-form__helper-text">{helperText}</span>
      </SplitItem>
      <SplitItem>
        <Button
          variant="link"
          style={{ paddingRight: '0px' }}
          onClick={() => window.open(prompt?.href)}
          isDisabled={prompt?.isDisabled}
          icon={<ExternalLinkAltIcon />}
          iconPosition="right"
        >
          {prompt?.label}
        </Button>
      </SplitItem>
    </Split>
  )
}
