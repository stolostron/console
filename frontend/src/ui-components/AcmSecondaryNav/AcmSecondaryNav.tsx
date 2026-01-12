/* Copyright Contributors to the Open Cluster Management project */
import { Tab, Tabs, TabTitleText } from '@patternfly/react-core'
import React, { ReactNode } from 'react'
import { Path, useNavigate } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../lib/acm-i18next'

export function AcmSecondaryNav(props: {
  navItems: {
    key: string
    title: string | ReactNode
    isActive: boolean
    to?: string | Partial<Path>
    onClick?: () => void
  }[]
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // isActive is passed in navItem props - and is set via the browser location
  const activeTab = props.navItems.find((item) => item.isActive)
  const activeKey = activeTab?.key ?? props.navItems[0]?.key

  const handleTabClick = (_: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => {
    const selectedTab = props.navItems.find((item) => item.key === tabIndex)
    if (selectedTab) {
      if (selectedTab.to) {
        navigate(selectedTab.to)
      } else if (selectedTab.onClick) {
        selectedTab.onClick()
      }
    }
  }

  return (
    <Tabs
      activeKey={activeKey}
      onSelect={handleTabClick}
      aria-label={t('Secondary page navigation tabs')}
      style={{ paddingLeft: 'calc(1.5rem - 4px)' }} // should use usePageInsets prop - this is currently a few pixels off.
    >
      {props.navItems.map((item) => (
        // Override aria-controls as we are not rendering TabContent as Child components. If set, a11y breaks.
        <Tab aria-controls="" key={item.key} eventKey={item.key} title={<TabTitleText>{item.title}</TabTitleText>} />
      ))}
    </Tabs>
  )
}
