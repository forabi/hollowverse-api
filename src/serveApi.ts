import awsServerlessExpress from 'aws-serverless-express';
import { createApiServer } from './server';

const serverPromise = createApiServer().then(expressApp =>
  awsServerlessExpress.createServer(expressApp as any, undefined, ['*/*']),
);

export const serveApi: AWSLambda.Handler = async (event, context) => {
  const server = await serverPromise;

  return awsServerlessExpress.proxy(server, event, context, 'PROMISE');
};
