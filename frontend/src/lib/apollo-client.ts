import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

const httpLink = new HttpLink({
    uri: 'http://localhost:4000/graphql',
    credentials: 'include',
})

// const wsLink = new WebSocketLink({
//     uri: `ws://localhost:4000/graphql`,
//     options: {
//         reconnect: true,
//     },
// })

// // The split function takes three parameters:
// //
// // * A function that's called for each operation to execute
// // * The Link to use for an operation if the function returns a "truthy" value
// // * The Link to use for an operation if the function returns a "falsy" value
// const splitLink = split(
//     ({ query }) => {
//         const definition = getMainDefinition(query)
//         return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
//     },
//     wsLink,
//     httpLink
// )

export const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    credentials: 'include',
})
