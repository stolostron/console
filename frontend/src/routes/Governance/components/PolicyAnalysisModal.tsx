/* Copyright Contributors to the Open Cluster Management project */

import {
  Alert,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Skeleton,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import type { IResource } from '../../../resources'
import { getBackendUrl, postRequest } from '../../../resources/utils'

interface DiagnosisResult {
  summary: string
  confidence: string
  rootCause: string
}

interface PolicyAnalysisResponse {
  phase: string
  optionTitle?: string
  diagnosis?: DiagnosisResult
  error?: string
}

const CONFIDENCE_COLORS: Record<string, 'green' | 'orange' | 'red' | 'grey'> = {
  High: 'green',
  Medium: 'orange',
  Low: 'red',
}

export function PolicyAnalysisModal({
  resources,
  isOpen,
  onClose,
}: Readonly<{
  resources: IResource[]
  isOpen: boolean
  onClose: () => void
}>) {
  const { t } = useTranslation()
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [result, setResult] = useState<PolicyAnalysisResponse | undefined>()
  const abortRef = useRef<(() => void) | undefined>()

  useEffect(() => {
    if (!isOpen) return

    setIsFetching(true)
    setError(undefined)
    setResult(undefined)

    const url = getBackendUrl() + '/policy-analysis'
    const { promise, abort } = postRequest<{ resources: IResource[] }, PolicyAnalysisResponse>(url, { resources })
    abortRef.current = abort

    let ignore = false
    promise
      .then((data) => {
        if (ignore) return
        if (data.error) {
          setError(data.error)
        } else {
          setResult(data)
        }
        setIsFetching(false)
      })
      .catch((err) => {
        if (ignore) return
        setError(err instanceof Error ? err.message : String(err))
        setIsFetching(false)
      })

    return () => {
      ignore = true
      abortRef.current?.()
    }
  }, [isOpen, resources])

  return (
    <Modal variant={ModalVariant.large} isOpen={isOpen} onClose={onClose}>
      <ModalHeader title={t('Policy validation')} />
      <ModalBody>
        {isFetching && (
          <Stack hasGutter>
            <StackItem>
              <Alert variant="info" isInline isPlain title={t('Analyzing policy with Red Hat Lightspeed...')} />
            </StackItem>
            <StackItem>
              <Skeleton width="60%" height="1.5em" screenreaderText={t('Loading analysis')} />
            </StackItem>
            <StackItem>
              <Skeleton width="100%" height="6em" />
            </StackItem>
            <StackItem>
              <Skeleton width="80%" height="3em" />
            </StackItem>
          </Stack>
        )}

        {!isFetching && error && (
          <Alert variant="danger" title={t('Analysis failed')} isInline>
            {error}
          </Alert>
        )}

        {!isFetching && result?.diagnosis && (
          <Stack hasGutter>
            {result.optionTitle && (
              <StackItem>
                <Title headingLevel="h3">{result.optionTitle}</Title>
              </StackItem>
            )}

            <StackItem>
              <Label color={CONFIDENCE_COLORS[result.diagnosis.confidence] ?? 'grey'} isCompact>
                {t('Confidence: {{confidence}}', { confidence: result.diagnosis.confidence })}
              </Label>
            </StackItem>

            {result.diagnosis.rootCause && (
              <StackItem>
                <Title headingLevel="h4">{t('Root cause')}</Title>
                <p style={{ marginTop: '4px' }}>{result.diagnosis.rootCause}</p>
              </StackItem>
            )}

            <StackItem>
              <Title headingLevel="h4">{t('Summary')}</Title>
              <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{result.diagnosis.summary}</p>
            </StackItem>

            <StackItem>
              <Label color="grey" isCompact>
                {t('Powered by Red Hat Lightspeed')}
              </Label>
            </StackItem>
          </Stack>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onClose}>
          {t('Close')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
