import { SchemaContext } from '../typings/schemaContext';
import { ApiError } from './apiError';
import { GraphQLResolveInfo } from 'graphql/type';

type GraphQLFieldResolver<TSource, TContext, A = Record<string, any>> = (
  source: TSource,
  args: A,
  context: TContext,
  info: GraphQLResolveInfo,
) => any;

/**
 * Creates a higher-order GraphQL resolver that wraps a GraphQL resolver and checks
 * if the request is authenticated before calling the wrapped resolver.
 * 
 * If the request is not authenticated, an instance of `MustBeAuthorizedError` is thrown.
 */
export function requireAuthentication<S, A>(
  resolver: GraphQLFieldResolver<S, SchemaContext, A>,
) {
  return (
    source: S,
    args: A,
    context: SchemaContext,
    info: GraphQLResolveInfo,
  ) => {
    if (context.viewer) {
      return resolver(source, args, context, info);
    } else {
      throw new ApiError('MustBeAuthorizedError');
    }
  };
}
