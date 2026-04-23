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
  Spinner,
} from '@patternfly/react-core'
import { PauseCircleIcon } from '@patternfly/react-icons'
import { useTranslation } from '../lib/acm-i18next'

const backdropClass = css({
  position: 'absolute',
})

// Both variants (idle / reconnecting) are rendered into each grid cell, with
// the inactive one set to visibility:hidden. Because all children overlap in
// the same grid area, the cell always sizes to the largest child. This keeps
// the card dimensions stable when switching between variants.
const stableCell = css({
  display: 'grid',
  justifyItems: 'center',
  alignItems: 'center',
  '& > *': {
    gridColumn: 1,
    gridRow: 1,
  },
})

const hidden = css({
  visibility: 'hidden',
})

export function StreamStatusOverlay(props: Readonly<{ variant: 'idle' | 'reconnecting' }>) {
  const { t } = useTranslation()
  const idle = props.variant === 'idle'
  const idleText = t('Session paused due to inactivity')
  const reconnectingText = t('Reconnecting')
  return (
    <Backdrop className={backdropClass} data-testid={`${props.variant}-overlay`}>
      <Bullseye>
        <Card>
          <CardBody>
            <Flex
              direction={{ default: 'column' }}
              alignItems={{ default: 'alignItemsCenter' }}
              gap={{ default: 'gapMd' }}
            >
              <FlexItem>
                <div className={stableCell}>
                  <Icon size="3xl" className={idle ? undefined : hidden}>
                    <PauseCircleIcon />
                  </Icon>
                  <Spinner size="xl" className={idle ? hidden : undefined} />
                </div>
              </FlexItem>
              <FlexItem>
                <div className={stableCell}>
                  <Content component={ContentVariants.p}>{idle ? idleText : reconnectingText}</Content>
                  <Content className={hidden} component={ContentVariants.p} aria-hidden="true">
                    {idle ? reconnectingText : idleText}
                  </Content>
                </div>
              </FlexItem>
            </Flex>
          </CardBody>
        </Card>
      </Bullseye>
    </Backdrop>
  )
}
