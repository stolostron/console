/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable jest/no-conditional-expect */

import {
  validateKubernetesDnsName,
  validatePrivateSshKey,
  validatePublicSshKey,
  validateCertificate,
  validateGCProjectID,
  validateJSON,
  validateLibvirtURI,
  validateBaseDnsName,
  validateCloudsYaml,
  validateVCenterServer,
  validateNoProxy,
  validateNoProxyList,
} from './validation'

const t = (key: string) => key
describe('validation', () => {
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
      if (!isValid) {
        expect(validateKubernetesDnsName(value, t)).toBeTruthy()
      } else {
        expect(validateKubernetesDnsName(value, t)).toBeUndefined()
      }
    })
  })
  describe('validatePrivateSshKey', () => {
    test('validatePrivateSshKey should allow valid openssh key', () => {
      expect(
        validatePrivateSshKey('-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----\n', t)
      ).toBeUndefined()
    })

    test('validatePrivateSshKey should allow any key', () => {
      expect(
        validatePrivateSshKey('-----BEGIN A PRIVATE KEY-----\nabc\n-----END A PRIVATE KEY-----\n', t)
      ).toBeUndefined()
    })

    test('validatePrivateSshKey should not allow empty key type', () => {
      expect(
        validatePrivateSshKey('-----BEGIN A PRIVATE KEY-----\n-----END A PRIVATE KEY-----\n', t)
      ).not.toBeUndefined()
    })

    test('validatePrivateSshKey should require new line', () => {
      expect(
        validatePrivateSshKey('-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----', t)
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
      if (!isValid) {
        expect(validateCertificate(value, t)).toBeTruthy()
      } else {
        expect(validateCertificate(value, t)).toBeUndefined()
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
      if (!isValid) {
        expect(validatePublicSshKey(value, t, true)).toBeTruthy()
      } else {
        expect(validatePublicSshKey(value, t, true)).toBeUndefined()
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
      if (!isValid) {
        expect(validateGCProjectID(value, t)).toBeTruthy()
      } else {
        expect(validateGCProjectID(value, t)).toBeUndefined()
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
      if (!isValid) {
        expect(validateJSON(value, t)).toBeTruthy()
      } else {
        expect(validateJSON(value, t)).toBeUndefined()
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
      if (!isValid) {
        expect(validateLibvirtURI(value, t)).toBeTruthy()
      } else {
        expect(validateLibvirtURI(value, t)).toBeUndefined()
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
      if (!isValid) {
        expect(validateBaseDnsName(value, t)).toBeTruthy()
      } else {
        expect(validateBaseDnsName(value, t)).toBeUndefined()
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
      if (!isValid) {
        expect(validateCloudsYaml(value, value2, value3, t)).toBeTruthy()
      } else {
        expect(validateCloudsYaml(value, value2, value3, t)).toBeUndefined()
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
      if (!isValid) {
        expect(validateVCenterServer(value, t)).toBeTruthy()
      } else {
        expect(validateVCenterServer(value, t)).toBeUndefined()
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
      if (!isValid) {
        expect(validateNoProxy(value, t)).toBeTruthy()
      } else {
        expect(validateNoProxy(value, t)).toBeUndefined()
      }
    })
  })
  describe('validateNoProxyList', () => {
    test.each([
      ['should allow a CSV with valid no proxy values', 'ca,.com,example.org,10.0.0.1,*', true], // NOSONAR - IP address used in test
      ['should not allow a CSV with any bad proxy value', 'ca,.com,example.org,10.0.0.*,*', false], // NOSONAR - IP address used in test
    ])('%s', (_name, value, isValid) => {
      if (!isValid) {
        expect(validateNoProxyList(value, t)).toBeTruthy()
      } else {
        expect(validateNoProxyList(value, t)).toBeUndefined()
      }
    })
  })
})
