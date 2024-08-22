/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { Skeleton, Tile, TileProps } from '@patternfly/react-core'

type AcmTileProps = TileProps & {
  loading?: boolean
  relatedResourceData?: {
    count: number
    kind: string
  }
}

const tileRoot = css({
  display: 'flex',
  alignItems: 'center',
  padding: '0 1.5rem',
  height: '64px',
  overflow: 'hidden',
  '& >div:last-child': {
    width: '100%',
  },
})
const relatedResourceContainer = css({
  display: 'flex',
  alignItems: 'center',
})
const relatedResourceCount = css({
  fontSize: '28px',
  color: 'var(--pf-v5-global--palette--blue-400)',
  marginRight: '.5rem',
})
const relatedResourceKind = css({
  fontSize: '14px',
  fontWeight: 'bold',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  textAlign: 'left',
  lineHeight: '18px',
})

export function AcmTile(props: AcmTileProps) {
  if (props.loading) {
    return (
      <Tile className={tileRoot} title={''} ref={null}>
        <Skeleton />
      </Tile>
    )
  }
  if (props.relatedResourceData) {
    // This render is specific to the search related resources tile
    let count = `${props.relatedResourceData.count}`
    if (parseInt(count) >= 1000) {
      count = `${(parseInt(count) - (parseInt(count) % 100)) / 1000}k`
    }
    return (
      <Tile
        id={props.id}
        className={tileRoot}
        title={props.title}
        onClick={props.onClick}
        isSelected={props.isSelected}
        ref={null}
      >
        <div className={relatedResourceContainer}>
          <div className={relatedResourceCount}>{count}</div>
          <div className={relatedResourceKind}>{props.relatedResourceData.kind}</div>
        </div>
      </Tile>
    )
  }
  return <Tile {...props} ref={null} />
}
