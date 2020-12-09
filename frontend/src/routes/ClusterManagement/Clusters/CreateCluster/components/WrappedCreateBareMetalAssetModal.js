'use strict'
/* eslint-disable import/no-named-as-default */

import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'carbon-components-react'
import BareMetalAssetCreateModal from '../../modals/CreateBareMetalAssetModal'
import { useTranslation } from 'react-i18next'

class WrappedCreateBareMetalAssetModal extends React.Component {
  static propTypes = {
    appendTable: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = {
      open: false,
    }
  }

  render() {
    const { t } = useTranslation(['create'])
    const { open } = this.state
    const { appendTable } = this.props
    const onClick = () => {
      this.setState({open:true})
    }
    const closePrompt = () => {
      this.setState({open:false})
    }
    const mapAndSubmitModel = ({bmcAddress, bootMac, name, namespace, password, username}) =>{
      appendTable({
        bmcAddress,
        hostName: name,
        hostNamespace: namespace,
        id: Math.random().toString(),
        macAddress: bootMac,
        role: 'master',
        password,
        username,
      })
    }
    return (
      <div>
        <Button id={t('modal.create-acmbaremetalasset.button.key')} onClick={onClick.bind(this)}>
          {t('modal.create-acmbaremetalasset.button.text')}
        </Button>
        <BareMetalAssetCreateModal open={open} {...this.props}
          appendTable={mapAndSubmitModel.bind(this)}
          closePrompt={closePrompt.bind(this)} />
      </div>
    )
  }
}


export default WrappedCreateBareMetalAssetModal
