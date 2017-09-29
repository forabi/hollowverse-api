import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { IsUrl } from 'class-validator';
import { Trim } from 'class-sanitizer';
import { BaseEntity } from './base';
import { Event } from './event';
import { Label } from './label';

/**
 * A public figure or an influential person
 */
@Entity()
export class NotablePerson extends BaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Trim()
  @Column({ unique: true, nullable: false })
  slug: string;

  @Trim()
  @Column({ type: 'varchar', nullable: false })
  name: string;

  @IsUrl({
    require_protocol: true,
    require_valid_protocol: true,
    protocols: ['https'],
  })
  @Trim()
  @Column({ type: 'text', nullable: false })
  photoUrl: string;

  @OneToMany(_ => Event, event => event.notablePerson, {
    cascadeInsert: true,
    cascadeUpdate: true,
  })
  events: Event[];

  @ManyToMany(_ => Label, label => label.notablePerson, {
    cascadeInsert: true,
    cascadeUpdate: true,
  })
  @JoinTable()
  labels: Label[];
}
