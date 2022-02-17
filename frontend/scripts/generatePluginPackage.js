/* Copyright Contributors to the Open Cluster Management project */
const fs = require('fs');

const frontendPackage = JSON.parse(fs.readFileSync('../../package.json'));
frontendPackage.consolePlugin = JSON.parse(fs.readFileSync('./console-plugin.json'));
fs.writeFileSync('./package.json', JSON.stringify(frontendPackage))