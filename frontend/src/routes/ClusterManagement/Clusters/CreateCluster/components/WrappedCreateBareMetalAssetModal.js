/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { Button } from '@patternfly/react-core'
import { NavigationPath } from '../../../../../NavigationPath'

class WrappedCreateBareMetalAssetModal extends React.Component {
    render() {
        const { t, history } = this.props
        const onClick = () => {
            history.push(NavigationPath.createBareMetalAsset)
        }
        return (
            <div>
                <Button
                    id={t('modal.create-acmbaremetalasset.button.key')}
                    onClick={onClick.bind(this)}
                    variant="secondary"
                >
                    {t('modal.create-acmbaremetalasset.button.text')}
                </Button>
            </div>
        )
    }
}

export default WrappedCreateBareMetalAssetModal
