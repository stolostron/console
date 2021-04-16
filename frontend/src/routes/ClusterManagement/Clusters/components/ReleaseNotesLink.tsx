/* Copyright Contributors to the Open Cluster Management project */

import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useTranslation } from 'react-i18next'
import { OCP_DOC_BASE_PATH } from '../../../../lib/doc-util'

// must be x.y.z version prop
export const ReleaseNotesLink = (props: { version?: string }) => {
    const { t } = useTranslation(['cluster'])

    if (!props.version) return null

    // https://docs.openshift.com/container-platform/4.6/release_notes/ocp-4-6-release-notes.html#ocp-4-6-16
    const [x, y, z] = props.version.split('.')

    return (
        <a
            href={`${OCP_DOC_BASE_PATH}/${x}.${y}/release_notes/ocp-${x}-${y}-release-notes.html#ocp-${x}-${y}-${z}`}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'block', marginTop: '6px' }}
        >
            {t('view.releaseNotes')} <ExternalLinkAltIcon />
        </a>
    )
}
