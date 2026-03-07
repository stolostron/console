/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable jest/no-conditional-expect */

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
      [`should allow lowercase alphabets`, 'abc', true],
      [`should allow empty`, '', true],
      [`should allow number`, '123', true],
      [`should allow name with '-'`, 'ab-c12', true],
      [
        `should not allow name longer than 63`,
        'abcd012345678901234567890123456789012345678901234567890123456789',
        false,
      ],
      [`should not allow '.'`, 'abc.d', false],
      [`should not allow '_'`, 'abc_d', false],
      [`should not allow start with '-'`, '-abc', false],
      [`should not allow end with '-'`, 'abc-', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateKubernetesDnsName(value)).toBeUndefined()
      } else {
        expect(validateKubernetesDnsName(value)).toBeTruthy()
      }
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
      expect(validatePrivateSshKey('-----BEGIN A PRIVATE KEY-----\n-----END A PRIVATE KEY-----\n')).not.toBeUndefined()
    })

    test('validatePrivateSshKey should require new line', () => {
      expect(
        validatePrivateSshKey('-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----')
      ).not.toBeUndefined()
    })
  })
  describe('validateCertificate', () => {
    test.each([
      [`should allow valid certificate`, '-----BEGIN CERTIFICATE-----\nkey\n-----END CERTIFICATE-----', true],
      [`should not allow non certificate type`, '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----', false],
      [
        `should not allow end line next to the begin line`,
        '-----BEGIN CERTIFICATE-----\n-----END CERTIFICATE-----',
        false,
      ],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateCertificate(value)).toBeUndefined()
      } else {
        expect(validateCertificate(value)).toBeTruthy()
      }
    })
  })
  describe('validatePublicSshKey', () => {
    test.each([
      [`should allow rsa public key`, 'ssh-rsa AAAAB3Nz', true],
      [`should allow ed25519 public key`, 'ssh-ed25519 AAAAC3', true],
      [`should not allow unsupported type`, 'ssh-abc AAAAB3Nz', false],
      [`should not allow wrong length in key`, 'ssh-rsa AAAAC3', false],
      [`should not allow invalid rsa key`, 'ssh-rsa ABC', false],
      [`should not allow empty input`, '', false],
      [`should not allow invalid character in key`, 'ssh-rsa A@B-C', false],
      [`should not allow non public key`, 'abcdefg', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validatePublicSshKey(value, true)).toBeUndefined()
      } else {
        expect(validatePublicSshKey(value, true)).toBeTruthy()
      }
    })
  })
  describe('validateGCProjectID', () => {
    test.each([
      [`should allow lowercase alphabets`, 'abcdefg', true],
      [`should allow number (start with alphabets)`, 'a123456', true],
      [`should allow name with '-'`, 'ab-c123', true],
      [`should not allow less than 6`, 'abc', false],
      [`should not allow longer than 30`, 'a012345678901234567890123456789', false],
      [`should not allow '.'`, 'a.abcdef', false],
      [`should not allow start with '-'`, '-abcdef', false],
      [`should not allow end with '-'`, 'abcdef-', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateGCProjectID(value)).toBeUndefined()
      } else {
        expect(validateGCProjectID(value)).toBeTruthy()
      }
    })
  })
  describe('validateJSON', () => {
    test.each([
      [`should allow json object with entries`, '{"a":"b","c":"d"}', true],
      [`should allow array with entries`, '[1]', true],
      [`should allow json string`, '"abc"', true],
      [`should not allow empty object`, '{}', false],
      [`should not allow plain string`, 'abc', false],
      [`should not allow non json string`, '{abc:"def"}', false],
      [`should not allow empty string`, '', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateJSON(value)).toBeUndefined()
      } else {
        expect(validateJSON(value)).toBeTruthy()
      }
    })
  })
  describe('validateLibvirtURI', () => {
    test.each([
      [`should allow qemu+ssh://any`, 'qemu+ssh://any', true],
      [`should not allow only ssh protocols (no qemu)`, 'ssh://any', false],
      [`should not allow only qemu`, 'qemu://any', false],
      [`should not allow empty path`, '"qemu+ssh://"', false],
      [`should not allow non uri`, '"qemu+ssh/b/c"', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateLibvirtURI(value)).toBeUndefined()
      } else {
        expect(validateLibvirtURI(value)).toBeTruthy()
      }
    })
  })
  describe('validateBaseDnsName', () => {
    test.each([
      [`should allow normal dns name`, 'abc', true],
      [`should allow '.' and '-'`, 'a.b-c.d', true],
      [`should not allow with protocols. For example: http://`, 'http://a.b.c', false],
      [`should not allow start with '.'`, '.abc', false],
      [`should not allow end with '.'`, 'abc.', false],
      [`should not allow start with '-'`, '-abc', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateBaseDnsName(value)).toBeUndefined()
      } else {
        expect(validateBaseDnsName(value)).toBeTruthy()
      }
    })
  })

  describe('validateCloudsYaml', () => {
    test.each([
      [
        `should allow normal clouds.yaml`,
        'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"',
        'openstack',
        '',
        true,
      ],
      [
        `should not allow no clouds key`,
        'clou:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"',
        'openstack',
        '',
        false,
      ],
      [
        `should not allow cloud name not found in clouds.yaml`,
        'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"',
        'openst',
        '',
        false,
      ],
      [
        `should not allow missing password in clouds.yaml`,
        'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"',
        'openstack',
        '',
        false,
      ],
      [
        `should not allow missing cacert in clouds.yaml when cacertificate is defined`,
        'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"\n      cacert: "/etc/openstack-ca/ca.crt"',
        'openstack',
        '-----BEGIN CERTIFICATE-----\n-----END CERTIFICATE-----',
        true,
      ],
      [
        `should not allow missing cacert in clouds.yaml when cacertificate is defined`,
        'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"',
        'openstack',
        '-----BEGIN CERTIFICATE-----\n-----END CERTIFICATE-----',
        true,
      ],
    ])('%s', (_name, value, value2, value3, isValid) => {
      if (isValid) {
        expect(validateCloudsYaml(value, value2, value3)).toBeUndefined()
      } else {
        expect(validateCloudsYaml(value, value2, value3)).toBeTruthy()
      }
    })
  })
  describe('validateVCenterServer', () => {
    test.each([
      ['should allow an IPv4 address', '22.22.22.22', true],
      ['should allow an IPv6 address', '2001:0db8:85a3:0000:0000:8a2e:0370:7334', true],
      ['should allow a full-qualified host name', 'example.com', true],
      ['should not allow an unqualified host name', 'example', false],
      ['should not allow a URL', 'https://vcenter.example.com', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateVCenterServer(value)).toBeUndefined()
      } else {
        expect(validateVCenterServer(value)).toBeTruthy()
      }
    })
  })
  describe('validateNoProxy', () => {
    test.each([
      ['should allow a domain without TLD', 'ca', true],
      ['should allow a domain prefaced with .', '.com', true],
      ['should allow an IP address', '10.0.0.1', true], // NOSONAR - IP address used in test
      ['should allow a CIDR', '10.0.0.0/16', true], // NOSONAR - CIDR used in test
      ['should allow *', '*', true],
      ['should not allow a value with spaces', 'test space', false],
      ['should not allow ?', '?', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateNoProxy(value)).toBeUndefined()
      } else {
        expect(validateNoProxy(value)).toBeTruthy()
      }
    })
  })
  describe('validateNoProxyList', () => {
    test.each([
      ['should allow a CSV with valid no proxy values', 'ca,.com,example.org,10.0.0.1,*', true], // NOSONAR - IP address used in test
      ['should not allow a CSV with any bad proxy value', 'ca,.com,example.org,10.0.0.*,*', false], // NOSONAR - IP address used in test
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateNoProxyList(value)).toBeUndefined()
      } else {
        expect(validateNoProxyList(value)).toBeTruthy()
      }
    })
  })

  describe('validateAwsRegion', () => {
    test.each([
      ['should allow a region with valid value', 'us-east-1', true],
      ['should not allow a region with any bad value', 'random', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateAwsRegion(value)).toBeUndefined()
      } else {
        expect(validateAwsRegion(value)).toBeTruthy()
      }
    })
  })

  describe('validateBaseDomain', () => {
    test.each([
      ['should allow a valid domain', 'example.com', true],
      ['should allow a single label', 'example', true],
      ['should allow empty value', '', true],
      ['should not allow start with .', '.example.com', false],
      ['should not allow invalid characters', 'EXAMPLE.COM', false],
      ['should not allow start with -', '-example.com', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateBaseDomain(value)).toBeUndefined()
      } else {
        expect(validateBaseDomain(value)).toBeTruthy()
      }
    })
  })

  describe('validateAnsibleHost', () => {
    test.each([
      ['should allow a valid https URL', 'https://ansible.example.com', true],
      ['should allow a valid http URL', 'http://ansible.example.com', true],
      ['should not allow URL without protocol', 'ansible.example.com', false],
      ['should not allow ftp protocol', 'ftp://ansible.example.com', false],
      ['should not allow plain string', 'not-a-url', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateAnsibleHost(value)).toBeUndefined()
      } else {
        expect(validateAnsibleHost(value)).toBeTruthy()
      }
    })
  })

  describe('validateWebURL', () => {
    test.each([
      ['should allow a valid https URL', 'https://example.com', true],
      ['should allow a valid http URL', 'http://example.com', true],
      ['should not allow URL without protocol', 'example.com', false],
      ['should not allow ftp URL', 'ftp://example.com', false],
      ['should not allow plain string', 'not-a-url', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateWebURL(value)).toBeUndefined()
      } else {
        expect(validateWebURL(value)).toBeTruthy()
      }
    })
  })

  describe('validateImageContentSources', () => {
    test.each([
      ['should allow valid image content sources', '- mirrors:\n    - registry.example.com\n  source: quay.io', true],
      ['should allow empty value', '', true],
      ['should not allow missing mirrors', '- source: quay.io', false],
      ['should not allow missing source', '- mirrors:\n    - registry.example.com', false],
      ['should not allow invalid YAML', '{{invalid', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateImageContentSources(value)).toBeUndefined()
      } else {
        expect(validateImageContentSources(value)).toBeTruthy()
      }
    })
  })

  describe('validateYAML', () => {
    test.each([
      ['should allow valid YAML', 'key: value', true],
      ['should allow empty value', '', true],
      ['should not allow invalid YAML', '{{invalid: yaml:', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateYAML(value)).toBeUndefined()
      } else {
        expect(validateYAML(value)).toBeTruthy()
      }
    })
  })

  describe('validateHttpProxy', () => {
    test.each([
      ['should allow a valid http URL', 'http://proxy.example.com', true],
      ['should allow empty value', '', true],
      ['should not allow https URL', 'https://proxy.example.com', false],
      ['should not allow URL without protocol', 'proxy.example.com', false],
      ['should not allow plain string', 'not-a-url', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateHttpProxy(value)).toBeUndefined()
      } else {
        expect(validateHttpProxy(value)).toBeTruthy()
      }
    })
  })

  describe('validateHttpsProxy', () => {
    test.each([
      ['should allow a valid https URL', 'https://proxy.example.com', true],
      ['should allow a valid http URL', 'http://proxy.example.com', true],
      ['should allow empty value', '', true],
      ['should not allow ftp URL', 'ftp://proxy.example.com', false],
      ['should not allow URL without protocol', 'proxy.example.com', false],
      ['should not allow plain string', 'not-a-url', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateHttpsProxy(value)).toBeUndefined()
      } else {
        expect(validateHttpsProxy(value)).toBeTruthy()
      }
    })
  })

  describe('validateHttpsURL', () => {
    test.each([
      ['should allow a valid https URL', 'https://example.com', true],
      ['should allow a valid https URL with path', 'https://example.com/path', true],
      ['should allow empty value', '', true],
      ['should not allow http URL', 'http://example.com', false],
      ['should not allow URL without protocol', 'example.com', false],
      ['should not allow plain string', 'not-a-url', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateHttpsURL(value)).toBeUndefined()
      } else {
        expect(validateHttpsURL(value)).toBeTruthy()
      }
    })
  })

  describe('validateKubernetesResourceName', () => {
    test.each([
      ['should allow a valid name', 'my-resource.name', true],
      ['should allow empty value', '', true],
      ['should not allow uppercase', 'MyResource', false],
      ['should not allow start with -', '-my-resource', false],
      ['should not allow end with -', 'my-resource-', false],
      ['should not allow underscores', 'my_resource', false],
      ['should not allow longer than 253', 'a'.repeat(254), false],
      ['should not allow empty labels', 'a..b', false],
      ['should not allow labels to start with -', 'a.-b', false],
      ['should not allow labels to end with -', 'a-.b', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateKubernetesResourceName(value)).toBeUndefined()
      } else {
        expect(validateKubernetesResourceName(value)).toBeTruthy()
      }
    })
  })

  describe('validatePolicyName', () => {
    test('should allow a valid policy name', () => {
      const resource = { metadata: { namespace: 'default' } }
      expect(validatePolicyName('my-policy', resource)).toBeUndefined()
    })

    test('should not allow combined namespace and name exceeding 62 characters', () => {
      const resource = { metadata: { namespace: 'my-long-namespace' } }
      expect(validatePolicyName('a'.repeat(46), resource)).toBeTruthy()
    })

    test('should reject invalid kubernetes resource name', () => {
      const resource = { metadata: { namespace: 'default' } }
      expect(validatePolicyName('INVALID', resource)).toBeTruthy()
    })
  })

  describe('validateAppSetName', () => {
    test('should allow a valid app set name', () => {
      const resource = { metadata: { namespace: 'default' } }
      expect(validateAppSetName('my-appset', resource)).toBeUndefined()
    })

    test('should not allow name longer than 53 characters', () => {
      const resource = { metadata: { namespace: 'default' } }
      expect(validateAppSetName('a'.repeat(54), resource)).toBeTruthy()
    })

    test('should reject invalid kubernetes resource name', () => {
      const resource = { metadata: { namespace: 'default' } }
      expect(validateAppSetName('INVALID', resource)).toBeTruthy()
    })
  })

  describe('validateVcenterUsername', () => {
    test.each([
      ['should allow user@domain format', 'admin@vsphere.local', true],
      ['should not allow username without @', 'admin', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateVcenterUsername(value)).toBeUndefined()
      } else {
        expect(validateVcenterUsername(value)).toBeTruthy()
      }
    })
  })

  describe('validateCidr', () => {
    test.each([
      ['should allow a valid IPv4 CIDR', '10.0.0.0/16', true], // NOSONAR - CIDR used in test
      ['should allow empty value', '', true],
      ['should not allow plain IP', '10.0.0.1', false], // NOSONAR - IP address used in test
      ['should not allow invalid CIDR', 'not-a-cidr', false],
    ])('%s', (_name, value, isValid) => {
      if (isValid) {
        expect(validateCidr(value)).toBeUndefined()
      } else {
        expect(validateCidr(value)).toBeTruthy()
      }
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
