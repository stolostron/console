/* Copyright Contributors to the Open Cluster Management project */

import { useMediaQuery } from '@mui/material'
import { Button, Icon, Popover, Split, SplitItem, Title, TitleProps } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import { Fragment } from 'react'
import { useTranslation } from '../../lib/acm-i18next'

export type AcmFormSectionProps = Omit<TitleProps, 'headingLevel'> & {
  title: string
  tooltip?: string
  spacing?: boolean
}

export function AcmFormSection(props: AcmFormSectionProps) {
  const isFullWidthPage = useMediaQuery('(min-width: 1200px)', { noSsr: true })

  /* istanbul ignore next */
  const marginTop = props.spacing ? (isFullWidthPage ? '24px' : '16px') : undefined
  const { t } = useTranslation()
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
            <Popover id={`${props.id}-label-help-popover`} headerContent={'labelHelpTitle'} bodyContent={'labelHelp'}>
              <Button
                variant="plain"
                id={`${props.id}-label-help-button`}
                aria-label={t('More info')}
                onClick={/* istanbul ignore next */ (e) => e.preventDefault()}
                className="pf-v5-c-form__group-label-help"
                style={{ ['--pf-v5-c-form__group-label-help--TranslateY' as any]: 0 }}
                icon={
                  <Icon size="sm">
                    <HelpIcon />
                  </Icon>
                }
              />
            </Popover>
          </Fragment>
        </SplitItem>
      )}
    </Split>
  )
}
