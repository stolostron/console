/* Copyright Contributors to the Open Cluster Management project */
import { Button } from '@patternfly/react-core'
import { PlayIcon, PauseIcon } from '@patternfly/react-icons'
import { css } from '@patternfly/react-styles'
import { FC, MouseEventHandler } from 'react'
// References translations directly from OpenShift console - not from plugins
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useTranslation } from 'react-i18next'

const TogglePlay: FC<{ active: boolean; className: string; onClick: MouseEventHandler<HTMLButtonElement> }> = (
  props
) => {
  const { t } = useTranslation()

  const togglePlayClasses = css(
    'co-toggle-play',
    props.className,
    props.active ? 'co-toggle-play--active' : 'co-toggle-play--inactive'
  )

  return (
    <Button
      icon={props.active ? <PauseIcon /> : <PlayIcon />}
      variant="plain"
      className={togglePlayClasses}
      onClick={props.onClick}
      aria-label={props.active ? t('public~Pause event streaming') : t('public~Start streaming events')}
    />
  )
}

export default TogglePlay
