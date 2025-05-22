/* Copyright Contributors to the Open Cluster Management project */
const EventEmitter = require('events');


class CustomTypescriptLexer extends EventEmitter {
  extract(content) {
    const keys = [];
    // splitting the content into lines for processing
    const lines = content.split('\n');

    for (const line of lines) {
      // find all instances of %namespace~key% pattern in this line
      const pattern = /%([^~%]{1,100})~([^%]{1,100})%/g;
      let match;

      while ((match = pattern.exec(line)) !== null) {
        const key = match[2];
        keys.push({ key });
      }
    }

    return keys;
  }
}

module.exports = { CustomTypescriptLexer };

