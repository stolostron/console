/* eslint-disable import/no-named-as-default */

import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'carbon-components-react'
//import BareMetalAssetCreateModal from '../../modals/CreateBareMetalAssetModal'

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
    const { t } = this.props
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
    
//        <BareMetalAssetCreateModal open={open} {...this.props}
//          appendTable={mapAndSubmitModel.bind(this)}
//          closePrompt={closePrompt.bind(this)} />
    
    return (
      <div>
        <Button id={t('modal.create-acmbaremetalasset.button.key')} onClick={onClick.bind(this)}>
          {t('modal.create-acmbaremetalasset.button.text')}
        </Button>
      </div>
    )
  }
}


export default WrappedCreateBareMetalAssetModal
