import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { IsUrl, IsNotEmpty, ValidateIf } from 'class-validator';
import { Trim } from 'class-sanitizer';
import { BaseEntity } from './base';
import { NotablePerson } from './notablePerson';
import { User } from './user';
import { NotablePersonEventComment } from './comment';
import { EventLabel } from './eventLabel';
import * as isUrl from 'validator/lib/isURL';
import { NotablePersonEventType } from '../../typings/schema';

const urlValidationOptions = {
  require_protocol: true,
  require_host: true,
  require_valid_protocol: true,
  protocols: ['https', 'http'],
};

const eventTypes: Record<NotablePersonEventType, string> = {
  quote: '',
  donation: '',
  appearance: '',
};

export type EventType = keyof typeof eventTypes;

/**
 * An event about a notable person
 */
@Entity()
export class NotablePersonEvent extends BaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ValidateIf((_, v) => typeof v === 'string')
  @IsNotEmpty()
  @Column({ type: 'text', nullable: true })
  quote: string | null;

  @Column({ nullable: true, type: 'tinyint' })
  isQuoteByNotablePerson: boolean | null;

  @Column({
    nullable: false,
    type: 'enum',
    default: null,
    enum: Object.keys(eventTypes),
  })
  type: EventType;

  @IsUrl(urlValidationOptions)
  @Trim()
  @Column({ type: 'text', nullable: false })
  sourceUrl: string | null;

  @Column({ type: 'text', nullable: true })
  entityUrl: string | null;

  /** An entity is a place, organization a political event... etc. */
  @Column({ type: 'text', nullable: true })
  entityName: string | null;

  @Column({ type: 'datetime', nullable: false })
  postedAt: Date;

  @Column({ type: 'date', nullable: true })
  happenedOn: Date | null;

  @ManyToOne(_ => NotablePerson, notablePerson => notablePerson.events, {
    nullable: false,
  })
  notablePerson: NotablePerson;

  @ManyToOne(_ => User, user => user.events, {
    nullable: false,
  })
  owner: User;

  @OneToMany(_ => NotablePersonEventComment, comment => comment.event, {
    cascadeInsert: true,
    cascadeUpdate: true,
  })
  comments: NotablePersonEventComment[];

  @ManyToMany(_ => EventLabel, {
    cascadeInsert: true,
    cascadeUpdate: true,
  })
  @JoinTable()
  labels: EventLabel[];

  async validate() {
    if (typeof this.entityUrl === 'string') {
      if (!isUrl(this.entityUrl, urlValidationOptions)) {
        throw new TypeError('entityUrl must be a valid URL or null');
      }

      if (typeof this.entityName !== 'string') {
        throw new TypeError(
          '`entityName` must be a string if `entityUrl` is specified',
        );
      } else {
        this.entityName = this.entityName.trim();
      }
    }

    if (this.type === 'quote' && !this.quote) {
      throw new TypeError(
        'Events of type `quote` must have a valid `quote` field',
      );
    }

    if (typeof this.quote === 'string') {
      this.quote = this.quote.trim();
    } else if (typeof this.isQuoteByNotablePerson === 'boolean') {
      throw new TypeError(
        '`isQuoteByNotablePerson` should not be defined if `quote` is not specified',
      );
    }

    return super.validate();
  }
}
