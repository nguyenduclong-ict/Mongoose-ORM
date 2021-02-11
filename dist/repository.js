"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = exports.getRepository = exports.resgisterRepository = exports.Hook = exports.Action = void 0;
const async_validator_1 = __importDefault(require("async-validator"));
const lodash_1 = __importDefault(require("lodash"));
const mongoose_1 = require("mongoose");
require("reflect-metadata");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
/**************** DECORATOR ****************/
function Action(target, key, descriptor) {
    const caches = new Map();
    const originalMethod = descriptor.value;
    descriptor.value = async function (context = {}, ...args) {
        let result;
        let cache, beforeHooks, afterHooks;
        const hooks = Reflect.getOwnMetadata(constants_1.KEYS.REPOSITORY_HOOKS, target);
        const listParents = utils_1.getParentClasses(this.constructor);
        if (!(cache = caches.get(this))) {
            cache = {
                before: {},
                after: {},
            };
            caches.set(this, cache);
        }
        if (!cache.before[key]) {
            beforeHooks = cache.before[key] = [];
            listParents.reverse().forEach((name) => {
                const h = hooks[name];
                if (h?.before["*"])
                    beforeHooks.push(...h.before["*"]);
                if (h?.before[key])
                    beforeHooks.push(...h.before[key]);
            });
        }
        else {
            beforeHooks = cache.before[key];
        }
        if (!cache.after[key]) {
            afterHooks = cache.after[key] = [];
            listParents.reverse().forEach((name) => {
                const h = hooks[name];
                if (h?.after["*"])
                    afterHooks.push(...h.after["*"]);
                if (h?.after[key])
                    afterHooks.push(...h.after[key]);
            });
        }
        else {
            afterHooks = cache.after[key];
        }
        // Call before hooks
        for (const methodName of beforeHooks) {
            this[methodName].call(this, context);
        }
        // Call origin action
        result = await originalMethod.call(this, context, ...args);
        // Call before hooks
        for (const methodName of afterHooks) {
            result = await this[methodName].call(this, context, result);
        }
        return result;
    };
}
exports.Action = Action;
function Hook(trigger, actions) {
    return function (target, key) {
        let hooks;
        if (!(hooks = Reflect.getMetadata(constants_1.KEYS.REPOSITORY_HOOKS, target))) {
            hooks = {};
            Reflect.defineMetadata(constants_1.KEYS.REPOSITORY_HOOKS, hooks, target);
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
exports.Hook = Hook;
/**************** CLASS ****************/
const repos = new Map();
function resgisterRepository(repository, connection) {
    connection = connection || repository.connection;
    let map;
    if (!(map = repos.get(connection))) {
        map = {};
        repos.set(connection, map);
    }
    map[repository.name] = repository;
}
exports.resgisterRepository = resgisterRepository;
function getRepository(connection, name) {
    return repos.get(connection)?.[name];
}
exports.getRepository = getRepository;
class Repository {
    constructor(connection) {
        this.connection = connection || this.connection;
        if (!this.name) {
            this.name = this.constructor.name.replace(/Repository$/, "");
        }
        this.model =
            this.connection.models[this.name] ||
                this.connection.model(this.name, this.schema);
        resgisterRepository(this);
    }
    makeDefaultContext(ctx) {
        ctx = ctx || {};
        ctx.meta = ctx.meta ?? {};
        ctx.query = ctx.query ?? {};
        ctx.limit = ctx.limit ?? ctx.pageSize ?? 10;
        ctx.skip = ctx.skip ?? ctx.page ? (ctx.page - 1) * ctx.limit : 0;
        ctx.new = ctx.new ?? true;
        ctx.softDelete = ctx.softDelete ?? true;
    }
    // *** Default Action ***
    async list(ctx) {
        this.buildQuery(ctx);
        const queryBuilder = this.model.find(ctx.query, ctx.projection, lodash_1.default.pick(ctx, ["skip", "limit", "sort", "session"]));
        if (ctx.populates) {
            this.populate(queryBuilder, ctx.populates);
        }
        const [data, counts] = await Promise.all([
            queryBuilder.exec(),
            this.model.countDocuments(ctx.query),
        ]);
        return {
            data: data,
            page: ctx.page,
            totalPages: Math.ceil(counts / (ctx.limit || 10)),
            pageSize: ctx.pageSize,
            total: counts,
        };
    }
    async find(ctx) {
        this.buildQuery(ctx);
        const queryBuilder = this.model.find(ctx.query, ctx.projection, lodash_1.default.pick(ctx, ["skip", "limit", "sort", "session"]));
        if (ctx.populates) {
            this.populate(queryBuilder, ctx.populates);
        }
        return queryBuilder.exec();
    }
    findOne(ctx) {
        this.buildQuery(ctx);
        const queryBuilder = this.model.findOne(ctx.query, ctx.projection, lodash_1.default.pick(ctx, ["skip", "limit", "sort", "session"]));
        if (ctx.populates) {
            this.populate(queryBuilder, ctx.populates);
        }
        return queryBuilder.exec();
    }
    async create(ctx) {
        await this.cascadeCreate(ctx);
        return this.model.create(ctx.data).then((doc) => {
            if (ctx.populates?.length) {
                return this.populate(this.model.findById(doc.id), ctx.populates).exec();
            }
            return doc[0];
        });
    }
    async createMany(ctx) {
        let options = lodash_1.default.pick(ctx, "session");
        const cascadeTasks = [];
        ctx.data?.forEach((item, index) => {
            cascadeTasks.push(this.cascadeCreate({ ...ctx, data: item }));
        });
        await Promise.all(cascadeTasks);
        return this.model.create(ctx.data, options);
    }
    async update(ctx) {
        this.buildQuery(ctx);
        await this.cascadeUpdate(ctx);
        if (ctx.new) {
            return this.model.find(ctx.query, "id").then((docs) => this.model.updateMany(ctx.query, ctx.data).then(() => this.find({
                ...ctx,
                limit: Number.MAX_SAFE_INTEGER,
                query: {
                    id: docs.map(utils_1.getObjectId),
                },
            })));
        }
        else {
            return this.model.updateMany(ctx.query, ctx.data, lodash_1.default.pick(ctx, "session"));
        }
    }
    async updateOne(ctx) {
        this.buildQuery(ctx);
        await this.cascadeUpdate(ctx);
        return this.populate(this.model.findOneAndUpdate(ctx.query, ctx.data, lodash_1.default.pick(ctx, ["projecton", "session", "new"])), ctx.populates);
    }
    async delete(ctx) {
        ctx.softDelete = false;
        this.buildQuery(ctx);
        const entites = await this.model.find(ctx.query);
        const result = await this.model.deleteMany(ctx.query, lodash_1.default.pick(ctx, "session"));
        try {
            await Promise.all(entites.map((entity) => this.cascadeDelete(entity, ctx)));
        }
        catch (error) {
            console.log(this.name, "cascade delete error", error);
        }
        return result;
    }
    softDelete(ctx) {
        const update = {
            $currentDate: {},
        };
        this.model.schema.eachPath((path, type) => {
            if (type.options.columnType === "deleteDate") {
                update.$currentDate[path] = true;
            }
        });
        return this.update({ ...ctx, data: update });
    }
    restoreSoftDelete(ctx) {
        const update = {};
        this.model.schema.eachPath((path, type) => {
            if (type.options.columnType === "deleteDate") {
                update[path] = null;
            }
        });
        return this.update({ ...ctx, data: update });
    }
    // *** Utils ***
    buildQuery(ctx) {
        const query = ctx.query;
        // transform id => _id
        if (query.id) {
            query._id = query.id;
            delete query.id;
        }
        // Exclude all document softDeleted
        if (ctx.softDelete) {
            const deletePaths = [];
            const deletedQuery = {};
            this.model.schema.eachPath((path, type) => {
                if (type.options.columnType === "deleteDate") {
                    deletePaths.push(path);
                    deletedQuery[path] = null;
                }
            });
            if (deletePaths.length > 0) {
                const originQuery = { ...query };
                Object.keys(query).forEach((key) => delete query[key]);
                query.$and = [originQuery, deletedQuery];
            }
        }
    }
    populate(query, populates = []) {
        populates.forEach((populateItem) => {
            query.populate(populateItem);
        });
        return query;
    }
    async getReferenceModel(options, data) {
        if (options.ref)
            return options.ref;
        if (options.refPath) {
            let refPath = lodash_1.default.get(data, options.refPath);
            if (!refPath && utils_1.getObjectId(data))
                refPath = lodash_1.default.get(await this.model.findById(utils_1.getObjectId(data)), options.refPath);
        }
    }
    async cascadeCreate(ctx) {
        const data = ctx.data;
        const cascadeTasks = [];
        const handleCascade = (path, options, fieldValue) => {
            if (mongoose_1.isValidObjectId(fieldValue))
                return; // ignore if fieldValue is ObjectId
            // update sub document
            cascadeTasks.push(async () => {
                const modelName = await this.getReferenceModel(options, data);
                if (modelName) {
                    const doc = await getRepository(this.connection, modelName)?.create({
                        ...ctx,
                        data: fieldValue,
                    });
                    lodash_1.default.set(data, path, utils_1.getObjectId(doc));
                }
            });
        };
        this.schema.eachPath((path, type) => {
            let fieldValue;
            if (type.instance === "ObjectID" && (fieldValue = lodash_1.default.get(data, path))) {
                if (type.options?.cascade === true ||
                    type.options?.cascade?.create === true) {
                    handleCascade(path, type.options, fieldValue);
                }
                else {
                    lodash_1.default.set(data, path, utils_1.getObjectId(fieldValue));
                }
                return;
            }
            // Array refs
            else if (type.instance === "Array" &&
                type.caster.instance === "ObjectID" &&
                Array.isArray((fieldValue = lodash_1.default.get(data, path)))) {
                const options = { ...type.options, ...type.caster.options };
                if (options.cascade === true || options.cascade?.create === true) {
                    fieldValue.forEach((item, index) => handleCascade(path + "." + index, options, item));
                }
                else {
                    fieldValue.forEach((item, index) => lodash_1.default.set(data, path + "." + index, utils_1.getObjectId(item)));
                }
            }
        });
        await Promise.all(cascadeTasks.map((t) => t()));
        return data;
    }
    async cascadeUpdate(ctx) {
        const data = ctx.data;
        const cascadeTasks = [];
        const handleCascade = (path, options, fieldValue) => {
            if (mongoose_1.isValidObjectId(fieldValue))
                return; // ignore if fieldValue is ObjectId
            const objectId = utils_1.getObjectId(fieldValue);
            // update sub document
            cascadeTasks.push(async () => {
                const modelName = await this.getReferenceModel(options, data);
                if (modelName) {
                    await getRepository(this.connection, modelName)?.updateOne({
                        ...ctx,
                        new: true,
                        query: { _id: objectId },
                        data: fieldValue,
                    });
                    lodash_1.default.set(data, path, objectId);
                }
            });
        };
        this.schema.eachPath((path, type) => {
            let fieldValue;
            if (type.instance === "ObjectID" && (fieldValue = lodash_1.default.get(data, path))) {
                if (type.options?.cascade === true ||
                    type.options?.cascade?.update === true) {
                    handleCascade(path, type.options, fieldValue);
                }
                else {
                    lodash_1.default.set(data, path, utils_1.getObjectId(fieldValue));
                }
                return;
            }
            // Array refs
            else if (type.instance === "Array" &&
                type.caster.instance === "ObjectID" &&
                Array.isArray((fieldValue = lodash_1.default.get(data, path)))) {
                const options = { ...type.options, ...type.caster.options };
                if (options.cascade === true || options.cascade?.update === true) {
                    fieldValue.forEach((item, index) => handleCascade(path + "." + index, options, item));
                }
                else {
                    fieldValue.forEach((item, index) => lodash_1.default.set(data, path + "." + index, utils_1.getObjectId(item)));
                }
            }
        });
        await Promise.all(cascadeTasks.map((t) => t()));
        return data;
    }
    async cascadeDelete(entity, ctx) {
        const data = entity;
        const cascadeTasks = [];
        const handleCascade = (options, fieldValue) => {
            if (utils_1.getObjectId(fieldValue)) {
                // update sub document
                cascadeTasks.push(async () => {
                    const modelName = await this.getReferenceModel(options, data);
                    if (modelName) {
                        await getRepository(this.connection, modelName)?.delete({
                            query: { _id: fieldValue },
                            ...lodash_1.default.pick(ctx, "meta", "session"),
                        });
                    }
                });
            }
        };
        this.schema.eachPath((path, type) => {
            let fieldValue;
            if (type.instance === "ObjectID" && (fieldValue = lodash_1.default.get(data, path))) {
                if (type.options.cascade === true ||
                    type.options.cascade?.delete === true) {
                    handleCascade(type.options, fieldValue);
                }
            }
            // Array refs
            else if (type.instance === "Array" &&
                type.caster.instance === "ObjectID" &&
                Array.isArray((fieldValue = lodash_1.default.get(data, path)))) {
                const options = { ...type.options, ...type.caster.options };
                if (options.cascade === true || options.cascade?.delete === true) {
                    fieldValue.forEach((item) => handleCascade(options, item));
                }
            }
        });
        await Promise.all(cascadeTasks.map((t) => t()));
        return data;
    }
    validateEntity(data) {
        const descriptor = lodash_1.default.get(this.model.schema, constants_1.KEYS.SCHEMA_VALIDATOR);
        const validateSchema = new async_validator_1.default(descriptor);
        return new Promise((resolve) => {
            validateSchema.validate(data, {}, (errors, fields) => {
                if (errors) {
                    resolve({ valid: false, errors, fields });
                }
                else {
                    resolve({ valid: true });
                }
            });
        });
    }
}
__decorate([
    Hook("before", ["*"])
], Repository.prototype, "makeDefaultContext", null);
__decorate([
    Action
], Repository.prototype, "list", null);
__decorate([
    Action
], Repository.prototype, "find", null);
__decorate([
    Action
], Repository.prototype, "findOne", null);
__decorate([
    Action
], Repository.prototype, "create", null);
__decorate([
    Action
], Repository.prototype, "createMany", null);
__decorate([
    Action
], Repository.prototype, "update", null);
__decorate([
    Action
], Repository.prototype, "updateOne", null);
__decorate([
    Action
], Repository.prototype, "delete", null);
__decorate([
    Action
], Repository.prototype, "softDelete", null);
__decorate([
    Action
], Repository.prototype, "restoreSoftDelete", null);
exports.Repository = Repository;
