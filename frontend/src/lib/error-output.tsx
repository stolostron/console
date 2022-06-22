/* Copyright Contributors to the Open Cluster Management project */
import { Button, ButtonVariant } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { TFunction } from 'react-i18next'
import { ConfigMap } from '../resources'

export function getOperatorError(configMaps: ConfigMap[], isOperatorInstalled: boolean, t: TFunction) {
    const openShiftConsoleConfig = configMaps?.find((configmap) => configmap.metadata?.name === 'console-public')
    const openShiftConsoleUrl: string = openShiftConsoleConfig?.data?.consoleURL
    if (!isOperatorInstalled)
        return (
            <div>
                {t('The Ansible Automation Platform Resource Operator is required to create an Ansible job. ')}
                {openShiftConsoleUrl && openShiftConsoleUrl !== '' ? (
                    <div>
                        {t('Install the Operator through the following link: ')}
                        <Button
                            isInline
                            variant={ButtonVariant.link}
                            onClick={() =>
                                window.open(
                                    openShiftConsoleUrl +
                                        '/operatorhub/all-namespaces?keyword=ansible+automation+platform'
                                )
                            }
                        >
                            OperatorHub
                            <ExternalLinkAltIcon style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                        </Button>
                    </div>
                ) : (
                    t('Install the Operator through operator hub.')
                )}
            </div>
        )
}
