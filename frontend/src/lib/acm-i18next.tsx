/* Copyright Contributors to the Open Cluster Management project */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useTranslation as useReactI18NextTranslation, Trans as ReactTrans } from 'react-i18next'

export function useTranslation() {
    return useReactI18NextTranslation('plugin__acm-plugin')
}

export function Trans(props: any) {
    const { t } = useTranslation()
    return (
        <ReactTrans {...props} t={t}>
            {props.children}
        </ReactTrans>
    )
}
