/* Copyright Contributors to the Open Cluster Management project */
'use strict'

/**
 * Unit test to ensure the install-config Handlebars template produces valid YAML
 * when pullSecret is a JSON object string (e.g. for disconnected installation).
 * The template must quote the value so YAML parsers treat it as a string, not a mapping.
 * Disconnected is supported only for vSphere and Red Hat OpenStack Platform (OST).
 */
import Handlebars from 'handlebars'
import jsyaml from 'js-yaml'
import { caseFn, if_eqFn, if_orFn, if_truthyFn, switchFn } from '../../../../../../components/TemplateEditor/helpers'
import installConfigHbs from './install-config.hbs'

const installConfig = Handlebars.compile(installConfigHbs)

const helpers = {
  helpers: {
    case: caseFn,
    if_eq: if_eqFn,
    if_or: if_orFn,
    if_truthy: if_truthyFn,
    switch: switchFn,
  },
}

/** Minimal template data for OpenStack (OST) with imageContentSources (disconnected) so pullSecret is emitted quoted. Disconnected is supported for vSphere and OST only. */
function minimalDisconnectedOSTData(pullSecret) {
  return {
    name: 'test-cluster',
    baseDomain: 'example.com',
    infrastructure: 'OpenStack',
    networkType: 'OpenShiftSDN',
    singleNode: false,
    masterPool: [{ masterType: 'm1.medium' }],
    workerPools: [
      {
        workerName: 'worker',
        computeNodeCount: 3,
        workerType: 'm1.medium',
      },
    ],
    networks: [
      {
        clusterNetwork: '10.128.0.0/14',
        hostPrefix: 23,
        machineCIDR: '10.0.0.0/16',
        serviceNetwork: '172.30.0.0/16',
      },
    ],
    cloud: 'openstack',
    externalNetworkName: 'ext-net',
    ingressFloatingIP: '192.0.2.1',
    imageContentSources: [
      '- mirrors:\n  - mirror.registry.example.com\n  source: quay.io/openshift-release-dev/ocp-release',
    ],
    pullSecret,
  }
}

describe('install-config.hbs YAML output', () => {
  it('produces valid YAML with pullSecret as a quoted string when imageContentSources is set (disconnected OST)', () => {
    const pullSecretJSON = '{"auths":{"registry.example.com":{"auth":"dXNlcnBhc3M="}}}'
    const templateData = minimalDisconnectedOSTData(pullSecretJSON)
    const yaml = installConfig(templateData, helpers)
    const yamlWithoutComments = yaml.replaceAll(/\s*##.+$/gm, '').trim()

    let parsed
    expect(() => {
      parsed = jsyaml.load(yamlWithoutComments)
    }).not.toThrow()

    expect(parsed).toBeDefined()
    expect(parsed.pullSecret).toBeDefined()
    expect(typeof parsed.pullSecret).toBe('string')
    expect(parsed.pullSecret).toBe(pullSecretJSON)

    expect(() => JSON.parse(parsed.pullSecret)).not.toThrow()
    const pullSecretObj = JSON.parse(parsed.pullSecret)
    expect(pullSecretObj.auths).toBeDefined()
    expect(pullSecretObj.auths['registry.example.com'].auth).toBe('dXNlcnBhc3M=')
  })
})
