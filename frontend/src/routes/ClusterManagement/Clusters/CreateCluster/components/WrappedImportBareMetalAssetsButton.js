
import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'carbon-components-react'
import { Tooltip } from 'C:/Users/jswanke/git/temptifly/src' //'temptifly'
import i18n from 'i18next'

class WrappedImportBareMetalAssetsButton extends React.Component {
  static propTypes = {
    appendTable: PropTypes.func,
  }

  render() {
    return (
      <div>
        <Button id={i18n('modal.import-acmbaremetalasset.button.key')} onClick={this.importCSV.bind(this)}>
          {i18n('modal.import-acmbaremetalasset.button.text')}
        </Button>
        <Tooltip control={{tooltip:i18n('modal.import-acmbaremetalasset.button.tooltip')}} />
      </div>
    )
  }

  importCSV() {
    const { appendTable } = this.props
    const input = document.createElement('input')
    input.type = 'file'
    input.accept= '.csv, .txt'
    input.onchange = e => {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.readAsText(file,'UTF-8')
      reader.onload = readerEvent => {
        const content = readerEvent.target.result

        // parse csv
        const allTextLines = content.split(/\r\n|\n/)
        const headers = allTextLines.shift().split(',')
        const lines = []
        allTextLines.forEach(line=>{
          const data = line.split(',')
          if (data.length === headers.length) {
            const arr = []
            headers.forEach((header, inx)=>{
              arr.push(`"${header.trim()}": "${data[inx].trim()}"`)
            })
            arr.push(`"id": "${Math.random().toString()}"`)
            lines.push(`{${arr.join(',')}}`)
          }
        })

        try {
          const bmas = JSON.parse(`[${lines.join(',')}]`)
          appendTable(bmas)
        } catch (err) {
          // handle exception
        }
      }
    }
    input.click()
  }
}


export default WrappedImportBareMetalAssetsButton
