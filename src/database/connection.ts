import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { NotablePerson } from './entities/notablePerson';
import { Event } from './entities/event';

export const connection = createConnection({
  database: 'hollowverse',
  type: 'sqlite',
  synchronize: true,
  entities: [NotablePerson, Event],
  autoSchemaSync: true,
});
