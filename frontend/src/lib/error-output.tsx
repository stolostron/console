/* Copyright Contributors to the Open Cluster Management project */
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { ConfigMap } from '../resources'
import { Link } from 'react-router-dom'

export function getOperatorError(configMaps: ConfigMap[], isOperatorInstalled: boolean, t: any) {
    const openShiftConsoleConfig = configMaps?.find((configmap) => configmap.metadata?.name === 'console-public')
    const openShiftConsoleUrl: string = openShiftConsoleConfig?.data?.consoleURL
    if (!isOperatorInstalled)
        return (
            <div>
                {t('The Ansible Automation Platform Resource Operator is required to create an Ansible job. ')}
                {openShiftConsoleUrl && openShiftConsoleUrl !== '' ? (
                    <div>
                        {t('Install the Operator through the following link: ')}
                        <Link to={'/operatorhub/all-namespaces?keyword=ansible+automation+platform'} target={'_blank'}>
                            OperatorHub
                            <ExternalLinkAltIcon style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                        </Link>
                    </div>
                ) : (
                    t('Install the operator through OperatorHub.')
                )}
            </div>
        )
}
