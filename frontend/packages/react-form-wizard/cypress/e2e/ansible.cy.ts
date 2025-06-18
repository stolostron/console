/// <reference types="cypress" />
import YAML from 'yaml'

describe('ansible wizard', () => {
    it('displays', () => {
        cy.visit('http://localhost:3000/?route=ansible')
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
        cy.get('h1').contains('Create Ansible automation')
    })

    it('details', () => {
        cy.get('#name').type('my-template')
        cy.get('#namespace').click().get('#default').click()
        cy.contains('Next').click()
    })

    it('install', () => {
        cy.get('#install-secret').click().get('#my-inst-creds').click()

        cy.get('#install-prehooks').within(() => {
            cy.contains('Add job template').click()
            cy.get('#install-prehooks-1').within(() => {
                cy.get('#name').type('pre-inst-1')
                cy.get('#extra_vars').within(() => {
                    cy.get('#add-button').click()
                    cy.get('#key-1').type('pre-inst-1-var-1')
                    cy.get('#value-1').type('pre-inst-1-val-1')
                    cy.get('#add-button').click()
                    cy.get('#key-2').type('pre-inst-1-var-2')
                    cy.get('#value-2').type('pre-inst-1-val-2')
                })
                cy.get('.pf-v5-c-form__field-group-toggle').within(() => {
                    cy.get('.pf-v5-c-button').click()
                })
            })
            cy.contains('Add job template').click()
            cy.get('#install-prehooks-2').within(() => {
                cy.get('#name').type('pre-inst-2')
                cy.get('#extra_vars').within(() => {
                    cy.get('#add-button').click()
                    cy.get('#key-1').type('pre-inst-2-var-1')
                    cy.get('#value-1').type('pre-inst-2-val-1')
                    cy.get('#add-button').click()
                    cy.get('#key-2').type('pre-inst-2-var-2')
                    cy.get('#value-2').type('pre-inst-2-val-2')
                })
                cy.get('.pf-v5-c-form__field-group-toggle').within(() => {
                    cy.get('.pf-v5-c-button').click()
                })
            })
        })

        cy.get('#install-posthooks').within(() => {
            cy.contains('Add job template').click()
            cy.get('#install-posthooks-1').within(() => {
                cy.get('#name').type('post-inst-1')
                cy.get('#extra_vars').within(() => {
                    cy.get('#add-button').click()
                    cy.get('#key-1').type('post-inst-1-var-1')
                    cy.get('#value-1').type('post-inst-1-val-1')
                    cy.get('#add-button').click()
                    cy.get('#key-2').type('post-inst-1-var-2')
                    cy.get('#value-2').type('post-inst-1-val-2')
                })
                cy.get('.pf-v5-c-form__field-group-toggle').within(() => {
                    cy.get('.pf-v5-c-button').click()
                })
            })
            cy.contains('Add job template').click()
            cy.get('#install-posthooks-2').within(() => {
                cy.get('#name').type('post-inst-2')
                cy.get('#extra_vars').within(() => {
                    cy.get('#add-button').click()
                    cy.get('#key-1').type('post-inst-2-var-1')
                    cy.get('#value-1').type('post-inst-2-val-1')
                    cy.get('#add-button').click()
                    cy.get('#key-2').type('post-inst-2-var-2')
                    cy.get('#value-2').type('post-inst-2-val-2')
                })
                cy.get('.pf-v5-c-form__field-group-toggle').within(() => {
                    cy.get('.pf-v5-c-button').click()
                })
            })
        })

        cy.contains('Next').click()
    })

    it('upgrade', () => {
        cy.get('#upgrade-secret').click().get('#my-up-creds').click()

        cy.get('#upgrade-prehooks').within(() => {
            cy.contains('Add job template').click()
            cy.get('#upgrade-prehooks-1').within(() => {
                cy.get('#name').type('pre-up-1')
                cy.get('#extra_vars').within(() => {
                    cy.get('#add-button').click()
                    cy.get('#key-1').type('pre-up-1-var-1')
                    cy.get('#value-1').type('pre-up-1-val-1')
                    cy.get('#add-button').click()
                    cy.get('#key-2').type('pre-up-1-var-2')
                    cy.get('#value-2').type('pre-up-1-val-2')
                })
                cy.get('.pf-v5-c-form__field-group-toggle').within(() => {
                    cy.get('.pf-v5-c-button').click()
                })
            })
            cy.contains('Add job template').click()
            cy.get('#upgrade-prehooks-2').within(() => {
                cy.get('#name').type('pre-up-2')
                cy.get('#extra_vars').within(() => {
                    cy.get('#add-button').click()
                    cy.get('#key-1').type('pre-up-2-var-1')
                    cy.get('#value-1').type('pre-up-2-val-1')
                    cy.get('#add-button').click()
                    cy.get('#key-2').type('pre-up-2-var-2')
                    cy.get('#value-2').type('pre-up-2-val-2')
                })
                cy.get('.pf-v5-c-form__field-group-toggle').within(() => {
                    cy.get('.pf-v5-c-button').click()
                })
            })
        })

        cy.get('#upgrade-posthooks').within(() => {
            cy.contains('Add job template').click()
            cy.get('#upgrade-posthooks-1').within(() => {
                cy.get('#name').type('post-up-1')
                cy.get('#extra_vars').within(() => {
                    cy.get('#add-button').click()
                    cy.get('#key-1').type('post-up-1-var-1')
                    cy.get('#value-1').type('post-up-1-val-1')
                    cy.get('#add-button').click()
                    cy.get('#key-2').type('post-up-1-var-2')
                    cy.get('#value-2').type('post-up-1-val-2')
                })
                cy.get('.pf-v5-c-form__field-group-toggle').within(() => {
                    cy.get('.pf-v5-c-button').click()
                })
            })
            cy.contains('Add job template').click()
            cy.get('#upgrade-posthooks-2').within(() => {
                cy.get('#name').type('post-up-2')
                cy.get('#extra_vars').within(() => {
                    cy.get('#add-button').click()
                    cy.get('#key-1').type('post-up-2-var-1')
                    cy.get('#value-1').type('post-up-2-val-1')
                    cy.get('#add-button').click()
                    cy.get('#key-2').type('post-up-2-var-2')
                    cy.get('#value-2').type('post-up-2-val-2')
                })
                cy.get('.pf-v5-c-form__field-group-toggle').within(() => {
                    cy.get('.pf-v5-c-button').click()
                })
            })
        })

        cy.contains('Next').click()
    })

    it('review', () => {
        cy.get('#review-step').within(() => {
            cy.get('#details').within(() => {
                cy.get('#name').contains('my-template')
                cy.get('#namespace').contains('default')
            })

            cy.get('#install').within(() => {
                cy.get('#install-secret').contains('my-inst-creds')
                cy.get('#install-prehooks').contains('pre-inst-1')
                cy.get('#install-prehooks').contains('pre-inst-2')
                cy.get('#install-posthooks').contains('post-inst-1')
                cy.get('#install-posthooks').contains('post-inst-2')
            })

            cy.get('#upgrade').within(() => {
                cy.get('#upgrade-secret').contains('my-up-creds')
                cy.get('#upgrade-prehooks').contains('pre-up-1')
                cy.get('#upgrade-prehooks').contains('pre-up-2')
                cy.get('#upgrade-posthooks').contains('post-up-1')
                cy.get('#upgrade-posthooks').contains('post-up-2')
            })
        })
        cy.contains('Submit')
    })

    it('results', () => {
        const expected = {
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            kind: 'ClusterCurator',
            metadata: {
                name: 'my-template',
                namespace: 'default',
            },
            spec: {
                install: {
                    towerAuthSecret: 'my-inst-creds',
                    prehook: [
                        {
                            name: 'pre-inst-1',
                            extra_vars: {
                                'pre-inst-1-var-1': 'pre-inst-1-val-1',
                                'pre-inst-1-var-2': 'pre-inst-1-val-2',
                            },
                        },
                        {
                            name: 'pre-inst-2',
                            extra_vars: {
                                'pre-inst-2-var-1': 'pre-inst-2-val-1',
                                'pre-inst-2-var-2': 'pre-inst-2-val-2',
                            },
                        },
                    ],
                    posthook: [
                        {
                            name: 'post-inst-1',
                            extra_vars: {
                                'post-inst-1-var-1': 'post-inst-1-val-1',
                                'post-inst-1-var-2': 'post-inst-1-val-2',
                            },
                        },
                        {
                            name: 'post-inst-2',
                            extra_vars: {
                                'post-inst-2-var-1': 'post-inst-2-val-1',
                                'post-inst-2-var-2': 'post-inst-2-val-2',
                            },
                        },
                    ],
                },
                upgrade: {
                    towerAuthSecret: 'my-up-creds',
                    prehook: [
                        {
                            name: 'pre-up-1',
                            extra_vars: {
                                'pre-up-1-var-1': 'pre-up-1-val-1',
                                'pre-up-1-var-2': 'pre-up-1-val-2',
                            },
                        },
                        {
                            name: 'pre-up-2',
                            extra_vars: {
                                'pre-up-2-var-1': 'pre-up-2-val-1',
                                'pre-up-2-var-2': 'pre-up-2-val-2',
                            },
                        },
                    ],
                    posthook: [
                        {
                            name: 'post-up-1',
                            extra_vars: {
                                'post-up-1-var-1': 'post-up-1-val-1',
                                'post-up-1-var-2': 'post-up-1-val-2',
                            },
                        },
                        {
                            name: 'post-up-2',
                            extra_vars: {
                                'post-up-2-var-1': 'post-up-2-val-1',
                                'post-up-2-var-2': 'post-up-2-val-2',
                            },
                        },
                    ],
                },
            },
        }

        const yaml = YAML.stringify(expected)
        cy.get('#yaml-editor').should('have.text', yaml)
    })
})
