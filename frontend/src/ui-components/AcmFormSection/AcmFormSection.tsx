/* Copyright Contributors to the Open Cluster Management project */

import { useMediaQuery } from '@material-ui/core'
import { Button, Popover, Split, SplitItem, Title, TitleProps } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import { Fragment } from 'react'

export type AcmFormSectionProps = Omit<TitleProps, 'headingLevel'> & {
    title: string
    tooltip?: string
    spacing?: boolean
}

export function AcmFormSection(props: AcmFormSectionProps) {
    const isFullWidthPage = useMediaQuery('(min-width: 1200px)', { noSsr: true })

    /* istanbul ignore next */
    const marginTop = props.spacing ? (isFullWidthPage ? '24px' : '16px') : undefined

    return (
        <Split style={{ marginTop }}>
            <SplitItem>
                <Title {...props} headingLevel="h2" size="xl">
                    {props.title}
                </Title>
            </SplitItem>
            {props.tooltip && (
                <SplitItem>
                    <Fragment>
                        &nbsp;
                        <Popover
                            id={`${props.id}-label-help-popover`}
                            headerContent={'labelHelpTitle'}
                            bodyContent={'labelHelp'}
                        >
                            <Button
                                variant="plain"
                                id={`${props.id}-label-help-button`}
                                aria-label="More info"
                                onClick={/* istanbul ignore next */ (e) => e.preventDefault()}
                                className="pf-c-form__group-label-help"
                            >
                                <HelpIcon noVerticalAlign size="sm" />
                            </Button>
                        </Popover>
                    </Fragment>
                </SplitItem>
            )}
        </Split>
    )
}
