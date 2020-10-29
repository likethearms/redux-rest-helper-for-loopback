import debug from 'debug';
import randomstring from 'randomstring';
import {
  CleanBody,
  CountResponse,
  DeleteResponse,
  LoopbackFilter,
  RequestsObject,
} from './LoopbackRequestCreator';

const log = debug('reduxRestHelper:rxdb');

const defaultCleanBody = (data: any) => {
  return data;
};

export const RxDBCleanBody = defaultCleanBody;

export const RxDBRequestCreator = <T extends {}, DB>(
  db: Promise<DB>,
  collectionName: string,
  cleanBody: CleanBody<T> = defaultCleanBody
): RequestsObject<T> => ({
  // Get all records
  getAll: (filter?: LoopbackFilter) => {
    return new Promise<T[]>((resolve, reject) => {
      db.then((db: any) => {
        log('LoopbackFilter', filter);
        let query = db[collectionName].find();

        if (filter?.where) {
          log('LoopbackFilter.where accepted', filter?.where);
          query = query.where(filter.where);
        }

        if (filter?.order) {
          const split = filter.order.split(' ');
          log('LoopbackFilter.order & split accepted', filter?.order, split);
          query = query.sort({ [split[0]]: split[1] });
        }

        if (filter?.limit !== undefined) {
          log('LoopbackFilter.limit accepted', filter?.limit);
          query = query.limit(filter.limit);
        }

        if (filter?.skip !== undefined) {
          log('LoopbackFilter.skip accepted', filter?.skip);
          query = query.skip(filter.skip);
        }

        return query.exec();
      })
        .then((data: any[]) => {
          const json = data.map((d) => d.toJSON());
          log('Result', data);
          log('Result JSON', json);
          return resolve(json);
        })
        .catch(reject);
    });
  },

  // Count
  count: (filter?: LoopbackFilter) => {
    return new Promise<CountResponse>((resolve, reject) => {
      db.then((db: any) => {
        let query;

        query = db[collectionName].find();

        if (filter?.where) {
          query.where(filter.where);
        }

        return query.exec();
      })
        .then((data: T[]) => {
          return resolve({ count: data.length });
        })
        .catch(reject);
    });
  },

  // Get record by id
  getById: (id: string | number, filter?: LoopbackFilter) => {
    return new Promise<T>((resolve, reject) => {
      db.then((db: any) => db[collectionName].findOne().where({ id }).exec())
        .then((data: any) => {
          if (!data) return reject(new Error('RX: Cannot find record'));
          return resolve(data.toJSON());
        })
        .catch(reject);
    });
  },

  // Delete record
  delete: (id: string | number) =>
    new Promise<DeleteResponse>((resolve, reject) => {
      db.then((db: any) => db[collectionName].findOne().where({ id }).exec())
        .then((record) => record.remove())
        .then(() => resolve({ id }))
        .catch(reject);
    }),

  // create record by id
  create: (body: T) =>
    new Promise<T>((resolve, reject) => {
      const bodyWithId = {
        ...body,
        id: randomstring.generate(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.then((db: any) => db[collectionName].insert(bodyWithId))
        .then((data: any) => resolve(data.toJSON()))
        .catch(reject);
    }),

  // update record by id
  update: (id: string | number, body: Partial<T>) =>
    new Promise<T>((resolve, reject) => {
      const updateBody: any = {
        ...body,
        updatedAt: new Date().toISOString(),
      };

      delete updateBody.createdAt;

      db.then((db: any) => db[collectionName].findOne().where({ id }).exec())
        .then((record) => record.update({ $set: body }))
        .then((data: any) => resolve(data))
        .catch(reject);
    }),
});
