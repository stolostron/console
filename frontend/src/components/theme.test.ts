/* Copyright Contributors to the Open Cluster Management project */

import { dismountTheme, mountTheme } from './theme'

describe('theme utilities', () => {
  describe('mountTheme/dismountTheme', () => {
    beforeEach(() => {
      document.body.innerHTML = ''
    })

    afterEach(() => {
      // ensure styles added to <head> do not leak across tests
      Array.from(document.head.querySelectorAll('.monaco-colors')).forEach((el) => el.remove())
    })

    function createStyleEl(attrs?: Partial<HTMLStyleElement>): HTMLStyleElement {
      const el = document.createElement('style') as HTMLStyleElement
      el.className = 'monaco-colors'
      if (attrs) Object.assign(el, attrs)
      document.head.appendChild(el)
      return el
    }

    it('mountTheme activates a target and deactivates others', () => {
      const a = createStyleEl({ media: 'none' })
      const b = createStyleEl({ media: 'none' })
      const c = createStyleEl({ media: 'none' })

      // give b the dataset id so it is preferred
      b.setAttribute('data-acm', 'true')

      mountTheme('acm')

      expect((a as HTMLStyleElement).media).toBe('none')
      expect((b as HTMLStyleElement).media).toBe('screen')
      expect((c as HTMLStyleElement).media).toBe('none')
    })

    it('mountTheme tags last empty-dataset element if none pre-tagged', () => {
      createStyleEl({ media: 'none' })
      createStyleEl({ media: 'none' })
      createStyleEl({ media: 'none' })

      // datasets empty; it should select the last empty one (c) and set media screen
      mountTheme('acm')

      const elements = Array.from(document.querySelectorAll('.monaco-colors')) as HTMLStyleElement[]
      const active = elements.filter((el) => el.media === 'screen')
      expect(active).toHaveLength(1)
      expect((active[0] as any).dataset?.acm).toBe('true')
      elements
        .filter((el) => el !== active[0])
        .forEach((el) => {
          expect(el.media).toBe('none')
        })
    })

    it('dismountTheme hides tagged and shows untagged', () => {
      const a = createStyleEl({ media: 'none' })
      const b = createStyleEl({ media: 'screen' })
      const c = createStyleEl({ media: 'none' })
      b.setAttribute('data-acm', 'true')

      dismountTheme('acm')

      // b is tagged with acm -> hidden
      expect((b as HTMLStyleElement).media).toBe('none')
      // a and c have empty datasets -> shown
      expect((a as HTMLStyleElement).media).toBe('screen')
      expect((c as HTMLStyleElement).media).toBe('screen')
    })
  })
})
