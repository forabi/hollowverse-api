// tslint:disable:no-implicit-dependencies

import express from 'express';
import getPort from 'get-port';
import { createApiRouter, CreateApiOptions } from '../createApiServer';
import { GraphQLClient } from '@forabi/graphql-request';
import { createConnection, Connection } from 'typeorm';
import { entities } from '../database/entities';
import faker from 'faker';
import { Server } from 'http';
import { Options } from '@forabi/graphql-request/dist/src/types';
import { AuthProvider } from '../authProvider/types';
import { User } from '../database/entities/User';
import bluebird from 'bluebird';
import mysql from 'promise-mysql';

const TEST_DB_HOST = process.env.CI ? 'database' : 'localhost';
const TEST_DB_USERNAME = 'root';
const TEST_DB_PASSWORD = '123456';
const TEST_DB_PORT = 3306;

class FakeAuthProvider implements AuthProvider {
  findUserByToken = async (_token: string): Promise<User | undefined> =>
    undefined;

  getProfileDetailsByToken = async () => ({
    id: faker.internet.userName(),
    name: faker.name.firstName(),
  });

  getPhotoUrlByUserId = async () => faker.internet.url();
}

type CreateTestContextOptions = {
  createApiRouterOptions?: {
    [K in Exclude<keyof CreateApiOptions, 'connection'>]?: CreateApiOptions[K]
  };
  graphqlClientOptions?: Options;
};

const initializeDb = async (
  databaseName: string,
): Promise<[Connection, PromiseLike<void>]> => {
  const createDatabaseConnection = await mysql.createConnection({
    host: TEST_DB_HOST,
    password: TEST_DB_PASSWORD,
    port: TEST_DB_PORT,
    user: TEST_DB_USERNAME,
  });

  await createDatabaseConnection.query(`CREATE DATABASE ${databaseName}`);

  return [
    await createConnection({
      type: 'mysql',
      host: TEST_DB_HOST,
      password: TEST_DB_PASSWORD,
      port: TEST_DB_PORT,
      username: TEST_DB_USERNAME,
      database: databaseName,
      synchronize: true,
      dropSchema: true,
      entities,
    }),
    createDatabaseConnection.end(),
  ];
};

/**
 * Creates a new API server with a new, empty database instance
 * that have all the required tables.
 *
 * A instance of `GraphQLClient` is returned. The client is configured
 * to call the new API endpoint.
 *
 * A fake authentication provider is used to authenticate users.
 * Methods on that provider can be overridden or spied on to
 * test authentication functionality.
 * This `AuthProvider` instance is also included in the return value.
 * Do not replace the `AuthProvider` instance it self as this won't
 * have any effect. Instead, override individual methods on that instance.
 *
 * Make sure to call `teardown` at the end of each test suite. Otherwise,
 * the Node.js process won't exit.
 */
export const createTestContext = async ({
  createApiRouterOptions = {},
  graphqlClientOptions,
}: CreateTestContextOptions = {}) => {
  const {
    authProvider = new FakeAuthProvider(),
    ...restCreateApiRouterOptions
  } = createApiRouterOptions;

  const databaseName = `hvTestDb${faker.random.alphaNumeric(6)}`;

  const [
    serverPort,
    [connection, createDatabaseConnectionEndPromise],
  ] = await Promise.all([getPort(), initializeDb(databaseName)]);

  const app = express();
  const router = createApiRouter({
    connection,
    authProvider,
    ...restCreateApiRouterOptions,
  });

  app.use('/graphql', router);

  let server: Server;

  await bluebird.fromNode(cb => {
    server = app.listen(serverPort, cb);
  });

  // tslint:disable-next-line:no-http-string
  const apiEndpoint = `http://localhost:${serverPort}/graphql`;

  const client = new GraphQLClient(apiEndpoint, graphqlClientOptions);

  const teardown = async () => {
    await Promise.all([
      createDatabaseConnectionEndPromise,
      connection.dropDatabase().then(async () => connection.close()),
      bluebird.fromNode(cb => {
        server.close(cb);
      }),
    ]);
  };

  return { client, authProvider, teardown };
};

type UnPromisify<T> = T extends Promise<infer R> ? R : T;

export type TestContext = Readonly<
  UnPromisify<ReturnType<typeof createTestContext>>
>;
