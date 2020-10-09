import { ApolloClient, from, HttpLink, InMemoryCache, ServerError } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { RetryLink } from '@apollo/client/link/retry'

const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (networkError) {
        if (networkError?.name === 'ServerError') {
            const serverError = networkError as ServerError
            switch (serverError.statusCode) {
                case 401:
                    window.location.href = `${process.env.REACT_APP_BACKEND}/login`
                    break
            }
        }
    }
})

const link = from([
    new RetryLink(),
    errorLink,
    new HttpLink({
        uri: `${process.env.REACT_APP_BACKEND}/graphql`,
        credentials: 'include',
    }),
])

export const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
})
