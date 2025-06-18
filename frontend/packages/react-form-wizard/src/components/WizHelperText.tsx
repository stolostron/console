import { Button, FormHelperText, HelperText, HelperTextItem, Split, SplitItem } from '@patternfly/react-core'
import { InputCommonProps, useInputValidation } from '../inputs/Input'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'

export function WizHelperText(props: Partial<Omit<InputCommonProps, 'path'>> & { path: string | null }) {
    const { validated, error } = useInputValidation({ ...props, path: props.path || '' })
    const { helperText, prompt } = props
    const showHelperText = !!((validated === 'error' && error) || (validated !== 'error' && helperText) || prompt)
    const helperTextOrError = validated === 'error' ? error : helperText

    return showHelperText ? (
        <FormHelperText>
            <Split>
                <SplitItem isFilled>
                    <HelperText>
                        <HelperTextItem variant={validated}>{helperTextOrError}</HelperTextItem>
                    </HelperText>
                </SplitItem>
                {prompt?.label && prompt?.href && (
                    <SplitItem>
                        <Button
                            variant="link"
                            style={{ ['--pf-v5-c-button--PaddingRight' as any]: '0px' }}
                            onClick={() => window.open(prompt?.href)}
                            isDisabled={prompt?.isDisabled}
                            icon={<ExternalLinkAltIcon />}
                            iconPosition="right"
                        >
                            {prompt?.label}
                        </Button>
                    </SplitItem>
                )}
            </Split>
        </FormHelperText>
    ) : null
}
