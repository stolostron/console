/* Copyright Contributors to the Open Cluster Management project */

import {
  Alert,
  Button,
  CodeBlock,
  CodeBlockCode,
  Content,
  Label,
  List,
  ListItem,
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
import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import type { IResource } from '../../../resources'
import { type PolicyAnalysisResponse, runPolicyAnalysis } from './usePolicyAnalysis'

function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split('\n')
  const nodes: ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      nodes.push(
        <CodeBlock key={nodes.length}>
          <CodeBlockCode id={`code-${nodes.length}`}>{codeLines.join('\n')}</CodeBlockCode>
        </CodeBlock>
      )
      continue
    }

    // Headers
    const headerMatch = line.match(/^(#{1,4})\s+(.+)/)
    if (headerMatch) {
      const level = headerMatch[1].length as 1 | 2 | 3 | 4
      const headingLevel = `h${Math.min(level + 2, 6)}` as 'h3' | 'h4' | 'h5' | 'h6'
      nodes.push(
        <Title key={nodes.length} headingLevel={headingLevel} style={{ marginTop: '16px', marginBottom: '8px' }}>
          {inlineMarkdown(headerMatch[2])}
        </Title>
      )
      i++
      continue
    }

    // Unordered list items (collect consecutive)
    if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''))
        i++
      }
      nodes.push(
        <List key={nodes.length}>
          {items.map((item, idx) => (
            <ListItem key={idx}>{inlineMarkdown(item)}</ListItem>
          ))}
        </List>
      )
      continue
    }

    // Ordered list items
    if (/^\s*\d+[.)]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+[.)]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''))
        i++
      }
      nodes.push(
        <List component="ol" key={nodes.length}>
          {items.map((item, idx) => (
            <ListItem key={idx}>{inlineMarkdown(item)}</ListItem>
          ))}
        </List>
      )
      continue
    }

    // Blank line
    if (line.trim() === '') {
      i++
      continue
    }

    // Regular paragraph
    nodes.push(
      <Content component="p" key={nodes.length}>
        {inlineMarkdown(line)}
      </Content>
    )
    i++
  }

  return nodes
}

function inlineMarkdown(text: string): ReactNode {
  const parts: ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    if (match[2]) {
      parts.push(<strong key={match.index}>{match[2]}</strong>)
    } else if (match[3]) {
      parts.push(
        <code
          key={match.index}
          style={{ padding: '1px 4px', background: 'var(--pf-t--global--background--color--secondary--default)' }}
        >
          {match[3]}
        </code>
      )
    }
    last = match.index + match[0].length
  }

  if (last < text.length) {
    parts.push(text.slice(last))
  }

  return parts.length === 1 ? parts[0] : <Fragment>{parts}</Fragment>
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
  onAnalysisComplete,
  getCachedResult,
}: Readonly<{
  resources: IResource[]
  isOpen: boolean
  onClose: () => void
  onAnalysisComplete?: (result: PolicyAnalysisResponse, resources: IResource[]) => void
  getCachedResult?: (resources: IResource[]) => PolicyAnalysisResponse | null
}>) {
  const { t } = useTranslation()
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [result, setResult] = useState<PolicyAnalysisResponse | undefined>()
  const abortRef = useRef<(() => void) | undefined>()
  const renderedRootCause = useMemo(
    () => (result?.diagnosis?.rootCause ? renderMarkdown(result.diagnosis.rootCause) : null),
    [result?.diagnosis?.rootCause]
  )
  const renderedSummary = useMemo(
    () => (result?.diagnosis?.summary ? renderMarkdown(result.diagnosis.summary) : null),
    [result?.diagnosis?.summary]
  )

  useEffect(() => {
    if (!isOpen) return

    const cached = getCachedResult?.(resources)
    if (cached) {
      setIsFetching(false)
      setError(cached.error)
      setResult(cached.error ? undefined : cached)
      return
    }

    setIsFetching(true)
    setError(undefined)
    setResult(undefined)

    const { promise, abort } = runPolicyAnalysis(resources)
    abortRef.current = abort

    let ignore = false
    promise
      .then((data) => {
        if (ignore) return
        if (data.error) {
          setError(data.error)
        } else {
          setResult(data)
          onAnalysisComplete?.(data, resources)
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
  }, [isOpen, resources, onAnalysisComplete, getCachedResult])

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
            {result.readyToDeploy !== undefined && (
              <StackItem>
                <Label color={result.readyToDeploy ? 'green' : 'red'} isCompact>
                  {result.readyToDeploy ? t('Ready to deploy') : t('Not ready to deploy')}
                </Label>
              </StackItem>
            )}

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

            {renderedRootCause && result.readyToDeploy === false && (
              <StackItem>
                <Title headingLevel="h4">{t('Root cause')}</Title>
                <div style={{ marginTop: '4px' }}>{renderedRootCause}</div>
              </StackItem>
            )}

            <StackItem>
              <Title headingLevel="h4">{t('Summary')}</Title>
              <div style={{ marginTop: '4px' }}>{renderedSummary}</div>
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
