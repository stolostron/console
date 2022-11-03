/* Copyright Contributors to the Open Cluster Management project */
import { Banner, Button, Split, SplitItem } from '@patternfly/react-core'
import { AcmAlertContext } from './ui-components'
import { useCallback, useContext, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { DOC_LINKS } from './lib/doc-util'
import { launchToOCP } from './lib/ocp-utils'
import { makeStyles } from '@material-ui/core'

const useStyles = makeStyles({
    banner: {
        '--pf-c-banner--link--hover--FontWeight': 'unset',
    },
})

export function DeprecationBanner() {
    const { addAlert } = useContext(AcmAlertContext)
    const { banner } = useStyles()
    const { pathname, search } = useLocation()
    const consoleSuffix = useMemo(() => {
        const params = new URLSearchParams(search)
        params.set('perspective', 'acm')
        return `${pathname}?${params.toString()}`
    }, [pathname, search])
    const onClickPluginLink = useCallback(
        () =>
            launchToOCP(consoleSuffix, false, () =>
                addAlert({ title: 'Failed to locate OpenShift console', type: 'danger' })
            ),
        [addAlert, consoleSuffix]
    )
    return (
        <Banner isSticky variant="warning" className={banner}>
            <Split hasGutter>
                <SplitItem isFilled className="pf-u-text-wrap">
                    This web console is deprecated and will be removed in Red Hat Advanced Cluster Management for
                    Kubernetes 2.7. Switch to the{' '}
                    <Button variant="link" isInline onClick={onClickPluginLink}>
                        Openshift console plug-in
                    </Button>
                    .
                </SplitItem>
                <SplitItem>
                    <a href={DOC_LINKS.CONSOLE_PLUGIN} target="_blank" rel="noreferrer">
                        Learn more
                    </a>
                </SplitItem>
            </Split>
        </Banner>
    )
}
