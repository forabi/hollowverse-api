import * as express from 'express';
import * as bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { schema } from './schema/schema';
import { formatError } from './helpers/formatError';
import { redirectToHttps } from './redirectToHttps';
import { health, setIsHealthy } from './health';
import { SchemaContext } from './typings/schemaContext';
import { findUserByFacebookAccessToken } from './helpers/auth';

import { connection } from './database/connection';

// tslint:disable-next-line no-floating-promises
connection.catch(_ => {
  setIsHealthy(false);
});

const api = express();

api.use(redirectToHttps);

api.use('/health', health);

api.use(
  '/graphql',
  bodyParser.json(),
  graphqlExpress(async req => {
    const context: SchemaContext = {};
    if (req) {
      const authorization = req.header('Authorization');
      if (authorization) {
        const [type, token] = authorization.split(' ');
        if (
          type === 'Bearer' &&
          typeof token === 'string' &&
          token.length > 0
        ) {
          context.viewer = await findUserByFacebookAccessToken(token);
        }
      }
    }

    return {
      schema: schema as any,
      formatError,
      context,
    };
  }),
);

const { FB_ACCESS_TOKEN } = process.env;
const debugHeaders = [
  FB_ACCESS_TOKEN ? `'Authorization': 'Bearer ${FB_ACCESS_TOKEN}'` : null,
];

api.use(
  '/graphiql',
  graphiqlExpress({
    endpointURL: '/graphql',
    ...process.env.NODE_ENV === 'production'
      ? undefined
      : {
          passHeader: debugHeaders.filter(Boolean).join('\n'),
        },
  }),
);

api.listen(process.env.PORT || 8080);
