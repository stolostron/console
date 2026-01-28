/* Copyright Contributors to the Open Cluster Management project */

import { Button, Card, CardBody, Content, Flex, FlexItem, Stack, StackItem } from '@patternfly/react-core'
import { AngleLeftIcon, AngleRightIcon } from '@patternfly/react-icons'
import { useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { ExampleScopeBase } from './ExampleScopeBase'

export const ExampleScopes = () => {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = 11

  const handlePrevious = () => setCurrentStep((prev) => Math.max(0, prev - 1))
  const handleNext = () => setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1))

  return (
    <Stack hasGutter>
      <StackItem>
        <Content component="p">{t('These examples show different ways to scope role assignments.')}</Content>
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
            <Content component="p">
              {t('Example {{current}} of {{total}}', { current: currentStep + 1, total: totalSteps })}
            </Content>
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
              backgroundColor: 'var(--pf-t--global--background--color--secondary--default)',
            }}
          >
            <ExampleScopeBase exampleIndex={currentStep} />
          </CardBody>
        </Card>
      </StackItem>
    </Stack>
  )
}
