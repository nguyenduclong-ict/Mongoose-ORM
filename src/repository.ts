import ValidateSchema, { Rules } from "async-validator";
import _ from "lodash";
import {
  Connection,
  Document,
  FilterQuery,
  isValidObjectId,
  Model,
  Schema,
  UpdateQuery,
} from "mongoose";
import "reflect-metadata";
import { KEYS } from "./constants";
import { LiteralUnion } from "./types";
import { getObjectId, getParentClasses } from "./utils";

/**************** TYPES ****************/
export type RespositoryBaseActions =
  | "list"
  | "find"
  | "findOne"
  | "create"
  | "createMany"
  | "update"
  | "updateOne"
  | "delete"
  | "softDelete"
  | "restoreSoftDelete";

export type PopulateItem<E = any> =
  | LiteralUnion<keyof E>
  | {
      path: LiteralUnion<keyof E>;
      select?: string;
      model?: string;
      populate?: PopulateItem<E>;
    };

export interface Context<E, M = any> {
  query?: FilterQuery<E & { id: any; _id: any }>;
  populates?: PopulateItem<E>[];
  skip?: number;
  limit?: number;
  page?: number;
  pageSize?: number;
  sort?: string[];
  new?: boolean;
  projection?: any;
  session?: any;
  select?: any;
  meta?: M;
  softDelete?: boolean; // build query for softDelete
}

export interface ContextCreate<E = any, M = any> extends Context<E, M> {
  data?: E;
}

export interface ContextCreateMany<E = any, M = any> extends Context<E, M> {
  data?: E[];
}

export interface ContextUpdate<E = any, M = any> extends Context<E, M> {
  data?: UpdateQuery<E>;
}

/**************** DECORATOR ****************/
export function Action(target: any, key: string, descriptor: any) {
  const caches = new Map();
  const originalMethod = descriptor.value;
  descriptor.value = async function (context: any = {}, ...args: any[]) {
    let result;
    let cache: any, beforeHooks: string[], afterHooks: string[];
    const hooks = Reflect.getOwnMetadata(KEYS.REPOSITORY_HOOKS, target);
    const listParents = getParentClasses(this.constructor);
    if (!(cache = caches.get(this))) {
      cache = {
        before: {},
        after: {},
      };
      caches.set(this, cache);
    }
    if (!cache.before[key]) {
      beforeHooks = cache.before[key] = [];
      listParents.reverse().forEach((name: string) => {
        const h = hooks[name];
        if (h?.before["*"]) beforeHooks.push(...h.before["*"]);
        if (h?.before[key]) beforeHooks.push(...h.before[key]);
      });
    } else {
      beforeHooks = cache.before[key];
    }
    if (!cache.after[key]) {
      afterHooks = cache.after[key] = [];
      listParents.reverse().forEach((name: string) => {
        const h = hooks[name];
        if (h?.after["*"]) afterHooks.push(...h.after["*"]);
        if (h?.after[key]) afterHooks.push(...h.after[key]);
      });
    } else {
      afterHooks = cache.after[key];
    }
    // Call before hooks
    for (let method of beforeHooks) {
      method = typeof method === "string" ? this[method] : method;
      await (method as any).call(this, context);
    }
    // Call origin action
    result = await originalMethod.call(this, context, ...args);
    // Call before hooks
    for (let method of afterHooks) {
      method = typeof method === "string" ? this[method] : method;
      result = await (method as any).call(this, context, result);
    }
    return result;
  };
}

export function Hook(
  trigger: "before" | "after",
  actions: LiteralUnion<RespositoryBaseActions>[]
) {
  return function (target: any, key: any) {
    let hooks: any;
    if (!(hooks = Reflect.getMetadata(KEYS.REPOSITORY_HOOKS, target))) {
      hooks = {};
      Reflect.defineMetadata(KEYS.REPOSITORY_HOOKS, hooks, target);
    }
    actions.forEach((actionName) => {
      hooks[target.constructor.name] = hooks[target.constructor.name] || {
        before: {},
        after: {},
      };
      const h = hooks[target.constructor.name];
      h[trigger][actionName] = h[trigger][actionName] || [];
      h[trigger][actionName].push(key);
    });
  };
}

/**************** CLASS ****************/
const repos = new Map<Connection, { [x: string]: Repository }>();
export function resgisterRepository(
  repository: Repository,
  connection?: Connection
) {
  connection = connection || repository.connection;
  let map;
  if (!(map = repos.get(connection))) {
    map = {};
    repos.set(connection, map);
  }
  map[repository.name] = repository;
}

export function getRepository(connection: Connection, name: string) {
  return repos.get(connection)?.[name];
}

export function getRepositories(connection: Connection) {
  return repos.get(connection);
}

export class Repository<E = any> {
  private static _globalInstance: Repository;
  name: string;
  connection: Connection;
  schema: Schema<Document<E>>;
  model: Model<Document<E>>;

  constructor(connection?: any) {
    this.connection = connection || this.connection;
    if (this.connection) {
      if (!this.name) {
        this.name = this.constructor.name.replace(/Repository$/, "");
      }
      this.model =
        this.connection.models[this.name] ||
        this.connection.model(this.name, this.schema);
      resgisterRepository(this);
    }
  }

  static get globalInstance() {
    if (!this._globalInstance) this._globalInstance = new Repository();
    return this._globalInstance;
  }

  static registerHook(
    trigger: "before" | "after",
    actions: string[],
    handler: (ctx: Context<any, any>) => any
  ) {
    let hooks: any;
    const target = this.globalInstance;
    if (!(hooks = Reflect.getMetadata(KEYS.REPOSITORY_HOOKS, target))) {
      hooks = {};
      Reflect.defineMetadata(KEYS.REPOSITORY_HOOKS, hooks, target);
    }
    actions.forEach((actionName) => {
      hooks[target.constructor.name] = hooks[target.constructor.name] || {
        before: {},
        after: {},
      };
      const h = hooks[target.constructor.name];
      h[trigger][actionName] = h[trigger][actionName] || [];
      h[trigger][actionName].push(handler);
    });
  }

  @Hook("before", ["*"])
  makeDefaultContext(ctx: Context<E>) {
    ctx = ctx || {};
    ctx.meta = ctx.meta ?? {};
    ctx.query = ctx.query ?? {};
    ctx.limit = ctx.limit ?? ctx.pageSize ?? 10;
    ctx.skip = ctx.skip ?? ctx.page ? (ctx.page - 1) * ctx.limit : 0;
    ctx.new = ctx.new ?? true;
    ctx.softDelete = ctx.softDelete ?? true;
  }

  // *** Default Action ***
  @Action
  async list(ctx: Context<E>) {
    this.buildQuery(ctx);
    const queryBuilder = this.model.find(
      ctx.query,
      ctx.projection,
      _.pick(ctx, ["skip", "limit", "sort", "session"])
    );
    if (ctx.populates) {
      this.populate(queryBuilder, ctx.populates);
    }
    const [data, counts] = await Promise.all([
      queryBuilder.exec(),
      this.model.countDocuments(ctx.query as any),
    ]);

    return {
      data: (data as unknown) as E[],
      page: Math.floor(ctx.skip / ctx.limit) + 1,
      totalPages: Math.ceil(counts / (ctx.limit || 10)),
      pageSize: ctx.limit,
      total: counts,
    };
  }

  @Action
  async find(ctx: Context<E>): Promise<E[]> {
    this.buildQuery(ctx);
    const queryBuilder = this.model.find(
      ctx.query,
      ctx.projection,
      _.pick(ctx, ["skip", "limit", "sort", "session"])
    );
    if (ctx.populates) {
      this.populate(queryBuilder, ctx.populates);
    }
    return queryBuilder.exec() as any;
  }

  @Action
  findOne(ctx: Context<E>): Promise<E> {
    this.buildQuery(ctx);
    const queryBuilder = this.model.findOne(
      ctx.query,
      ctx.projection,
      _.pick(ctx, ["skip", "limit", "sort", "session"])
    );
    if (ctx.populates) {
      this.populate(queryBuilder, ctx.populates);
    }
    return queryBuilder.exec() as any;
  }

  @Action
  async create(ctx: ContextCreate<E>): Promise<E> {
    await this.cascadeCreate(ctx);
    return this.model.create(ctx.data as any).then((doc: any) => {
      if (ctx.populates?.length) {
        return this.populate(this.model.findById(doc.id), ctx.populates).exec();
      }
      return doc;
    });
  }

  @Action
  async createMany(ctx: ContextCreateMany<E>): Promise<E[]> {
    let options: any = _.pick(ctx, "session");
    const cascadeTasks: any[] = [];
    ctx.data?.forEach((item, index) => {
      cascadeTasks.push(this.cascadeCreate({ ...ctx, data: item }));
    });
    await Promise.all(cascadeTasks);
    return (this.model.create(ctx.data as any, options) as any).then(
      (docs: E[]) =>
        Promise.all(
          docs.map((doc) => {
            if (ctx.populates?.length) {
              return this.populate(
                this.model.findById(getObjectId(doc)),
                ctx.populates
              ).exec();
            }
            return doc;
          })
        )
    );
  }

  @Action
  async update(ctx: ContextUpdate<E>): Promise<E[]> {
    this.buildQuery(ctx);
    await this.cascadeUpdate(ctx);
    if (ctx.new) {
      return this.model.find(ctx.query as any, "id").then((docs) =>
        this.model.updateMany(ctx.query as any, ctx.data as any).then(() => {
          return this.find({
            ...ctx,
            limit: Number.MAX_SAFE_INTEGER,
            query: {
              id: {
                $in: docs.map(getObjectId),
              },
            } as any,
          });
        })
      ) as any;
    } else {
      return this.model.updateMany(
        ctx.query as any,
        ctx.data as any,
        _.pick(ctx, "session")
      ) as any;
    }
  }

  @Action
  async updateOne(ctx: ContextUpdate<E>): Promise<E> {
    this.buildQuery(ctx);
    await this.cascadeUpdate(ctx);
    return this.populate(
      this.model.findOneAndUpdate(
        ctx.query as any,
        ctx.data as any,
        _.pick(ctx, ["projecton", "session", "new"])
      ),
      ctx.populates
    ).exec();
  }

  @Action
  async delete(ctx: Context<E>): Promise<any> {
    ctx.softDelete = false;
    this.buildQuery(ctx);
    const entites = await this.model.find(ctx.query);
    const result = await this.model.deleteMany(
      ctx.query as any,
      _.pick(ctx, "session")
    );
    try {
      await Promise.all(
        entites.map((entity) => this.cascadeDelete(entity, ctx))
      );
    } catch (error) {
      console.log(this.name, "cascade delete error", error);
    }
    return result;
  }

  @Action
  softDelete(ctx: Context<E>): Promise<any> {
    const update: any = {
      $currentDate: {},
    };
    this.model.schema.eachPath((path, type: any) => {
      if (type.options.columnType === "deleteDate") {
        update.$currentDate[path] = true;
      }
    });
    return this.update({ ...ctx, data: update });
  }

  @Action
  restoreSoftDelete(ctx: Context<E>): Promise<any> {
    const update: any = {};
    this.model.schema.eachPath((path, type: any) => {
      if (type.options.columnType === "deleteDate") {
        update[path] = null;
      }
    });
    return this.update({ ...ctx, data: update });
  }

  // *** Utils ***
  buildQuery(ctx: Context<E>) {
    const query = ctx.query;
    // transform id => _id
    if (query.id) {
      (query as any)._id = query.id;
      delete query.id;
    }
    // Exclude all document softDeleted
    if (ctx.softDelete) {
      const deletePaths: any[] = [];
      const deletedQuery: any = {};
      this.model.schema.eachPath((path, type: any) => {
        if (type.options.columnType === "deleteDate") {
          deletePaths.push(path);
          deletedQuery[path] = null;
        }
      });
      if (deletePaths.length > 0) {
        const originQuery = { ...query };
        Object.keys(query).forEach((key) => delete query[key]);
        query.$and = [originQuery as any, deletedQuery];
      }
    }
  }

  populate(query: any, populates: PopulateItem[] = []) {
    populates.forEach((populateItem) => {
      query.populate(populateItem);
    });
    return query;
  }

  async getReferenceModel(options: any, data: any): Promise<string> {
    if (options.ref) return options.ref;
    if (options.refPath) {
      let refPath = _.get(data, options.refPath);
      if (!refPath && getObjectId(data))
        refPath = _.get(
          await this.model.findById(getObjectId(data)),
          options.refPath
        );
    }
  }

  protected async cascadeCreate(ctx: ContextUpdate) {
    const data = ctx.data;
    const cascadeTasks: any[] = [];
    const handleCascade = (path: string, options: any, fieldValue: any) => {
      if (isValidObjectId(fieldValue)) return; // ignore if fieldValue is ObjectId
      // update sub document
      if (!getObjectId(fieldValue)) {
        cascadeTasks.push(async () => {
          const modelName = await this.getReferenceModel(options, data);
          if (modelName) {
            const doc = await getRepository(this.connection, modelName)?.create(
              {
                ...ctx,
                data: fieldValue,
              }
            );
            _.set(data, path, getObjectId(doc));
          }
        });
      } else {
        const objectId = getObjectId(fieldValue);
        cascadeTasks.push(async () => {
          const modelName = await this.getReferenceModel(options, data);
          if (modelName) {
            await getRepository(this.connection, modelName)?.updateOne({
              ...ctx,
              new: true,
              query: { _id: objectId },
              data: fieldValue,
            });
            _.set(data, path, objectId);
          }
        });
      }
    };

    this.schema.eachPath((path, type: any) => {
      let fieldValue: any;
      if (type.instance === "ObjectID" && (fieldValue = _.get(data, path))) {
        if (
          type.options?.cascade === true ||
          type.options?.cascade?.create === true
        ) {
          handleCascade(path, type.options, fieldValue);
        } else {
          _.set(data, path, getObjectId(fieldValue));
        }
        return;
      }
      // Array refs
      else if (
        type.instance === "Array" &&
        type.caster.instance === "ObjectID" &&
        Array.isArray((fieldValue = _.get(data, path)))
      ) {
        const options = { ...type.options, ...type.caster.options };
        if (options.cascade === true || options.cascade?.create === true) {
          fieldValue.forEach((item, index) =>
            handleCascade(path + "." + index, options, item)
          );
        } else {
          fieldValue.forEach((item, index) =>
            _.set(data, path + "." + index, getObjectId(item))
          );
        }
      }
    });

    await Promise.all(cascadeTasks.map((t) => t()));
    return data;
  }

  protected async cascadeUpdate(ctx: ContextUpdate) {
    const data = ctx.data;
    const cascadeTasks: any[] = [];
    const handleCascade = (path: string, options: any, fieldValue: any) => {
      if (isValidObjectId(fieldValue)) return; // ignore if fieldValue is ObjectId
      const objectId = getObjectId(fieldValue);
      // update sub document
      if (!getObjectId(fieldValue)) {
        cascadeTasks.push(async () => {
          const modelName = await this.getReferenceModel(options, data);
          if (modelName) {
            const doc = await getRepository(this.connection, modelName)?.create(
              {
                ...ctx,
                data: fieldValue,
              }
            );
            _.set(data, path, getObjectId(doc));
          }
        });
      } else {
        const objectId = getObjectId(fieldValue);
        cascadeTasks.push(async () => {
          const modelName = await this.getReferenceModel(options, data);
          if (modelName) {
            await getRepository(this.connection, modelName)?.updateOne({
              ...ctx,
              new: true,
              query: { _id: objectId },
              data: fieldValue,
            });
            _.set(data, path, objectId);
          }
        });
      }
    };

    this.schema.eachPath((path, type: any) => {
      let fieldValue: any;
      if (
        type.instance === "ObjectID" &&
        _.has(data, path) &&
        (fieldValue = _.get(data, path))
      ) {
        if (
          type.options?.cascade === true ||
          type.options?.cascade?.update === true
        ) {
          handleCascade(path, type.options, fieldValue);
        } else {
          _.set(data, path, getObjectId(fieldValue));
        }
        return;
      }
      // Array refs
      else if (
        type.instance === "Array" &&
        type.caster.instance === "ObjectID" &&
        Array.isArray((fieldValue = _.get(data, path)))
      ) {
        const options = { ...type.options, ...type.caster.options };
        if (options.cascade === true || options.cascade?.update === true) {
          fieldValue.forEach((item, index) =>
            handleCascade(path + "." + index, options, item)
          );
        } else {
          fieldValue.forEach((item, index) =>
            _.set(data, path + "." + index, getObjectId(item))
          );
        }
      }
    });

    await Promise.all(cascadeTasks.map((t) => t()));
    return data;
  }

  protected async cascadeDelete(entity: any, ctx: ContextCreate): Promise<any> {
    const data = entity;
    const cascadeTasks: any[] = [];

    const handleCascade = (options: any, fieldValue: any) => {
      if (getObjectId(fieldValue)) {
        // update sub document
        cascadeTasks.push(async () => {
          const modelName = await this.getReferenceModel(options, data);
          if (modelName) {
            await getRepository(this.connection, modelName)?.delete({
              query: { _id: fieldValue },
              ..._.pick(ctx, "meta", "session"),
            });
          }
        });
      }
    };

    this.schema.eachPath((path, type: any) => {
      let fieldValue: any;
      if (type.instance === "ObjectID" && (fieldValue = _.get(data, path))) {
        if (type.options.cascade?.delete === true) {
          handleCascade(type.options, fieldValue);
        }
      }
      // Array refs
      else if (
        type.instance === "Array" &&
        type.caster.instance === "ObjectID" &&
        Array.isArray((fieldValue = _.get(data, path)))
      ) {
        const options = { ...type.options, ...type.caster.options };
        if (options.cascade?.delete === true) {
          fieldValue.forEach((item) => handleCascade(options, item));
        }
      }
    });

    await Promise.all(cascadeTasks.map((t) => t()));
    return data;
  }

  validateEntity(data: Partial<E>, options?: { makeAllOptional?: boolean }) {
    let descriptor: Rules = _.get(this.model.schema, KEYS.SCHEMA_VALIDATOR);
    if (options?.makeAllOptional) {
      descriptor = { ...descriptor };
      Object.values(descriptor).forEach((rule) => {
        if (Array.isArray(rule)) {
          rule.forEach((sr) => {
            sr.required = false;
          });
        } else {
          rule.required = false;
        }
      });
    }
    const validateSchema = new ValidateSchema(descriptor);
    return new Promise<{
      valid: boolean;
      errors?: { message: string; field: string }[];
      fields?: any;
    }>((resolve) => {
      validateSchema.validate(data, {}, (errors, fields) => {
        if (errors) {
          resolve({ valid: false, errors, fields });
        } else {
          resolve({ valid: true });
        }
      });
    });
  }
}
