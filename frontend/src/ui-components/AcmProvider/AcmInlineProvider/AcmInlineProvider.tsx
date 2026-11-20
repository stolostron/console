/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { Tooltip } from '@patternfly/react-core'
import { Provider, ProviderLongTextMap, ProviderIconMap } from '../'
import { AcmIcon } from '../../AcmIcons/AcmIcons'

const container = css({
  '& svg, & img': {
    width: '1.8em',
    height: '1.8em',
    margin: '-0.4em 0',
    top: '0.12em',
    position: 'relative',
  },
  whiteSpace: 'nowrap',
})

export function AcmInlineProvider(props: { provider: Provider; iconOnly?: boolean }) {
  if (props.iconOnly) {
    const label = ProviderLongTextMap[props.provider]
    return (
      <Tooltip content={label}>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- focus is required so keyboard users can reveal the tooltip */}
        <span role="img" aria-label={label} tabIndex={0} className={container}>
          <AcmIcon icon={ProviderIconMap[props.provider]} />
        </span>
      </Tooltip>
    )
  }
  return (
    <div className={container}>
      <AcmIcon icon={ProviderIconMap[props.provider]} />
      &nbsp; &nbsp;
      <span>{ProviderLongTextMap[props.provider]}</span>
    </div>
  )
}
