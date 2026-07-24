/* Copyright Contributors to the Open Cluster Management project */
import { css, keyframes } from '@emotion/css'
import { Alert, AlertActionCloseButton, AlertActionLink, AlertGroup, AlertProps } from '@patternfly/react-core'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '~/lib/acm-i18next'
import type { PulseColor, TopologyNode } from '../../types'
import type { TopologyAlert } from '../../analysis/analyzeTopology'
import { TopologyAlertActionType } from '../../analysis/utils'

const STATUS_ORDER: PulseColor[] = ['red', 'yellow', 'orange', 'green']

const MAX_MESSAGE_LENGTH = 312

const truncateMessage = (message: string): string => {
  if (message.length <= MAX_MESSAGE_LENGTH) {
    return message
  }
  return `${message.slice(0, MAX_MESSAGE_LENGTH)}...`
}

const statusToVariant: Record<string, AlertProps['variant']> = {
  red: 'danger',
  orange: 'info',
  yellow: 'warning',
  green: 'success',
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const fadeOut = keyframes`
  from {
    opacity: 1;
    max-height: 500px;
  }
  to {
    opacity: 0;
    max-height: 0;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
`

const containerBase = css`
  position: absolute;
  top: 20px;
  left: 20px;
  width: 650px;
  max-width: 33%;
  z-index: 10;
`

const containerWithBorder = css`
  border: 1px solid #bee1f4;
  border-radius: var(--pf-t--global--border--radius--medium);
`

const containerScrollable = css`
  overflow-y: auto;
`

const containerHiddenOverflow = css`
  overflow: hidden;
`

const alertFadeIn = css`
  animation: ${fadeIn} 0.3s ease-out;
`

const alertFadeOut = css`
  animation: ${fadeOut} 0.5s ease-out forwards;
`

const bulletSpacer = css`
  margin-top: var(--pf-t--global--spacer--sm);
`

const bulletMarker = css`
  margin-right: var(--pf-t--global--spacer--sm);
`

const bulletTitle = css`
  margin: 0;
`

const bulletContent = css`
  margin-top: var(--pf-t--global--spacer--xs);
  margin-bottom: calc(var(--pf-t--global--spacer--sm) * 2);
`

const bulletContentYaml = css`
  font-family: Courier, monospace;
  font-size: var(--pf-t--global--font--size--body--default);
  padding: 2px 8px 2px 16px;
  margin: 0;
  background-color: var(--pf-t--global--background--color--secondary--default);
  color: var(--pf-t--global--text--color--regular);
  white-space: pre-wrap;
  overflow-x: auto;
`

/** Sorts alerts with major alerts first, then by severity status. */
const sortAlerts = (alerts: TopologyAlert[]): TopologyAlert[] => {
  return [...alerts].sort((a, b) => {
    if (a.isMajor && !b.isMajor) return -1
    if (!a.isMajor && b.isMajor) return 1
    const aIndex = STATUS_ORDER.indexOf(a.status)
    const bIndex = STATUS_ORDER.indexOf(b.status)
    return (aIndex === -1 ? STATUS_ORDER.length : aIndex) - (bIndex === -1 ? STATUS_ORDER.length : bIndex)
  })
}

export interface TopologyAlertsProps {
  alerts: TopologyAlert[]
  currentAlertsKey: string
  isAnalyzing?: boolean
  isProcessingSave?: boolean
  onEditAppSet?: (node: TopologyNode, showWizardInput?: string) => void
  onEditYaml?: (node: TopologyNode, highlightEditorPath?: string) => void
  onViewLogs?: (node: TopologyNode) => void
  onSyncResources?: (node: TopologyNode) => void
  onLaunchArgo?: (node: TopologyNode) => void
}

export function TopologyAlerts({
  alerts,
  currentAlertsKey,
  isAnalyzing,
  isProcessingSave,
  onEditAppSet,
  onEditYaml,
  onViewLogs,
  onSyncResources,
  onLaunchArgo,
}: TopologyAlertsProps) {
  const { t } = useTranslation()
  const dismissedIdsRef = useRef<Set<string>>(new Set())
  const [visibleAlerts, setVisibleAlerts] = useState<TopologyAlert[]>([])
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const [newAlertIds, setNewAlertIds] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasScrollbar, setHasScrollbar] = useState(false)
  const [processingAlertDismissed, setProcessingAlertDismissed] = useState(false)
  const [analyzingAlertDismissed, setAnalyzingAlertDismissed] = useState(false)

  useEffect(() => {
    dismissedIdsRef.current = new Set()
  }, [currentAlertsKey])

  useEffect(() => {
    if (!isProcessingSave) {
      setProcessingAlertDismissed(false)
    }
  }, [isProcessingSave])

  useEffect(() => {
    if (!isAnalyzing) {
      setAnalyzingAlertDismissed(false)
    }
  }, [isAnalyzing])

  const dismissProcessingAlert = useCallback(() => {
    setProcessingAlertDismissed(true)
  }, [])

  const dismissAnalyzingAlert = useCallback(() => {
    setAnalyzingAlertDismissed(true)
  }, [])

  const sortedInputAlerts = useMemo(() => sortAlerts(alerts), [alerts])
  const dismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    let cancelled = false

    const schedule = (fn: () => void, ms: number) => {
      const timer = setTimeout(() => {
        if (!cancelled) {
          fn()
        }
      }, ms)
      timers.push(timer)
    }

    const incoming = sortedInputAlerts.filter((alert) => !dismissedIdsRef.current.has(alert.id))
    const existingIds = new Set(visibleAlerts.map((a) => a.id))
    const toAdd = incoming.filter((alert) => !existingIds.has(alert.id))

    if (toAdd.length === 0) {
      setVisibleAlerts(incoming)
      return () => {
        cancelled = true
        timers.forEach(clearTimeout)
      }
    }

    let delay = 0
    toAdd.forEach((alert) => {
      const alertId = alert.id
      schedule(() => {
        setVisibleAlerts((prev) => {
          if (prev.some((a) => a.id === alertId)) return prev
          return sortAlerts([...prev, alert])
        })
        setNewAlertIds((prev) => new Set(prev).add(alertId))
        schedule(() => {
          setNewAlertIds((prev) => {
            const next = new Set(prev)
            next.delete(alertId)
            return next
          })
        }, 300)
      }, delay)
      delay += 100
    })

    setVisibleAlerts(() => sortAlerts(incoming))

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      setNewAlertIds(new Set())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedInputAlerts, currentAlertsKey])

  useEffect(() => {
    const dismissTimers = dismissTimersRef.current
    return () => {
      dismissTimers.forEach(clearTimeout)
      dismissTimers.clear()
      setRemovingIds(new Set())
    }
  }, [sortedInputAlerts, currentAlertsKey])

  useEffect(() => {
    const el = containerRef.current
    if (!el) {
      setHasScrollbar(false)
      return
    }

    const updateHasScrollbar = () => {
      if (newAlertIds.size > 0) {
        setHasScrollbar(false)
        return
      }
      // Subpixel rounding can leave scrollHeight 1px over clientHeight
      setHasScrollbar(el.scrollHeight > el.clientHeight + 1)
    }

    updateHasScrollbar()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    // Observe the container and its content so we detect overflow when
    // children grow while the container is already at max-height.
    const content = el.firstElementChild
    const observer = new ResizeObserver(updateHasScrollbar)
    observer.observe(el)
    if (content) {
      observer.observe(content)
    }

    return () => observer.disconnect()
  }, [visibleAlerts, newAlertIds, removingIds])

  const closeAction = useCallback((alertId: string) => {
    const existingTimer = dismissTimersRef.current.get(alertId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    setRemovingIds((prev) => new Set(prev).add(alertId))
    const timer = setTimeout(() => {
      dismissTimersRef.current.delete(alertId)
      dismissedIdsRef.current.add(alertId)
      setVisibleAlerts((prev) => prev.filter((a) => a.id !== alertId))
      setRemovingIds((prev) => {
        const next = new Set(prev)
        next.delete(alertId)
        return next
      })
    }, 500)
    dismissTimersRef.current.set(alertId, timer)
  }, [])

  const maxHeight = '66vh'
  const isFadingIn = newAlertIds.size > 0

  if (isProcessingSave && !processingAlertDismissed) {
    return (
      <div ref={containerRef} className={`${containerBase} ${containerScrollable}`} style={{ maxHeight }}>
        <AlertGroup>
          <Alert
            variant="info"
            title={t('Progressing...')}
            id="topology-processing-alert"
            actionClose={<AlertActionCloseButton onClose={dismissProcessingAlert} />}
          />
        </AlertGroup>
      </div>
    )
  }

  if (isAnalyzing && !analyzingAlertDismissed) {
    return (
      <div ref={containerRef} className={`${containerBase} ${containerScrollable}`} style={{ maxHeight }}>
        <AlertGroup>
          <Alert
            variant="info"
            title={t('Analyzing...')}
            id="topology-analyzing-alert"
            actionClose={<AlertActionCloseButton onClose={dismissAnalyzingAlert} />}
          />
        </AlertGroup>
      </div>
    )
  }

  if (!visibleAlerts.length) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`${containerBase} ${
        isFadingIn ? containerHiddenOverflow : containerScrollable
      } ${hasScrollbar ? containerWithBorder : ''}`}
      style={{ maxHeight }}
    >
      <AlertGroup>
        {visibleAlerts.map((alert) => {
          const alertId = alert.id
          const isRemoving = removingIds.has(alertId)
          const isNew = newAlertIds.has(alertId)
          const actionLinks = alert.actions?.length ? (
            <Fragment>
              {alert.actions.map((action, actionIndex) => {
                const actionKey = `${action.label}-${actionIndex}`
                switch (action.type) {
                  case TopologyAlertActionType.launchArgo:
                    if (action.node) {
                      return (
                        <AlertActionLink key={actionKey} onClick={() => onLaunchArgo?.(action.node!)}>
                          {action.label}
                        </AlertActionLink>
                      )
                    }
                    return action.action?.url ? (
                      <AlertActionLink key={actionKey} component="a" href={action.action.url}>
                        {action.label}
                      </AlertActionLink>
                    ) : null
                  case TopologyAlertActionType.editAppSet:
                    return action.node ? (
                      <AlertActionLink key={actionKey} onClick={() => onEditAppSet?.(action.node!)}>
                        {action.label}
                      </AlertActionLink>
                    ) : null
                  case TopologyAlertActionType.openUrl:
                    return action.action?.url ? (
                      <AlertActionLink
                        key={actionKey}
                        component="a"
                        href={action.action.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {action.label}
                      </AlertActionLink>
                    ) : null
                  case TopologyAlertActionType.editYaml:
                  case TopologyAlertActionType.viewYaml:
                    return action.node ? (
                      <AlertActionLink
                        key={actionKey}
                        onClick={() => onEditYaml?.(action.node!, action.highlightEditorPath)}
                      >
                        {action.label}
                      </AlertActionLink>
                    ) : null
                  case TopologyAlertActionType.showLog:
                    return action.node ? (
                      <AlertActionLink key={actionKey} onClick={() => onViewLogs?.(action.node!)}>
                        {action.label}
                      </AlertActionLink>
                    ) : null
                  case TopologyAlertActionType.syncResources:
                    return action.node ? (
                      <AlertActionLink key={actionKey} onClick={() => onSyncResources?.(action.node!)}>
                        {action.label}
                      </AlertActionLink>
                    ) : null
                  default:
                    return action.action?.func ? (
                      <AlertActionLink key={actionKey} onClick={action.action.func}>
                        {action.label}
                      </AlertActionLink>
                    ) : null
                }
              })}
            </Fragment>
          ) : undefined

          return (
            <div key={alertId} className={isRemoving ? alertFadeOut : isNew ? alertFadeIn : undefined}>
              <Alert
                variant={statusToVariant[alert.status] ?? 'warning'}
                title={alert.title}
                id={alertId}
                actionClose={<AlertActionCloseButton onClose={() => closeAction(alertId)} />}
                actionLinks={actionLinks}
              >
                {alert.description && (
                  <>
                    <p>{truncateMessage(alert.description.message)}</p>
                    {alert.description.bullets?.length ? (
                      <div className={bulletSpacer}>
                        {alert.description.bullets.map((bullet, bulletIndex) => (
                          <div key={`${bullet.title}-${bulletIndex}`}>
                            <p className={bulletTitle}>
                              <span className={bulletMarker}>{'\u25CF'}</span>
                              {bullet.title}
                              {bullet.link ? (
                                <>
                                  {' '}
                                  <a href={bullet.link.url} target="_blank" rel="noreferrer">
                                    {bullet.link.label}
                                  </a>
                                </>
                              ) : null}
                            </p>
                            {bullet.content && bullet.content.length > 0 ? (
                              <div className={bulletContent}>
                                <pre className={bulletContentYaml}>{bullet.content.join('\n')}</pre>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
              </Alert>
            </div>
          )
        })}
      </AlertGroup>
    </div>
  )
}
