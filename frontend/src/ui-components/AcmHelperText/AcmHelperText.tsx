/* Copyright Contributors to the Open Cluster Management project */
import { FormHelperText, HelperText, HelperTextItem, Split, SplitItem } from '@patternfly/react-core'
import { ReactNode } from 'react'
import { LinkType, Prompt } from '../../components/AcmFormData'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { AcmButton } from '../AcmButton'

type AcmHelperTextProps = {
  controlId: string
  helperText: ReactNode
  validated?: string
  error?: string
  prompt?: Prompt
}

export function AcmHelperText({ controlId, helperText, validated, error, prompt }: AcmHelperTextProps) {
  const isError = validated === 'error'
  const showHelperText = !!((isError && error) || (!isError && helperText) || prompt)
  const helperTextOrError = validated === 'error' ? error : helperText

  return showHelperText ? (
    <FormHelperText id={`${controlId}-helper`}>
      <Split>
        <SplitItem isFilled>
          <HelperText>
            <HelperTextItem variant={isError ? 'error' : undefined}>{helperTextOrError}</HelperTextItem>
          </HelperText>
        </SplitItem>
        {prompt && (
          <SplitItem>
            <AcmButton
              variant="link"
              style={{ ['--pf-v5-c-button--PaddingRight' as any]: '0px' }}
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
