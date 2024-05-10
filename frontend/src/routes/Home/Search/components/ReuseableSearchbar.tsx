/* Copyright Contributors to the Open Cluster Management project */
import { SearchIcon } from '@patternfly/react-icons'
import { Link } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../NavigationPath'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { AcmButton } from '../../../../ui-components'

export default function ReuseableSearchbar() {
  const { t } = useTranslation()
  const { isGlobalHubState, settingsState } = useSharedAtoms()
  const isGlobalHub = useRecoilValue(isGlobalHubState)
  const settings = useRecoilValue(settingsState)

  return (
    <Link to={NavigationPath.search}>
      <AcmButton variant="link" isInline icon={<SearchIcon />} iconPosition="left">
        {isGlobalHub && settings.globalSearchFeatureFlag === 'enabled' ? t('Global search') : t('Search')}
      </AcmButton>
    </Link>
  )
}
