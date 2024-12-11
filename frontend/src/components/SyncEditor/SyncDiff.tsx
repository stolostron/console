/* Copyright Contributors to the Open Cluster Management project */

import { Alert } from '@patternfly/react-core'
import { Table /* data-codemods */, Tbody, Tr, Td } from '@patternfly/react-table'
import { diffChars } from 'diff'
import './SyncDiff.css'

export interface SyncDiffType {
  changes: any[]
  errors: any[]
  warnings: any[]
}

export function SyncDiff(props: { stateChanges: SyncDiffType; errorMessage: string }): JSX.Element {
  const { stateChanges, errorMessage } = props

  const ellipse = (str: string) => {
    if (str.length > 32) {
      return `${str.slice(0, 16)}...${str.slice(-16)}}`
    }
    return str
  }
  const highlight = (line: string) => {
    const parts = line.split(':')
    return (
      <div style={{ color: '#04c' }}>
        {parts[0]}
        <span style={{ color: '#999' }}>:</span>
        {parts.length > 1 && <span style={{ color: '#0d0d0d' }}>{ellipse(parts[1])}</span>}
      </div>
    )
  }

  const diffNew = (latest: string[], line: number, rowIndex: number, reveal: any) => {
    return latest.map((row: string, latestIndex: number) => {
      return (
        <Tr
          className="diff-row"
          key={`${rowIndex}_${latestIndex}`}
          style={{
            ...(latestIndex === latest.length - 1 ? { borderBottom: '6pt solid white' } : {}),
          }}
          onClick={() => reveal()}
        >
          <Td className="diff-line" key={`${rowIndex}_0`}>
            {'\u00A0'}
          </Td>
          <Td className="diff-value" key={`${rowIndex}_1`}>
            {'\u00A0'}
          </Td>
          <Td className="diff-line right green" key={`${rowIndex}_2`}>
            {line + latestIndex}
          </Td>
          <Td className="diff-value last" key={`${rowIndex}_3`}>
            {highlight(row)}
          </Td>
        </Tr>
      )
    })
  }

  const diffEdit = (previous: any, latest: string[], path: any[], line: number, rowIndex: number, reveal: any) => {
    const key = path.slice(-1).pop()
    const diff = diffChars(String(previous), String(latest))
    const hasAdded = diff.some((d) => d.added)
    const hasRemoved = diff.some((d) => d.removed)
    return (
      <Tr className="diff-row last" key={rowIndex} onClick={() => reveal()}>
        <Td
          className="diff-line"
          key={`${rowIndex}_0`}
          style={{
            ...(hasRemoved ? { backgroundColor: '#ffd7d5' } : { backgroundColor: '#f0f0f0' }),
          }}
        >
          {line}
        </Td>
        <Td className="diff-value" key={`${rowIndex}_1`} style={hasRemoved ? { backgroundColor: '#ffebe9' } : {}}>
          <span style={{ color: '#04c' }}>{key}</span>
          <span>: </span>
          {diff.map((part) => {
            const msg = ellipse(part.value)
            if (part.added) {
              return null
            } else if (part.removed) {
              return (
                <span key={msg} style={{ backgroundColor: '#ff818266' }}>
                  {msg}
                </span>
              )
            }
            return msg
          })}
        </Td>
        <Td
          className="diff-line right"
          key={`${rowIndex}_2`}
          style={{
            ...(hasAdded ? { backgroundColor: '#ccffd8' } : { backgroundColor: '#f0f0f0' }),
          }}
        >
          {line}
        </Td>
        <Td className="diff-value" key={`${rowIndex}_3`} style={hasAdded ? { backgroundColor: '#e6ffec' } : {}}>
          <span style={{ color: '#04c' }}>{key}</span>
          <span>: </span>
          {diff.map((part) => {
            const msg = ellipse(part.value)
            if (part.removed) {
              return null
            } else if (part.added) {
              return (
                <span key={msg} style={{ backgroundColor: '#abf2bc' }}>
                  {msg}
                </span>
              )
            }
            return msg
          })}
        </Td>
      </Tr>
    )
  }

  return (
    <div className="sync-diff__container">
      {stateChanges?.errors?.length ? (
        <Alert isInline={true} title={errorMessage} variant={'danger'} />
      ) : (
        <Table className="diff-table" aria-label="Editor changes" variant={'compact'} borders={false}>
          <Tbody>
            {stateChanges?.changes?.map((change, rowIndex) => {
              const { type, previous, latest, line, path, reveal } = change
              switch (type) {
                case 'N':
                  return diffNew(latest, line, rowIndex, reveal)
                default:
                  return diffEdit(previous, latest, path, line, rowIndex, reveal)
              }
            })}
          </Tbody>
        </Table>
      )}
    </div>
  )
}
