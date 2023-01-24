/* Copyright Contributors to the Open Cluster Management project */

import { ReactNode, useRef, useState, useCallback, useEffect } from 'react'

/** Scollable container that adds a top and bottom shadow on scroll */
export function AcmScrollable(props: { children?: ReactNode; borderTop?: boolean; borderBottom?: boolean }) {
  const divEl = useRef<HTMLDivElement>(null)
  const [topShadow, setTopShadow] = useState(0)
  const [bottomShadow, setBottomShadow] = useState(0)
  const update = useCallback(() => {
    /* istanbul ignore else */
    if (divEl.current) {
      setTopShadow(Math.min(1, divEl.current.scrollTop / 8))
      const scrollBottom = divEl.current.scrollHeight - divEl.current.scrollTop - divEl.current.clientHeight
      setBottomShadow(Math.max(0, Math.min(1, scrollBottom / 8)))
    }
  }, [])
  useEffect(update, [update, props.children])
  const shadowOpacityTop = 0.08 * topShadow
  const shadowOpacityBottom = 0.06 * bottomShadow

  /* istanbul ignore next */
  const borderTop = props.borderTop ? 'thin solid rgba(0, 0, 0, 0.12)' : ''

  /* istanbul ignore next */
  const borderBottom = props.borderBottom ? 'thin solid rgba(0, 0, 0, 0.12)' : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'hidden', position: 'relative' }}>
      <div
        ref={divEl}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          overflowY: 'auto',
          borderTop,
          borderBottom,
        }}
        onScroll={update}
      >
        {props.children}
      </div>
      {
        /* istanbul ignore next */ shadowOpacityTop > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              height: '8px',
              width: '100%',
              background: `linear-gradient(rgba(0,0,0,${shadowOpacityTop}), rgba(0,0,0,0))`,
            }}
          />
        )
      }
      {
        /* istanbul ignore next */ shadowOpacityBottom > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              height: '6px',
              width: '100%',
              background: `linear-gradient(rgba(0,0,0,0), rgba(0,0,0,${shadowOpacityBottom}))`,
            }}
          />
        )
      }
    </div>
  )
}
