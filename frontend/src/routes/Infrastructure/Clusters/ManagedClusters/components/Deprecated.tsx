/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from '../../../../../lib/acm-i18next'

const Deprecated: React.FC = () => {
  const { t } = useTranslation()

  return <div className="pf-v5-u-font-size-sm pf-v5-u-warning-color-100">{t('deprecated')}</div>
}
export default Deprecated
