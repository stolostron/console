/* Copyright Contributors to the Open Cluster Management project */
import { FormHelperText, HelperText, HelperTextItem, Split, SplitItem } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { ReactNode } from 'react'
import { LinkType, Prompt } from '../../components/AcmFormData'
import { AcmButton } from '../AcmButton'

type HelperTextVariant = 'error' | 'warning' | undefined

function resolveHelperDisplay(
  validated: string | undefined,
  error: string | undefined,
  warning: string | undefined,
  helperText: ReactNode
): { displayText: ReactNode; variant: HelperTextVariant } {
  switch (validated) {
    case 'error':
      return { displayText: error, variant: 'error' }
    case 'warning':
      return { displayText: warning, variant: 'warning' }
    default:
      return { displayText: helperText, variant: undefined }
  }
}

type AcmHelperTextProps = {
  controlId: string
  helperText: ReactNode
  validated?: string
  error?: string
  warning?: string
  prompt?: Prompt
}

export function AcmHelperText({ controlId, helperText, validated, error, warning, prompt }: AcmHelperTextProps) {
  const isError = validated === 'error'
  const isWarning = validated === 'warning'
  const showHelperText = !!(
    (isError && error) ||
    (isWarning && warning) ||
    (!isError && !isWarning && helperText) ||
    prompt
  )
  const { displayText, variant } = resolveHelperDisplay(validated, error, warning, helperText)

  return showHelperText ? (
    <FormHelperText id={`${controlId}-helper`}>
      <Split>
        <SplitItem isFilled>
          <HelperText>
            <HelperTextItem variant={variant}>{displayText}</HelperTextItem>
          </HelperText>
        </SplitItem>
        {prompt && (
          <SplitItem>
            <AcmButton
              variant="link"
              onClick={prompt.callback}
              isDisabled={prompt.isDisabled}
              icon={
                prompt.linkType === LinkType.external || prompt.linkType === LinkType.internalNewTab ? (
                  <ExternalLinkAltIcon />
                ) : undefined
              }
              iconPosition="right"
            >
              {prompt.text}
            </AcmButton>
          </SplitItem>
        )}
      </Split>
    </FormHelperText>
  ) : null
}
