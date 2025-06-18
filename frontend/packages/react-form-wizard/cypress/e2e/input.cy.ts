/// <reference types="cypress" />

describe('inputs wizard', () => {
    it('displays', () => {
        cy.visit('http://localhost:3000/?route=inputs')
        cy.get('#nav-toggle').click()
        cy.get('#yaml-switch').click({ force: true })
        cy.get('h1').contains('Inputs')
    })

    it('text input', () => {
        cy.contains('Next').click()
        cy.contains('Please fix validation errors')
        cy.get('section #text-input').within(() => {
            cy.contains('Required')
            cy.get('#text-input').within(() => {
                cy.get('#textinput-text').type('text-input')
                cy.get('#textinput-required').type('text-input-required')
                cy.get('#textinput-secret').type('text-input-secret')
            })
        })
        cy.contains('Next').click()
    })

    it('text area', () => {
        cy.contains('Next').click()
        cy.contains('Please fix validation errors')
        cy.get('section #text-area').within(() => {
            cy.contains('Required')
            cy.get('#text-area').within(() => {
                cy.get('#textarea-text').type('text-area')
                cy.get('#textarea-required').type('text-area-required')
                cy.get('#textarea-secret').type('text-area-secret')
            })
        })
        cy.contains('Next').click()
    })

    it('select', () => {
        cy.contains('Next').click()
        cy.contains('Please fix validation errors')
        cy.get('section #select').within(() => {
            cy.contains('Required')
            cy.get('#select').within(() => {
                cy.get('#select-value').click().get(`#Option\\ 1`).click()
                cy.get('#select-required').click().get(`#Option\\ 2`).click()
            })
        })
        cy.contains('Next').click()
    })

    it('tiles', () => {
        cy.get('#tiles').within(() => {})
        cy.contains('Next').click()
    })

    it('radio', () => {
        cy.contains('Next').click()
        cy.contains('Please fix validation errors')
        cy.get('section #radio-step').within(() => {
            cy.get('#group-5').within(() => {
                cy.get('label:contains("Radio 1")').click()
            })
        })
        cy.contains('Next').click()
    })

    it('switch', () => {
        cy.get('section #switch-step').within(() => {
            cy.get('#switch-3').parent().click()
        })
        cy.contains('Next').click()
    })

    it('checkbox', () => {
        cy.get('section #checkbox-step').within(() => {
            cy.get('#checkbox-1').click()
            cy.get('#checkbox-2').click()
            cy.get('#checkbox-3').click()
            cy.get('#checkbox-4').click()
        })
        cy.contains('Next').click()
        cy.contains('Please fix validation errors')
        cy.get('section #checkbox-step').within(() => {
            cy.get('#checkbox-2-text').type('hello')
            cy.get('#checkbox-4').click()
        })
        cy.contains('Next').click()
    })

    it('key-value', () => {
        cy.get('#key-value').within(() => {})
        cy.contains('Next').click()
    })

    it('strings-input', () => {
        cy.get('#strings-input').within(() => {})
        cy.contains('Next').click()
    })

    it('array-input', () => {
        cy.get('#array-input').within(() => {})
        cy.contains('Next').click()
    })

    it('table-select', () => {
        cy.get('#table-select').within(() => {})
        cy.contains('Next').click()
    })

    it('section', () => {
        cy.contains('Next').click()
        cy.contains('Please fix validation errors')
        cy.get('section #section-step').within(() => {
            cy.contains('Required')
            cy.get('#text-1').type('text-1')
            cy.get('#text-3').type('text-3')
            cy.get('#hide-section').click()
        })
        cy.contains('Next').click()
    })

    it('hidden', () => {
        cy.get('div #hidden-step').within(() => {
            cy.get('#show-hidden').click()
        })
        cy.contains('Next').click()
        cy.contains('Please fix validation errors')
        cy.get('div #hidden-step').within(() => {
            cy.get('#show-hidden').click()
        })
        cy.contains('Next').click()
    })

    it('review', () => {
        cy.get('#review-step').within(() => {
            cy.get('#text-input').within(() => {
                cy.get('#textinput-text').contains('text-input')
                cy.get('#textinput-required').contains('text-input-required')
                cy.get('#textinput-secret').contains('****************')
                cy.get('#textinput-secret button').click()
                cy.get('#textinput-secret').contains('text-input-secret')
            })
            cy.get('#text-area').within(() => {
                cy.get('#textarea-text').contains('text-area')
                cy.get('#textarea-required').contains('text-area-required')
                cy.get('#textarea-secret').contains('****************')
                cy.get('#textarea-secret button').click()
                cy.get('#textarea-secret').contains('text-area-secret')
            })
            cy.get('#switch-step').within(() => {
                cy.get('#switch-1').should('not.exist')
                cy.get('#switch-2').should('not.exist')
                cy.get('#switch-3 > svg')
            })
            cy.get('#select').within(() => {
                cy.get('#select-value').contains('Option 1')
                cy.get('#select-required').contains('Option 2')
            })
            cy.get('#radio').within(() => {
                cy.get('#group-5').within(() => {
                    cy.get('#radio-1').contains('Radio 1')
                })
            })
            cy.get('#checkbox').within(() => {
                cy.get('#checkbox-1')
                cy.get('#checkbox-2')
                cy.get('#checkbox-2-text').contains('hello')
                cy.get('#checkbox-3')
            })
        })
        cy.contains('Submit')
    })
})
