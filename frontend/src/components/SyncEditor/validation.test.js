/* Copyright Contributors to the Open Cluster Management project */
// import { render, waitFor } from '@testing-library/react'
// import { createBrowserHistory } from 'history'
// import { Router } from 'react-router-dom'
// import { RecoilRoot } from 'recoil'
import Ajv from 'ajv'
import { addAjvKeywords, compileAjvSchemas, validateResource } from './validation'
import schema from '../../routes/Governance/policies/schema.json'
import { keyBy } from 'lodash'

describe('validation', () => {
  it('addAjvKeywords - returns properly', async () => {
    const ajvKeywords = new Ajv({ allErrors: true, verbose: true })
    addAjvKeywords(ajvKeywords)

    expect(ajvKeywords.RULES.all.validateName).toEqual(expect.objectContaining({ keyword: 'validateName' }))
    expect(ajvKeywords.RULES.all.validateDep).toEqual(expect.objectContaining({ keyword: 'validateDep' }))
    expect(ajvKeywords.RULES.all.validateLabel).toEqual(expect.objectContaining({ keyword: 'validateLabel' }))
  })

  it('compileAJVSchemas - returns properly', async () => {
    const ajvSchemas = compileAjvSchemas(schema)

    expect(ajvSchemas).toMatchSnapshot()
  })

  it('validates incorrect compliance', async () => {
    // raw policy data for validation - ignoring lint for test readability

    // prettier-ignore
    const mappings = {"Policy":[{"apiVersion":{"$k":"apiVersion","$r":1,"$l":1,"$v":"policy.open-cluster-management.io/v1",
            "$gk":{"start":{"line":1,"col":1},"end":{"line":1,"col":11}},"$gv":{"start":{"line":1,"col":13},"end":{"line":1,"col":49}}},
            "kind":{"$k":"kind","$r":2,"$l":1,"$v":"Policy","$gk":{"start":{"line":2,"col":1},"end":{"line":2,"col":5}},
            "$gv":{"start":{"line":2,"col":7},"end":{"line":2,"col":13}}},"metadata":{"$k":"metadata","$r":3,"$l":3,
            "$v":{"name":{"$k":"name","$r":4,"$l":1,"$v":"policy-pod","$gk":{"start":{"line":4,"col":3},"end":{"line":4,"col":7}},
            "$gv":{"start":{"line":4,"col":9},"end":{"line":4,"col":19}}},"namespace":{"$k":"namespace","$r":5,"$l":1,"$v":"default",
            "$gk":{"start":{"line":5,"col":3},"end":{"line":5,"col":12}},"$gv":{"start":{"line":5,"col":14},"end":{"line":5,"col":21}}}},
            "$gk":{"start":{"line":3,"col":1},"end":{"line":3,"col":9}},"$gv":{"start":{"line":4,"col":3},"end":{"line":6,"col":1}}},
            "spec":{"$k":"spec","$r":6,"$l":8,"$v":{"disabled":{"$k":"disabled","$r":7,"$l":1,"$v":false,"$gk":{"start":{"line":7,"col":3},
            "end":{"line":7,"col":11}},"$gv":{"start":{"line":7,"col":13},"end":{"line":7,"col":18}}},"dependencies":{"$k":"dependencies",
            "$r":8,"$l":6,"$v":[{"$k":"0","$r":9,"$l":5,"$v":{"name":{"$k":"name","$r":9,"$l":1,"$v":"namespace-foo-setup-policy",
            "$gk":{"start":{"line":9,"col":7},"end":{"line":9,"col":11}},"$gv":{"start":{"line":9,"col":13},"end":{"line":9,"col":39}}},
            "namespace":{"$k":"namespace","$r":10,"$l":1,"$v":"","$gk":{"start":{"line":10,"col":7},"end":{"line":10,"col":16}},
            "$gv":{"start":{"line":10,"col":18},"end":{"line":10,"col":20}}},"apiVersion":{"$k":"apiVersion","$r":11,"$l":1,
            "$v":"policy.open-cluster-management.io/v1","$gk":{"start":{"line":11,"col":7},"end":{"line":11,"col":17}},"$gv":{"start":{"line":11,"col":19},
            "end":{"line":11,"col":55}}},"kind":{"$k":"kind","$r":12,"$l":1,"$v":"Policy","$gk":{"start":{"line":12,"col":7},"end":{"line":12,"col":11}},
            "$gv":{"start":{"line":12,"col":13},"end":{"line":12,"col":19}}},"compliance":{"$k":"compliance","$r":13,"$l":1,"$v":"Complianta",
            "$gk":{"start":{"line":13,"col":7},"end":{"line":13,"col":17}},"$gv":{"start":{"line":13,"col":19},"end":{"line":13,"col":29}}}},
            "$gv":{"start":{"line":9,"col":7},"end":{"line":14,"col":1}}}],"$gk":{"start":{"line":8,"col":3},"end":{"line":8,"col":15}},
            "$gv":{"start":{"line":9,"col":5},"end":{"line":14,"col":1}}}},"$gk":{"start":{"line":6,"col":1},"end":{"line":6,"col":5}},
            "$gv":{"start":{"line":7,"col":3},"end":{"line":14,"col":1}}}}]}

    // prettier-ignore
    const resource = {"apiVersion":"policy.open-cluster-management.io/v1","kind":"Policy","metadata":{"name":"policy-pod",
            "namespace":"default"},"spec":{"disabled":false,"dependencies":[{"name":"namespace-foo-setup-policy","namespace":"",
            "apiVersion":"policy.open-cluster-management.io/v1","kind":"Policy","compliance":"Complianta"}]}}

    const prefix = ['Policy', 0]
    const errors = []
    const ajvSchemas = compileAjvSchemas(schema)
    const validatorMap = keyBy(ajvSchemas, 'type')
    const validator = validatorMap['Policy'].validator

    validateResource(validator, mappings, prefix, resource, errors, [])

    expect(errors[0]).toEqual(
      expect.objectContaining({
        message: 'must be equal to one of the allowed values: "Compliant", "NonCompliant", "Pending"',
      })
    )
  })

  it('validates incorrect namespace in dependency', async () => {
    // raw policy data for validation - ignoring lint for test readability

    // prettier-ignore
    const mappings = {"Policy":[{"apiVersion":{"$k":"apiVersion","$r":1,"$l":1,"$v":"policy.open-cluster-management.io/v1",
            "$gk":{"start":{"line":1,"col":1},"end":{"line":1,"col":11}},"$gv":{"start":{"line":1,"col":13},"end":{"line":1,"col":49}}},
            "kind":{"$k":"kind","$r":2,"$l":1,"$v":"Policy","$gk":{"start":{"line":2,"col":1},"end":{"line":2,"col":5}},"$gv":{"start":{"line":2,"col":7},
            "end":{"line":2,"col":13}}},"metadata":{"$k":"metadata","$r":3,"$l":3,"$v":{"name":{"$k":"name","$r":4,"$l":1,"$v":"policy-pod",
            "$gk":{"start":{"line":4,"col":3},"end":{"line":4,"col":7}},"$gv":{"start":{"line":4,"col":9},"end":{"line":4,"col":19}}},
            "namespace":{"$k":"namespace","$r":5,"$l":1,"$v":"default","$gk":{"start":{"line":5,"col":3},"end":{"line":5,"col":12}},
            "$gv":{"start":{"line":5,"col":14},"end":{"line":5,"col":21}}}},"$gk":{"start":{"line":3,"col":1},"end":{"line":3,"col":9}},
            "$gv":{"start":{"line":4,"col":3},"end":{"line":6,"col":1}}},"spec":{"$k":"spec","$r":6,"$l":8,"$v":{"disabled":{"$k":"disabled",
            "$r":7,"$l":1,"$v":false,"$gk":{"start":{"line":7,"col":3},"end":{"line":7,"col":11}},"$gv":{"start":{"line":7,"col":13},
            "end":{"line":7,"col":18}}},"dependencies":{"$k":"dependencies","$r":8,"$l":6,"$v":[{"$k":"0","$r":9,"$l":5,"$v":{"name":{"$k":"name","$r":9,
            "$l":1,"$v":"namespace-foo-setup-policy","$gk":{"start":{"line":9,"col":7},"end":{"line":9,"col":11}},"$gv":{"start":{"line":9,"col":13},
            "end":{"line":9,"col":39}}},"namespace":{"$k":"namespace","$r":10,"$l":1,"$v":"default","$gk":{"start":{"line":10,"col":7},"end":{"line":10,
            "col":16}},"$gv":{"start":{"line":10,"col":18},"end":{"line":10,"col":25}}},"apiVersion":{"$k":"apiVersion","$r":11,"$l":1,
            "$v":"policy.open-cluster-management.io/v1","$gk":{"start":{"line":11,"col":7},"end":{"line":11,"col":17}},"$gv":{"start":{"line":11,"col":19},
            "end":{"line":11,"col":55}}},"kind":{"$k":"kind","$r":12,"$l":1,"$v":"ConfigurationPolicy","$gk":{"start":{"line":12,"col":7},"end":{"line":12,"col":11}},
            "$gv":{"start":{"line":12,"col":13},"end":{"line":12,"col":32}}},"compliance":{"$k":"compliance","$r":13,"$l":1,"$v":"Compliant",
            "$gk":{"start":{"line":13,"col":7},"end":{"line":13,"col":17}},"$gv":{"start":{"line":13,"col":19},"end":{"line":13,"col":28}}}},"$gv":{"start":{"line":9,
            "col":7},"end":{"line":14,"col":1}}}],"$gk":{"start":{"line":8,"col":3},"end":{"line":8,"col":15}},"$gv":{"start":{"line":9,"col":5},
            "end":{"line":14,"col":1}}}},"$gk":{"start":{"line":6,"col":1},"end":{"line":6,"col":5}},"$gv":{"start":{"line":7,"col":3},"end":{"line":14,"col":1}}}}]}

    // prettier-ignore
    const resource = {"apiVersion":"policy.open-cluster-management.io/v1","kind":"Policy","metadata":{"name":"policy-pod","namespace":"default"},
            "spec":{"disabled":false,"dependencies":[{"name":"namespace-foo-setup-policy","namespace":"default","apiVersion":"policy.open-cluster-management.io/v1",
            "kind":"ConfigurationPolicy","compliance":"Compliant"}]}}

    const prefix = ['Policy', 0]
    const errors = []
    const ajvSchemas = compileAjvSchemas(schema)
    const validatorMap = keyBy(ajvSchemas, 'type')
    const validator = validatorMap['Policy'].validator

    validateResource(validator, mappings, prefix, resource, errors, [])

    expect(errors[0]).toEqual(
      expect.objectContaining({
        message:
          'Dependencies on ConfigurationPolicies, IamPolicies, and CertificatePolicies cannot contain a namespace',
      })
    )
  })
})
