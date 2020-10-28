import randomstring from 'randomstring';
import {
  CleanBody,
  CountResponse,
  DeleteResponse,
  LoopbackFilter,
  RequestsObject,
} from './LoopbackRequestCreator';

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
        let query;

        query = db[collectionName].find();

        if (filter?.where) {
          query.where(filter.where);
        }

        if (filter?.order) {
          const split = filter.order.split(' ');
          query.sort({ [split[0]]: split[1] });
        }

        if (filter?.limit !== undefined) {
          query.limit(filter.limit);
        }

        if (filter?.skip !== undefined) {
          query.skip(filter.skip);
        }

        return query.exec();
      })
        .then((data: any[]) => {
          return resolve(data.map((d) => d.toJSON()));
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
      };

      db.then((db: any) => db[collectionName].insert(bodyWithId))
        .then((data: any) => resolve(data.toJSON()))
        .catch(reject);
    }),

  // update record by id
  update: (id: string | number, body: Partial<T>) =>
    new Promise<T>((resolve, reject) => {
      db.then((db: any) => db[collectionName].findOne().where({ id }).exec())
        .then((record) => record.update({ $set: body }))
        .then((data: any) => resolve(data))
        .catch(reject);
    }),
});
