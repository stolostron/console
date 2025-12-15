/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { Stack, StackItem, Text, Button, Flex, FlexItem, Card, CardBody } from '@patternfly/react-core'
import { AngleLeftIcon, AngleRightIcon } from '@patternfly/react-icons'
import { useTranslation } from '../../../../lib/acm-i18next'
import { ExampleScopeBase } from './ExampleScopeBase'

export const ExampleScopes = () => {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = 9

  const handlePrevious = () => setCurrentStep((prev) => Math.max(0, prev - 1))
  const handleNext = () => setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1))

  return (
    <Stack hasGutter>
      <StackItem>
        <Text>{t('These examples show different ways to scope role assignments.')}</Text>
      </StackItem>

      <StackItem>
        <Flex justifyContent={{ default: 'justifyContentCenter' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Button
              variant="plain"
              icon={<AngleLeftIcon />}
              onClick={handlePrevious}
              aria-label={t('Previous example')}
              isDisabled={currentStep === 0}
            />
          </FlexItem>
          <FlexItem>
            <Text>{t('Example {{current}} of {{total}}', { current: currentStep + 1, total: totalSteps })}</Text>
          </FlexItem>
          <FlexItem>
            <Button
              variant="plain"
              icon={<AngleRightIcon />}
              onClick={handleNext}
              aria-label={t('Next example')}
              isDisabled={currentStep === totalSteps - 1}
            />
          </FlexItem>
        </Flex>
      </StackItem>

      <StackItem>
        <Card>
          <CardBody
            style={{
              backgroundColor: 'var(--pf-v5-global--BackgroundColor--200)', // #f5f5f5 - rgb(245, 245, 245)
            }}
          >
            <ExampleScopeBase exampleIndex={currentStep} />
          </CardBody>
        </Card>
      </StackItem>
    </Stack>
  )
}
