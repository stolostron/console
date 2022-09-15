/* Copyright Contributors to the Open Cluster Management project */
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Link } from 'react-router-dom'

export function getOperatorError(isOperatorInstalled: boolean, t: any) {
    if (!isOperatorInstalled)
        return (
            <div>
                {t('The Ansible Automation Platform Resource Operator is required to create an Ansible job. ')}

                <div>
                    {t('Install the Operator through the following link: ')}
                    <Link to={'/operatorhub/all-namespaces?keyword=ansible+automation+platform'} target={'_blank'}>
                        OperatorHub
                        <ExternalLinkAltIcon style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                    </Link>
                </div>
            </div>
        )
}
