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
  Spinner,
} from '@patternfly/react-core'
import { useTranslation } from '../lib/acm-i18next'

const backdropClass = css({
  position: 'absolute',
})

export function ReconnectingOverlay() {
  const { t } = useTranslation()
  return (
    <Backdrop className={backdropClass} data-testid="reconnecting-overlay">
      <Bullseye>
        <Card>
          <CardBody>
            <Flex
              direction={{ default: 'column' }}
              alignItems={{ default: 'alignItemsCenter' }}
              gap={{ default: 'gapMd' }}
            >
              <FlexItem>
                <Spinner size="xl" />
              </FlexItem>
              <FlexItem>
                <Content component={ContentVariants.p}>{t('Reconnecting')}</Content>
              </FlexItem>
            </Flex>
          </CardBody>
        </Card>
      </Bullseye>
    </Backdrop>
  )
}
