function getRandomInt(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function delayMiddleware() {
    if (process.env.NODE_ENV === 'development') {
        if (process.env.DELAY) {
            await new Promise((resolve) => setTimeout(resolve, Number(process.env.DELAY)))
        }
        if (process.env.RANDOM_DELAY) {
            await new Promise((resolve) => setTimeout(resolve, getRandomInt(0, Number(process.env.RANDOM_DELAY))))
        }
        if (process.env.RANDOM_ERROR) {
            if (getRandomInt(0, 100) < Number(process.env.RANDOM_ERROR)) {
                return res.destroy()
            }
        }
    }
}
