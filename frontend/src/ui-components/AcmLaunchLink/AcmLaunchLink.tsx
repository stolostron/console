/* Copyright Contributors to the Open Cluster Management project */

import { ButtonVariant, Label } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmButton } from '../AcmButton/AcmButton'
import { AcmDropdown } from '../AcmDropdown/AcmDropdown'

export type LaunchLink = {
  id: string
  text: string | React.ReactNode
  href?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  label?: boolean
  noIcon?: boolean
  icon?: React.ReactNode
  disabled?: boolean
}

function getLinkIcon(link: LaunchLink) {
  const customizedIcon = link.icon ? link.icon : <ExternalLinkAltIcon />
  return link.noIcon ? null : customizedIcon
}

export function AcmLaunchLink(props: { links?: LaunchLink[] }) {
  /* istanbul ignore next */
  const onSelect = () => null
  const { t } = useTranslation()
  if (props.links !== undefined && props.links.length > 0) {
    if (props.links.length === 1) {
      const [link] = props.links
      if (link.label) {
        return (
          <Label>
            <AcmButton
              href={link.href ? link.href : undefined}
              onClick={link.onClick ? link.onClick : undefined}
              variant={ButtonVariant.link}
              component="a"
              target="_blank"
              rel="noreferrer"
              id={link.id}
              icon={getLinkIcon(link)}
              iconPosition="right"
              isDisabled={link.disabled ? link.disabled : false}
              style={{
                marginLeft: 0,
                paddingLeft: 0,
                fontSize: '14px',
              }}
            >
              {link.text}
            </AcmButton>
          </Label>
        )
      }
      return (
        <AcmButton
          href={link.href ? link.href : undefined}
          onClick={link.onClick ? link.onClick : undefined}
          variant={ButtonVariant.link}
          component="a"
          target="_blank"
          rel="noreferrer"
          id={link.id}
          icon={getLinkIcon(link)}
          iconPosition="right"
          isDisabled={link.disabled ? link.disabled : false}
          style={{
            padding: 0,
            marginLeft: '1rem',
          }}
        >
          {link.text}
        </AcmButton>
      )
    } else {
      return (
        <AcmDropdown
          isPlain
          onSelect={onSelect}
          text={t('Launch dashboard')}
          id="addon-launch-links"
          dropdownItems={props.links.map((link) => ({
            id: link.id,
            text: link.text,
            href: link.href,
            component: 'a',
            target: '_blank',
            rel: 'noreferrer',
            icon: getLinkIcon(link),
          }))}
        />
      )
    }
  } else {
    return null
  }
}
