/* Copyright Contributors to the Open Cluster Management project */
import { Modal, ModalBody, ModalHeader, ModalVariant, SearchInput, Tooltip } from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'

export interface MatchedClustersModalProps {
  isOpen: boolean
  onClose: () => void
  matchedClusters: string[]
  notMatchedClusters: string[]
  totalClusters: number
}

export function MatchedClustersModal(props: MatchedClustersModalProps) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (props.isOpen) setSearchTerm('')
  }, [props.isOpen])

  const filteredMatched = useMemo(() => {
    if (!searchTerm) return props.matchedClusters
    const lower = searchTerm.toLowerCase()
    return props.matchedClusters.filter((name) => name.toLowerCase().includes(lower))
  }, [props.matchedClusters, searchTerm])

  const filteredNotMatched = useMemo(() => {
    if (!searchTerm) return props.notMatchedClusters
    const lower = searchTerm.toLowerCase()
    return props.notMatchedClusters.filter((name) => name.toLowerCase().includes(lower))
  }, [props.notMatchedClusters, searchTerm])

  const hasLimit = props.notMatchedClusters.length > 0
  const matchedLen = props.matchedClusters.length
  const title = hasLimit
    ? props.totalClusters === 1
      ? t('{{matched}} of {{total}} cluster matched', { matched: matchedLen, total: props.totalClusters })
      : t('{{matched}} of {{total}} clusters matched', { matched: matchedLen, total: props.totalClusters })
    : matchedLen === 1
      ? t('{{matched}} cluster matched', { matched: matchedLen })
      : t('{{matched}} clusters matched', { matched: matchedLen })

  const rowStyle = {
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--pf-t--global--background--color--secondary--default)',
    borderBottom: '1px solid var(--pf-t--global--border--color--default)',
  }

  return (
    <Modal variant={ModalVariant.medium} isOpen={props.isOpen} onClose={props.onClose} aria-label={title}>
      <ModalHeader title={title} />
      <ModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p>{t('Showing clusters that match your defined labels, tolerations, and limits.')}</p>

          <SearchInput
            placeholder={t('Find by name')}
            value={searchTerm}
            onChange={(_event, value) => setSearchTerm(value)}
            onClear={() => setSearchTerm('')}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
            {hasLimit && filteredMatched.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  {t('Matched')}{' '}
                  <Tooltip content={t('Clusters currently targeted for deployment.')}>
                    <OutlinedQuestionCircleIcon style={{ cursor: 'pointer' }} />
                  </Tooltip>
                </h4>
                {filteredMatched.map((name) => (
                  <div key={name} style={rowStyle}>
                    {name}
                  </div>
                ))}
              </div>
            )}

            {hasLimit && filteredNotMatched.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  {t('Not matched')}{' '}
                  <Tooltip
                    content={t(
                      'These clusters match your label expressions and tolerations, but are not currently assigned due to placement limit or prioritization.'
                    )}
                  >
                    <OutlinedQuestionCircleIcon style={{ cursor: 'pointer' }} />
                  </Tooltip>
                </h4>
                {filteredNotMatched.map((name) => (
                  <div key={name} style={rowStyle}>
                    {name}
                  </div>
                ))}
              </div>
            )}

            {!hasLimit &&
              filteredMatched.map((name) => (
                <div key={name} style={rowStyle}>
                  {name}
                </div>
              ))}

            {filteredMatched.length === 0 && filteredNotMatched.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                {searchTerm ? t('No clusters found matching "{{search}}"', { search: searchTerm }) : t('No clusters')}
              </div>
            )}
          </div>
        </div>
      </ModalBody>
    </Modal>
  )
}
