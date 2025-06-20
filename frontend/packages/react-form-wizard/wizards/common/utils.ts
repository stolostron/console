import { RouteE } from '../Routes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function onSubmit(_data: unknown) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // alert(JSON.stringify(data, null, 2))
    return Promise.reject(new Error('No backend connected'))
}

export function onCancel(history: { push: (location: string) => void }) {
    history.push(`./${RouteE.Wizards}`)
}
