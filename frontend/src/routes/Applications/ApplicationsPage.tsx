/* Copyright Contributors to the Open Cluster Management project */

import { Outlet } from 'react-router'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmPage, AcmPageHeader } from '../../ui-components'

export default function ApplicationsPage() {
  const { t } = useTranslation()

  return (
    <AcmPage hasDrawer header={<AcmPageHeader title={t('Applications')} />}>
      <Outlet />
    </AcmPage>
  )
}
