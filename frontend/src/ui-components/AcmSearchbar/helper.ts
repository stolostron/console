/* Copyright Contributors to the Open Cluster Management project */

export const convertStringToTags = (searchText: string) => {
    if (searchText !== null && searchText !== '') {
        const queryItems = searchText.split(' ')
        const tags = queryItems.map((item) => {
            return {
                id: item,
                name: item,
            }
        })
        return tags
    }
    return []
}
