/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { useValidation } from './useValidation'

jest.mock('../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('validation', () => {
  const {
    validateKubernetesDnsName,
    validatePublicSshKey,
    validatePrivateSshKey,
    validateCertificate,
    validateGCProjectID,
    validateJSON,
    validateBaseDnsName,
    validateLibvirtURI,
    validateBaseDomain,
    validateCloudsYaml,
    validateAnsibleHost,
    validateAwsRegion,
    validateWebURL,
    validateImageContentSources,
    validateYAML,
    validateHttpProxy,
    validateHttpsProxy,
    validateHttpsURL,
    validateNoProxy,
    validateNoProxyList,
    validateKubernetesResourceName,
    validatePolicyName,
    validateAppSetName,
    validateVCenterServer,
    validateVcenterUsername,
    validateCidr,
    validateKubeconfig,
  } = renderHook(() => useValidation()).result.current

  describe('validateKubernetesDnsName', () => {
    test.each([
      [`should allow lowercase alphabets`, 'abc', undefined],
      [`should allow empty`, '', undefined],
      [`should allow number`, '123', undefined],
      [`should allow name with '-'`, 'ab-c12', undefined],
      [
        `should not allow name longer than 63`,
        'abcd012345678901234567890123456789012345678901234567890123456789',
        'validate.kubernetesDnsName.length',
      ],
      [`should not allow '.'`, 'abc.d', 'validate.kubernetesDnsName.char'],
      [`should not allow '_'`, 'abc_d', 'validate.kubernetesDnsName.char'],
      [`should not allow start with '-'`, '-abc', 'validate.kubernetesDnsName.startchar'],
      [`should not allow end with '-'`, 'abc-', 'validate.kubernetesDnsName.endchar'],
    ])('%s', (_name, value, expected) => {
      expect(validateKubernetesDnsName(value)).toBe(expected)
    })
  })
  describe('validatePrivateSshKey', () => {
    test('validatePrivateSshKey should allow valid openssh key', () => {
      expect(
        validatePrivateSshKey('-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----\n')
      ).toBeUndefined()
    })

    test('validatePrivateSshKey should allow any key', () => {
      expect(validatePrivateSshKey('-----BEGIN A PRIVATE KEY-----\nabc\n-----END A PRIVATE KEY-----\n')).toBeUndefined()
    })

    test('validatePrivateSshKey should not allow empty key type', () => {
      expect(validatePrivateSshKey('-----BEGIN A PRIVATE KEY-----\n-----END A PRIVATE KEY-----\n')).toBe(
        'validate.privateSshKey'
      )
    })

    test('validatePrivateSshKey should require new line', () => {
      expect(
        validatePrivateSshKey('-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----')
      ).toBe('validate.mustEndWithNewline')
    })
  })
  describe('validateCertificate', () => {
    test.each([
      [`should allow valid certificate`, '-----BEGIN CERTIFICATE-----\nkey\n-----END CERTIFICATE-----', undefined],
      [
        `should not allow non certificate type`,
        '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
        'validate.certificate',
      ],
      [
        `should not allow end line next to the begin line`,
        '-----BEGIN CERTIFICATE-----\n-----END CERTIFICATE-----',
        'validate.certificate',
      ],
    ])('%s', (_name, value, expected) => {
      expect(validateCertificate(value)).toBe(expected)
    })
  })
  describe('validatePublicSshKey', () => {
    test.each([
      [`should allow rsa public key`, 'ssh-rsa AAAAB3Nz', undefined],
      [`should allow ed25519 public key`, 'ssh-ed25519 AAAAC3', undefined],
      [`should not allow unsupported type`, 'ssh-abc AAAAB3Nz', 'validate.publicSshKey'],
      [`should not allow wrong length in key`, 'ssh-rsa AAAAC3', 'validate.publicSshKey'],
      [`should not allow invalid rsa key`, 'ssh-rsa ABC', 'validate.publicSshKey'],
      [`should not allow empty input`, '', 'validate.publicSshKey'],
      [`should not allow invalid character in key`, 'ssh-rsa A@B-C', 'validate.publicSshKey'],
      [`should not allow non public key`, 'abcdefg', 'validate.publicSshKey'],
    ])('%s', (_name, value, expected) => {
      expect(validatePublicSshKey(value, true)).toBe(expected)
    })
  })
  describe('validateGCProjectID', () => {
    test.each([
      [`should allow lowercase alphabets`, 'abcdefg', undefined],
      [`should allow number (start with alphabets)`, 'a123456', undefined],
      [`should allow name with '-'`, 'ab-c123', undefined],
      [`should not allow less than 6`, 'abc', 'validate.projectID.format'],
      [`should not allow longer than 30`, 'a012345678901234567890123456789', 'validate.projectID.format'],
      [`should not allow '.'`, 'a.abcdef', 'validate.projectID.format'],
      [`should not allow start with '-'`, '-abcdef', 'validate.projectID.format'],
      [`should not allow end with '-'`, 'abcdef-', 'validate.projectID.format'],
    ])('%s', (_name, value, expected) => {
      expect(validateGCProjectID(value)).toBe(expected)
    })
  })
  describe('validateJSON', () => {
    test.each([
      [`should allow json object with entries`, '{"a":"b","c":"d"}', undefined],
      [`should allow array with entries`, '[1]', undefined],
      [`should allow json string`, '"abc"', undefined],
      [`should not allow empty object`, '{}', 'validate.json'],
      [`should not allow plain string`, 'abc', 'validate.json'],
      [`should not allow non json string`, '{abc:"def"}', 'validate.json'],
      [`should not allow empty string`, '', 'validate.json'],
    ])('%s', (_name, value, expected) => {
      expect(validateJSON(value)).toBe(expected)
    })
  })
  describe('validateLibvirtURI', () => {
    test.each([
      [`should allow qemu+ssh://any`, 'qemu+ssh://any', undefined],
      [`should not allow only ssh protocols (no qemu)`, 'ssh://any', 'validate.libevirtURI.format'],
      [`should not allow only qemu`, 'qemu://any', 'validate.libevirtURI.format'],
      [`should not allow empty path`, '"qemu+ssh://"', 'validate.libevirtURI.format'],
      [`should not allow non uri`, '"qemu+ssh/b/c"', 'validate.libevirtURI.format'],
    ])('%s', (_name, value, expected) => {
      expect(validateLibvirtURI(value)).toBe(expected)
    })
  })
  describe('validateBaseDnsName', () => {
    test.each([
      [`should allow normal dns name`, 'abc', undefined],
      [`should allow '.' and '-'`, 'a.b-c.d', undefined],
      [`should not allow with protocols. For example: http://`, 'http://a.b.c', 'validate.baseDnsName.char'],
      [`should not allow start with '.'`, '.abc', 'validate.baseDnsName.start'],
      [`should not allow end with '.'`, 'abc.', 'validate.baseDnsName.char'],
      [`should not allow start with '-'`, '-abc', 'validate.baseDnsName.char'],
    ])('%s', (_name, value, expected) => {
      expect(validateBaseDnsName(value)).toBe(expected)
    })
  })

  describe('validateCloudsYaml', () => {
    test.each([
      [
        `should allow normal clouds.yaml`,
        'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"',
        'openstack',
        '',
        undefined,
      ],
      [
        `should not allow no clouds key`,
        'clou:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"',
        'openstack',
        '',
        'validate.yaml.not.valid',
      ],
      [
        `should not allow cloud name not found in clouds.yaml`,
        'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"',
        'openst',
        '',
        'validate.yaml.cloud.not.found',
      ],
      [
        `should not allow missing password in clouds.yaml`,
        'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"',
        'openstack',
        '',
        'validate.yaml.cloud.auth.not.found',
      ],
      [
        `should allow valid cacert in clouds.yaml when certificate bundle is defined`,
        'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"\n      cacert: "/etc/openstack-ca/ca.crt"',
        'openstack',
        '-----BEGIN CERTIFICATE-----\n-----END CERTIFICATE-----',
        undefined,
      ],
      [
        `should allow no cacert in clouds.yaml when certificate bundle is defined`,
        'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"',
        'openstack',
        '-----BEGIN CERTIFICATE-----\n-----END CERTIFICATE-----',
        undefined,
      ],
      [
        `should not allow invalid cacert path in clouds.yaml when certificate bundle is defined`,
        'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"\n      cacert: "/wrong/path/ca.crt"',
        'openstack',
        '-----BEGIN CERTIFICATE-----\n-----END CERTIFICATE-----',
        'validate.yaml.cloud.cacert.not.found',
      ],
      [
        `should not allow cacert in clouds.yaml when no certificate bundle is defined`,
        'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"\n      cacert: "/etc/openstack-ca/ca.crt"',
        'openstack',
        '',
        'validate.yaml.cloud.cacert.was.found',
      ],
      [
        `should not allow invalid YAML`,
        '{{invalid',
        'openstack',
        '',
        'validate.yaml.not.valid',
      ],
    ])('%s', (_name, value, value2, value3, expected) => {
      expect(validateCloudsYaml(value, value2, value3)).toBe(expected)
    })
  })
  describe('validateVCenterServer', () => {
    test.each([
      ['should allow an IPv4 address', '22.22.22.22', undefined],
      ['should allow an IPv6 address', '2001:0db8:85a3:0000:0000:8a2e:0370:7334', undefined],
      ['should allow a full-qualified host name', 'example.com', undefined],
      [
        'should not allow an unqualified host name',
        'example',
        'The value must be a fully-qualified host name or IP address.',
      ],
      [
        'should not allow a URL',
        'https://vcenter.example.com',
        "The value must be a fully-qualified host name or IP address. Do not include the '{{scheme}}://' URL scheme.",
      ],
    ])('%s', (_name, value, expected) => {
      expect(validateVCenterServer(value)).toBe(expected)
    })
  })
  describe('validateNoProxy', () => {
    const noProxyError =
      "Each value must be a domain name (optionally prefaced with '.' to match subdomains only), IP address, other network CIDR, or '*'."
    test.each([
      ['should allow a domain without TLD', 'ca', undefined],
      ['should allow a domain prefaced with .', '.com', undefined],
      ['should allow an IP address', '10.0.0.1', undefined], // NOSONAR - IP address used in test
      ['should allow a CIDR', '10.0.0.0/16', undefined], // NOSONAR - CIDR used in test
      ['should allow *', '*', undefined],
      ['should not allow a value with spaces', 'test space', noProxyError],
      ['should not allow ?', '?', noProxyError],
    ])('%s', (_name, value, expected) => {
      expect(validateNoProxy(value)).toBe(expected)
    })
  })
  describe('validateNoProxyList', () => {
    const noProxyError =
      "Each value must be a domain name (optionally prefaced with '.' to match subdomains only), IP address, other network CIDR, or '*'."
    test.each([
      ['should allow a CSV with valid no proxy values', 'ca,.com,example.org,10.0.0.1,*', undefined], // NOSONAR - IP address used in test
      ['should not allow a CSV with any bad proxy value', 'ca,.com,example.org,10.0.0.*,*', noProxyError], // NOSONAR - IP address used in test
    ])('%s', (_name, value, expected) => {
      expect(validateNoProxyList(value)).toBe(expected)
    })
  })

  describe('validateAwsRegion', () => {
    test.each([
      ['should allow a region with valid value', 'us-east-1', undefined],
      [
        'should not allow a region with any bad value',
        'random',
        'The provided region is not a valid Amazon Web Service region.',
      ],
    ])('%s', (_name, value, expected) => {
      expect(validateAwsRegion(value)).toBe(expected)
    })
  })

  describe('validateBaseDomain', () => {
    test.each([
      ['should allow a valid domain', 'example.com', undefined],
      ['should allow a single label', 'example', undefined],
      ['should allow empty value', '', undefined],
      ['should not allow start with .', '.example.com', 'validate.baseDomain.baseDNSPeriod'],
      ['should not allow invalid characters', 'EXAMPLE.COM', 'validate.baseDomain.name'],
      ['should not allow start with -', '-example.com', 'validate.baseDomain.name'],
    ])('%s', (_name, value, expected) => {
      expect(validateBaseDomain(value)).toBe(expected)
    })
  })

  describe('validateAnsibleHost', () => {
    test.each([
      ['should allow a valid https URL', 'https://ansible.example.com', undefined],
      ['should allow a valid http URL', 'http://ansible.example.com', undefined],
      ['should not allow URL without protocol', 'ansible.example.com', 'validate.ansible.url.not.valid'],
      ['should not allow ftp protocol', 'ftp://ansible.example.com', 'validate.ansible.url.not.valid'],
      ['should not allow plain string', 'not-a-url', 'validate.ansible.url.not.valid'],
    ])('%s', (_name, value, expected) => {
      expect(validateAnsibleHost(value)).toBe(expected)
    })
  })

  describe('validateWebURL', () => {
    test.each([
      ['should allow a valid https URL', 'https://example.com', undefined],
      ['should allow a valid http URL', 'http://example.com', undefined],
      ['should not allow URL without protocol', 'example.com', 'The URL is not valid.'],
      ['should not allow ftp URL', 'ftp://example.com', 'The URL is not valid.'],
      ['should not allow plain string', 'not-a-url', 'The URL is not valid.'],
    ])('%s', (_name, value, expected) => {
      expect(validateWebURL(value)).toBe(expected)
    })
  })

  describe('validateImageContentSources', () => {
    test.each([
      ['should allow valid image content sources', '- mirrors:\n    - registry.example.com\n  source: quay.io', undefined],
      ['should allow empty value', '', undefined],
      ['should not allow missing mirrors', '- source: quay.io', 'validate.yaml.not.valid'],
      ['should not allow missing source', '- mirrors:\n    - registry.example.com', 'validate.yaml.not.valid'],
      ['should not allow invalid YAML', '{{invalid', 'validate.yaml.not.valid'],
    ])('%s', (_name, value, expected) => {
      expect(validateImageContentSources(value)).toBe(expected)
    })
  })

  describe('validateYAML', () => {
    test.each([
      ['should allow valid YAML', 'key: value', undefined],
      ['should allow empty value', '', undefined],
      ['should not allow invalid YAML', '{{invalid: yaml:', 'validate.yaml.not.valid'],
    ])('%s', (_name, value, expected) => {
      expect(validateYAML(value)).toBe(expected)
    })
  })

  describe('validateHttpProxy', () => {
    test.each([
      ['should allow a valid http URL', 'http://proxy.example.com', undefined],
      ['should allow empty value', '', undefined],
      ['should not allow https URL', 'https://proxy.example.com', 'validate.http.proxy.url.not.valid'],
      ['should not allow URL without protocol', 'proxy.example.com', 'validate.http.proxy.url.not.valid'],
      ['should not allow plain string', 'not-a-url', 'validate.http.proxy.url.not.valid'],
    ])('%s', (_name, value, expected) => {
      expect(validateHttpProxy(value)).toBe(expected)
    })
  })

  describe('validateHttpsProxy', () => {
    test.each([
      ['should allow a valid https URL', 'https://proxy.example.com', undefined],
      ['should allow a valid http URL', 'http://proxy.example.com', undefined],
      ['should allow empty value', '', undefined],
      ['should not allow ftp URL', 'ftp://proxy.example.com', 'validate.https.proxy.url.not.valid'],
      ['should not allow URL without protocol', 'proxy.example.com', 'validate.https.proxy.url.not.valid'],
      ['should not allow plain string', 'not-a-url', 'validate.https.proxy.url.not.valid'],
    ])('%s', (_name, value, expected) => {
      expect(validateHttpsProxy(value)).toBe(expected)
    })
  })

  describe('validateHttpsURL', () => {
    test.each([
      ['should allow a valid https URL', 'https://example.com', undefined],
      ['should allow a valid https URL with path', 'https://example.com/path', undefined],
      ['should allow empty value', '', undefined],
      ['should not allow http URL', 'http://example.com', 'validate.https.url.not.valid'],
      ['should not allow URL without protocol', 'example.com', 'validate.https.url.not.valid'],
      ['should not allow plain string', 'not-a-url', 'validate.https.url.not.valid'],
    ])('%s', (_name, value, expected) => {
      expect(validateHttpsURL(value)).toBe(expected)
    })
  })

  describe('validateKubernetesResourceName', () => {
    test.each([
      ['should allow a valid name', 'my-resource.name', undefined],
      ['should allow empty value', '', undefined],
      [
        'should not allow uppercase',
        'MyResource',
        "This value can only contain lowercase alphanumeric characters or '-' or '.'",
      ],
      ['should not allow start with -', '-my-resource', 'This value must start with an alphanumeric character'],
      ['should not allow end with -', 'my-resource-', 'This value must end with an alphanumeric character'],
      [
        'should not allow underscores',
        'my_resource',
        "This value can only contain lowercase alphanumeric characters or '-' or '.'",
      ],
      ['should not allow longer than 253', 'a'.repeat(254), 'This value can contain at most 253 characters'],
      ['should not allow empty labels', 'a..b', 'This value must be a valid lowercase RFC 1123 subdomain.'],
      ['should not allow labels to start with -', 'a.-b', 'This value must be a valid lowercase RFC 1123 subdomain.'],
      ['should not allow labels to end with -', 'a-.b', 'This value must be a valid lowercase RFC 1123 subdomain.'],
    ])('%s', (_name, value, expected) => {
      expect(validateKubernetesResourceName(value)).toBe(expected)
    })
  })

  describe('validatePolicyName', () => {
    test('should allow a valid policy name', () => {
      const resource = { metadata: { namespace: 'default' } }
      expect(validatePolicyName('my-policy', resource)).toBeUndefined()
    })

    test('should not allow combined namespace and name exceeding 62 characters', () => {
      const resource = { metadata: { namespace: 'my-long-namespace' } }
      expect(validatePolicyName('a'.repeat(46), resource)).toBe(
        'The combined length of the policy namespace and name must not exceed 62 characters'
      )
    })

    test('should reject invalid kubernetes resource name', () => {
      const resource = { metadata: { namespace: 'default' } }
      expect(validatePolicyName('INVALID', resource)).toBe(
        "This value can only contain lowercase alphanumeric characters or '-' or '.'"
      )
    })
  })

  describe('validateAppSetName', () => {
    test('should allow a valid app set name', () => {
      const resource = { metadata: { namespace: 'default' } }
      expect(validateAppSetName('my-appset', resource)).toBeUndefined()
    })

    test('should not allow name longer than 53 characters', () => {
      const resource = { metadata: { namespace: 'default' } }
      expect(validateAppSetName('a'.repeat(54), resource)).toBe(
        'The length of application set name must not exceed 53 characters'
      )
    })

    test('should reject invalid kubernetes resource name', () => {
      const resource = { metadata: { namespace: 'default' } }
      expect(validateAppSetName('INVALID', resource)).toBe(
        "This value can only contain lowercase alphanumeric characters or '-' or '.'"
      )
    })
  })

  describe('validateVcenterUsername', () => {
    test.each([
      ['should allow user@domain format', 'admin@vsphere.local', undefined],
      ['should not allow username without @', 'admin', 'Value must be in <user>@<domain> format.'],
    ])('%s', (_name, value, expected) => {
      expect(validateVcenterUsername(value)).toBe(expected)
    })
  })

  describe('validateCidr', () => {
    test.each([
      ['should allow a valid IPv4 CIDR', '10.0.0.0/16', undefined], // NOSONAR - CIDR used in test
      ['should allow empty value', '', undefined],
      ['should not allow plain IP', '10.0.0.1', 'Value must be a valid IPv4 CIDR.'], // NOSONAR - IP address used in test
      ['should not allow invalid CIDR', 'not-a-cidr', 'Value must be a valid IPv4 CIDR.'],
    ])('%s', (_name, value, expected) => {
      expect(validateCidr(value)).toBe(expected)
    })
  })

  describe('validateKubeconfig2', () => {
    test('valid kubeconfig', () => {
      const validYaml = `
      clusters:
        - name: cluster
          cluster:
            server: https://example.com
      contexts:
        - name: context
          context:
            cluster: cluster
            user: user
      users:
        - name: user
          user:
            token: token
      current-context: context
    `
      expect(validateKubeconfig(validYaml)).toBeUndefined()
    })

    test('invalid YAML', () => {
      expect(validateKubeconfig('invalid: yaml: :')).toBe('validate.kubeconfig.invalidYaml')
    })

    test('missing clusters', () => {
      const yaml = `
      contexts:
        - name: context
          context:
            cluster: cluster
            user: user
      users:
        - name: user
          user:
            token: token
      current-context: context
    `
      expect(validateKubeconfig(yaml)).toBe('validate.kubeconfig.invalidStructure')
    })

    test('missing contexts', () => {
      const yaml = `
      clusters:
        - name: cluster
          cluster:
            server: https://example.com
      users:
        - name: user
          user:
            token: token
      current-context: context
    `
      expect(validateKubeconfig(yaml)).toBe('validate.kubeconfig.invalidStructure')
    })

    test('missing users', () => {
      const yaml = `
      clusters:
        - name: cluster
          cluster:
            server: https://example.com
      contexts:
        - name: context
          context:
            cluster: cluster
            user: user
      current-context: context
    `
      expect(validateKubeconfig(yaml)).toBe('validate.kubeconfig.invalidStructure')
    })

    test('missing current-context', () => {
      const yaml = `
      clusters:
        - name: cluster
          cluster:
            server: https://example.com
      contexts:
        - name: context
          context:
            cluster: cluster
            user: user
      users:
        - name: user
          user:
            token: token
    `
      expect(validateKubeconfig(yaml)).toBe('validate.kubeconfig.invalidStructure')
    })

    test('clusters not an array', () => {
      const yaml = `
      clusters: {}
      contexts:
        - name: context
          context:
            cluster: cluster
            user: user
      users:
        - name: user
          user:
            token: token
      current-context: context
    `
      expect(validateKubeconfig(yaml)).toBe('validate.kubeconfig.invalidArrayStructure')
    })

    test('contexts not an array', () => {
      const yaml = `
      clusters:
        - name: cluster
          cluster:
            server: https://example.com
      contexts: {}
      users:
        - name: user
          user:
            token: token
      current-context: context
    `
      expect(validateKubeconfig(yaml)).toBe('validate.kubeconfig.invalidArrayStructure')
    })

    test('users not an array', () => {
      const yaml = `
      clusters:
        - name: cluster
          cluster:
            server: https://example.com
      contexts:
        - name: context
          context:
            cluster: cluster
            user: user
      users: {}
      current-context: context
    `
      expect(validateKubeconfig(yaml)).toBe('validate.kubeconfig.invalidArrayStructure')
    })

    test('empty clusters array', () => {
      const yaml = `
      clusters: []
      contexts:
        - name: context
          context:
            cluster: cluster
            user: user
      users:
        - name: user
          user:
            token: token
      current-context: context
    `
      expect(validateKubeconfig(yaml)).toBe('validate.kubeconfig.invalidStructure')
    })

    test('empty contexts array', () => {
      const yaml = `
      clusters:
        - name: cluster
          cluster:
            server: https://example.com
      contexts: []
      users:
        - name: user
          user:
            token: token
      current-context: context
    `
      expect(validateKubeconfig(yaml)).toBe('validate.kubeconfig.invalidStructure')
    })

    test('empty users array', () => {
      const yaml = `
      clusters:
        - name: cluster
          cluster:
            server: https://example.com
      contexts:
        - name: context
          context:
            cluster: cluster
            user: user
      users: []
      current-context: context
    `
      expect(validateKubeconfig(yaml)).toBe('validate.kubeconfig.invalidStructure')
    })
  })
})
