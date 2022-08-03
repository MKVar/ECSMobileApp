import CONFIG from "../../whitelabel_config/config.json";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import { store } from "../redux/store";

// Initialize Apollo Client
const httpLink = createHttpLink({
  uri: CONFIG.api.graphqlUrl,
});
const authLink = setContext((_, { headers }) => {
  const token = store.getState().app.auth?.auth_token;
  return {
    headers: {
      ...headers,
      authorization: token ? `${token}` : "", // SHOULD be using "Bearer xyz" instead of leaving out "Bearer" and pretending it is x-auth-token
    },
  };
});
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
