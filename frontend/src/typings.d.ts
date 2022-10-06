/* Copyright Contributors to the Open Cluster Management project */

declare module '@redhat-cloud-services/rule-components/Markdown'
declare module '*.hbs'
declare module '*.png'

type SvgrComponent = React.StatelessComponent<React.SVGAttributes<SVGElement>>

declare module '*.svg' {
    const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
    const content: string

    export { ReactComponent }
    export default content
}

declare module '*.yaml' {
    const content: string
    export = content
}

// for SVG images loaded as url paths
declare module '*.svg?url'

declare module 'merge-jsons-webpack-plugin'
