'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'carbon-components-react'
import { Tooltip } from 'C:/Users/jswanke/git/temptifly/src' //'temptifly'

class WrappedImportBareMetalAssetsButton extends React.Component {
  static propTypes = {
    appendTable: PropTypes.func,
    locale: PropTypes.string,
  }

  render() {
    const { locale } = this.props
    return (
      <div>
        <Button id={msgs.get('modal.import-acmbaremetalasset.button.key', locale)} onClick={this.importCSV.bind(this)}>
          {msgs.get('modal.import-acmbaremetalasset.button.text', locale)}
        </Button>
        <Tooltip control={{tooltip:msgs.get('modal.import-acmbaremetalasset.button.tooltip', locale)}} locale={locale} />
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
