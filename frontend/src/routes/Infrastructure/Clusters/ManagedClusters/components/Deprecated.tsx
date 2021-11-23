/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from 'react-i18next'

const Deprecated: React.FC = () => {
    const { t } = useTranslation()

    return <div className="pf-u-font-size-sm pf-u-warning-color-100">{t('Deprecated')}</div>
}
export default Deprecated
