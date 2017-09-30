import { nodeDefinitions, fromGlobalId } from 'graphql-relay';

import { connection } from '../../../database/connection';
import { NotablePerson } from '../../../database/entities/notablePerson';
import { NotablePersonEvent } from '../../../database/entities/event';

const entitiesByTypeName: Record<string, any> = {
  NotablePerson,
  NotablePersonEvent,
};

export async function fetchNodeByGlobalId(globalId: string) {
  const db = await connection;
  const { type, id } = fromGlobalId(globalId);
  const entity = entitiesByTypeName[type];
  const repository = db.getRepository(entity);
  if (entity) {
    return repository.findOneById(id);
  }

  return null;
}

export async function getNodeTypeByValue(value: any) {
  const result = fromGlobalId(value.id);

  if (result) {
    return result.type;
  }

  throw new TypeError('Invalid type');
}

const { nodeField, nodeInterface } = nodeDefinitions(
  fetchNodeByGlobalId,
  getNodeTypeByValue,
);

export { nodeField, nodeInterface };
