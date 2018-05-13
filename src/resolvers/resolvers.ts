import { merge } from 'lodash';

import { GraphQLDate, GraphQLDateTime } from 'graphql-iso-date';
import { Email } from './scalars/email';
import { Url } from './scalars/url';
import { HexColor } from './scalars/hexColor';

import { resolvers as resultResolvers } from './unions/result';

import { resolvers as notablePersonResolvers } from './queries/notablePerson';
import { resolvers as notablePeopleResolvers } from './queries/notablePeople';
import { resolvers as createNotablePersonResolvers } from './mutations/createNotablePerson';
import { resolvers as createUserResolvers } from './mutations/createUser';
import { resolvers as submitNotablePersonEventResolvers } from './mutations/submitNotablePersonEvent';
import { resolvers as userResolvers } from './types/user';
import { resolvers as viewerResolvers } from './types/viewer';
import { resolvers as photoResolvers } from './types/photo';

import { resolvers as requireAuthResolvers } from './directives/requireAuth';
import { resolvers as requireOneOfRolesResolvers } from './directives/requireOneOfRoles';

/**
 * Resolvers for custom scalar types.
 * They define how to parse, validate and serialize these types.
 */
const scalarTypes = {
  DateTime: GraphQLDateTime,
  DateOnly: GraphQLDate,
  Email,
  Url,
  HexColor,
};

const unionTypes = {
  ...resultResolvers,
};

export const resolvers = merge(
  createUserResolvers,
  createNotablePersonResolvers,
  submitNotablePersonEventResolvers,
  viewerResolvers,
  notablePersonResolvers,
  notablePeopleResolvers,
  userResolvers,
  viewerResolvers,
  photoResolvers,
  scalarTypes,
  unionTypes,
);

export const directiveResolvers = {
  ...requireAuthResolvers,
  ...requireOneOfRolesResolvers,
};
