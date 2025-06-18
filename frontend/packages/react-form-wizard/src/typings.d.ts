declare module '*.hbs' {
    const content: string
    export = content
}

declare module '*.yaml' {
    const content: string
    export = content
}

declare module '*.svg' {
    const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
    const content: string

    export { ReactComponent }
    export = content
}
