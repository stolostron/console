/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import {
  Backdrop,
  Bullseye,
  Card,
  CardBody,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Icon,
} from '@patternfly/react-core'
import { PauseCircleIcon } from '@patternfly/react-icons'
import { useTranslation } from '../lib/acm-i18next'

const wrapperClass = css({
  position: 'relative',
  height: '100%',
})

const backdropClass = css({
  position: 'absolute',
})

export function IdleOverlay(props: Readonly<{ children?: React.ReactNode }>) {
  const { t } = useTranslation()
  return (
    <div className={wrapperClass}>
      <Backdrop className={backdropClass} data-testid="idle-overlay">
        <Bullseye>
          <Card>
            <CardBody>
              <Flex
                direction={{ default: 'column' }}
                alignItems={{ default: 'alignItemsCenter' }}
                gap={{ default: 'gapMd' }}
              >
                <FlexItem>
                  <Icon size="3xl">
                    <PauseCircleIcon />
                  </Icon>
                </FlexItem>
                <FlexItem>
                  <Content component={ContentVariants.p}>{t('Session paused due to inactivity')}</Content>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>
        </Bullseye>
      </Backdrop>
      {props.children}
    </div>
  )
}
