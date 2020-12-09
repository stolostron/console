'use strict'
/* eslint-disable import/no-named-as-default */

import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'carbon-components-react'
import BareMetalAssetCreateModal from '../../modals/CreateBareMetalAssetModal'

class WrappedCreateBareMetalAssetModal extends React.Component {
  static propTypes = {
    appendTable: PropTypes.func,
    locale: PropTypes.string,
  }

  constructor(props) {
    super(props)
    this.state = {
      open: false,
    }
  }

  render() {
    const { open } = this.state
    const { appendTable, locale } = this.props
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
        <Button id={msgs.get('modal.create-acmbaremetalasset.button.key', locale)} onClick={onClick.bind(this)}>
          {msgs.get('modal.create-acmbaremetalasset.button.text', locale)}
        </Button>
        <BareMetalAssetCreateModal open={open} {...this.props}
          appendTable={mapAndSubmitModel.bind(this)}
          closePrompt={closePrompt.bind(this)} />
      </div>
    )
  }
}


export default WrappedCreateBareMetalAssetModal
