/* Copyright Contributors to the Open Cluster Management project */
const EventEmitter = require('events')

class CustomPluginExtensionsLexer extends EventEmitter {
  extract(content) {
    const keys = []
    // splitting the content into lines for processing
    const lines = content.split('\n')

    for (const line of lines) {
      // find all instances of %namespace~key% pattern in this line
      const matches = line.matchAll(/%[^~%]+~([^~%]+)%/g)

      for (const match of matches) {
        keys.push({ key: match[1] })
      }
    }

    return keys
  }
}

module.exports = { CustomPluginExtensionsLexer }
