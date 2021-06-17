"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = exports.getRepositories = exports.getRepository = exports.resgisterRepository = exports.Hook = exports.Action = void 0;
/// <reference path="declaration.ts" />
var async_validator_1 = __importDefault(require("async-validator"));
var lodash_1 = __importDefault(require("lodash"));
var mongoose_1 = require("mongoose");
require("reflect-metadata");
var utils_1 = require("./utils");
function Action(target, key, descriptor) {
    var caches = new Map();
    var originalMethod = descriptor.value;
    descriptor.value = function (context) {
        if (context === void 0) { context = {}; }
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var result, cache, beforeHooks, afterHooks, hooks, listParents, _a, beforeHooks_1, method, _b, afterHooks_1, method;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        hooks = Reflect.getOwnMetadata(utils_1.KEYS.REPOSITORY_HOOKS, target);
                        listParents = utils_1.getParentClasses(this.constructor);
                        if (!(cache = caches.get(this))) {
                            cache = {
                                before: {},
                                after: {},
                            };
                            caches.set(this, cache);
                        }
                        if (!cache.before[key]) {
                            beforeHooks = cache.before[key] = [];
                            listParents.reverse().forEach(function (name) {
                                var h = hooks[name];
                                if (h === null || h === void 0 ? void 0 : h.before["*"])
                                    beforeHooks.push.apply(beforeHooks, h.before["*"]);
                                if (h === null || h === void 0 ? void 0 : h.before[key])
                                    beforeHooks.push.apply(beforeHooks, h.before[key]);
                            });
                        }
                        else {
                            beforeHooks = cache.before[key];
                        }
                        if (!cache.after[key]) {
                            afterHooks = cache.after[key] = [];
                            listParents.reverse().forEach(function (name) {
                                var h = hooks[name];
                                if (h === null || h === void 0 ? void 0 : h.after["*"])
                                    afterHooks.push.apply(afterHooks, h.after["*"]);
                                if (h === null || h === void 0 ? void 0 : h.after[key])
                                    afterHooks.push.apply(afterHooks, h.after[key]);
                            });
                        }
                        else {
                            afterHooks = cache.after[key];
                        }
                        _a = 0, beforeHooks_1 = beforeHooks;
                        _c.label = 1;
                    case 1:
                        if (!(_a < beforeHooks_1.length)) return [3 /*break*/, 4];
                        method = beforeHooks_1[_a];
                        method = typeof method === "string" ? this[method] : method;
                        return [4 /*yield*/, method.call(this, context)];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        _a++;
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, originalMethod.call.apply(originalMethod, __spreadArrays([this, context], args))];
                    case 5:
                        // Call origin action
                        result = _c.sent();
                        _b = 0, afterHooks_1 = afterHooks;
                        _c.label = 6;
                    case 6:
                        if (!(_b < afterHooks_1.length)) return [3 /*break*/, 9];
                        method = afterHooks_1[_b];
                        method = typeof method === "string" ? this[method] : method;
                        return [4 /*yield*/, method.call(this, context, result)];
                    case 7:
                        result = _c.sent();
                        _c.label = 8;
                    case 8:
                        _b++;
                        return [3 /*break*/, 6];
                    case 9: return [2 /*return*/, result];
                }
            });
        });
    };
}
exports.Action = Action;
function Hook(trigger, actions) {
    return function (target, key) {
        var hooks;
        if (!(hooks = Reflect.getMetadata(utils_1.KEYS.REPOSITORY_HOOKS, target))) {
            hooks = {};
            Reflect.defineMetadata(utils_1.KEYS.REPOSITORY_HOOKS, hooks, target);
        }
        if (!Array.isArray(actions))
            actions = [actions];
        actions.forEach(function (actionName) {
            hooks[target.constructor.name] = hooks[target.constructor.name] || {
                before: {},
                after: {},
            };
            var h = hooks[target.constructor.name];
            h[trigger][actionName] = h[trigger][actionName] || [];
            h[trigger][actionName].push(key);
        });
    };
}
exports.Hook = Hook;
/**************** CLASS ****************/
var repos = new Map();
function resgisterRepository(repository, connection) {
    connection = connection || repository.connection;
    var map;
    if (!(map = repos.get(connection))) {
        map = {};
        repos.set(connection, map);
    }
    map[repository.name] = repository;
}
exports.resgisterRepository = resgisterRepository;
function getRepository(connection, name) {
    var _a;
    return (_a = repos.get(connection)) === null || _a === void 0 ? void 0 : _a[name];
}
exports.getRepository = getRepository;
function getRepositories(connection) {
    return repos.get(connection);
}
exports.getRepositories = getRepositories;
var Repository = /** @class */ (function () {
    function Repository(connection) {
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
    Object.defineProperty(Repository, "globalInstance", {
        get: function () {
            if (!this._globalInstance)
                this._globalInstance = new Repository();
            return this._globalInstance;
        },
        enumerable: false,
        configurable: true
    });
    Repository.registerHook = function (trigger, actions, handler) {
        var hooks;
        var target = this.globalInstance;
        if (!(hooks = Reflect.getMetadata(utils_1.KEYS.REPOSITORY_HOOKS, target))) {
            hooks = {};
            Reflect.defineMetadata(utils_1.KEYS.REPOSITORY_HOOKS, hooks, target);
        }
        if (!Array.isArray(actions))
            actions = [actions];
        actions.forEach(function (actionName) {
            hooks[target.constructor.name] = hooks[target.constructor.name] || {
                before: {},
                after: {},
            };
            var h = hooks[target.constructor.name];
            h[trigger][actionName] = h[trigger][actionName] || [];
            h[trigger][actionName].push(handler);
        });
    };
    Repository.prototype.makeDefaultContext = function (ctx) {
        var _a, _b, _c, _d;
        ctx = ctx || {};
        ctx.meta = (_a = ctx.meta) !== null && _a !== void 0 ? _a : {};
        ctx.query = (_b = ctx.query) !== null && _b !== void 0 ? _b : {};
        ctx.new = (_c = ctx.new) !== null && _c !== void 0 ? _c : true;
        ctx.softDelete = (_d = ctx.softDelete) !== null && _d !== void 0 ? _d : true;
    };
    // *** Default Action ***
    Repository.prototype.list = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var limit, skip, queryBuilder, _a, data, counts;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.buildQuery(ctx);
                        limit = ctx.pageSize || 10;
                        skip = ((ctx.page || 1) - 1) * limit;
                        queryBuilder = this.model.find(ctx.query, ctx.projection, __assign(__assign({}, lodash_1.default.pick(ctx, ["sort", "session"])), { limit: limit,
                            skip: skip }));
                        if (ctx.populates) {
                            this.populate(queryBuilder, ctx.populates);
                        }
                        return [4 /*yield*/, Promise.all([
                                queryBuilder.exec(),
                                this.model.countDocuments(ctx.query),
                            ])];
                    case 1:
                        _a = _b.sent(), data = _a[0], counts = _a[1];
                        return [2 /*return*/, {
                                data: data,
                                page: Math.floor(ctx.skip / ctx.limit) + 1,
                                totalPages: Math.ceil(counts / (ctx.limit || 10)),
                                pageSize: ctx.limit,
                                total: counts,
                            }];
                }
            });
        });
    };
    Repository.prototype.find = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var queryBuilder;
            return __generator(this, function (_a) {
                this.buildQuery(ctx);
                queryBuilder = this.model.find(ctx.query, ctx.projection, lodash_1.default.pick(ctx, ["skip", "limit", "sort", "session"]));
                if (ctx.populates) {
                    this.populate(queryBuilder, ctx.populates);
                }
                return [2 /*return*/, queryBuilder.exec()];
            });
        });
    };
    Repository.prototype.findOne = function (ctx) {
        this.buildQuery(ctx);
        var queryBuilder = this.model.findOne(ctx.query, ctx.projection, lodash_1.default.pick(ctx, ["skip", "limit", "sort", "session"]));
        if (ctx.populates) {
            this.populate(queryBuilder, ctx.populates);
        }
        return queryBuilder.exec();
    };
    Repository.prototype.create = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.cascadeCreate(ctx)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.model.create(ctx.data).then(function (doc) {
                                var _a;
                                if ((_a = ctx.populates) === null || _a === void 0 ? void 0 : _a.length) {
                                    return _this.populate(_this.model.findById(doc.id), ctx.populates).exec();
                                }
                                return doc;
                            })];
                }
            });
        });
    };
    Repository.prototype.createMany = function (ctx) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var options, cascadeTasks;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        options = lodash_1.default.pick(ctx, "session");
                        cascadeTasks = [];
                        (_a = ctx.data) === null || _a === void 0 ? void 0 : _a.forEach(function (item, index) {
                            cascadeTasks.push(_this.cascadeCreate(__assign(__assign({}, ctx), { data: item })));
                        });
                        return [4 /*yield*/, Promise.all(cascadeTasks)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, this.model.create(ctx.data, options).then(function (docs) {
                                return Promise.all(docs.map(function (doc) {
                                    var _a;
                                    if ((_a = ctx.populates) === null || _a === void 0 ? void 0 : _a.length) {
                                        return _this.populate(_this.model.findById(utils_1.getObjectId(doc)), ctx.populates).exec();
                                    }
                                    return doc;
                                }));
                            })];
                }
            });
        });
    };
    Repository.prototype.update = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.buildQuery(ctx);
                        return [4 /*yield*/, this.cascadeUpdate(ctx)];
                    case 1:
                        _a.sent();
                        if (ctx.new) {
                            return [2 /*return*/, this.model.find(ctx.query, "id").then(function (docs) {
                                    return _this.model.updateMany(ctx.query, ctx.data).then(function () {
                                        return _this.find(__assign(__assign({}, ctx), { limit: Number.MAX_SAFE_INTEGER, query: {
                                                id: {
                                                    $in: docs.map(utils_1.getObjectId),
                                                },
                                            } }));
                                    });
                                })];
                        }
                        else {
                            return [2 /*return*/, this.model.updateMany(ctx.query, ctx.data, lodash_1.default.pick(ctx, "session"))];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Repository.prototype.updateOne = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.buildQuery(ctx);
                        return [4 /*yield*/, this.cascadeUpdate(ctx)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.populate(this.model.findOneAndUpdate(ctx.query, ctx.data, lodash_1.default.pick(ctx, ["projecton", "session", "new"])), ctx.populates).exec()];
                }
            });
        });
    };
    Repository.prototype.delete = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var entites, result, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ctx.softDelete = false;
                        this.buildQuery(ctx);
                        return [4 /*yield*/, this.model.find(ctx.query)];
                    case 1:
                        entites = _a.sent();
                        return [4 /*yield*/, this.model.deleteMany(ctx.query, lodash_1.default.pick(ctx, "session"))];
                    case 2:
                        result = _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, Promise.all(entites.map(function (entity) { return _this.cascadeDelete(entity, ctx); }))];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.log(this.name, "cascade delete error", error_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, result];
                }
            });
        });
    };
    Repository.prototype.softDelete = function (ctx) {
        var update = {
            $currentDate: {},
        };
        this.model.schema.eachPath(function (path, type) {
            if (type.options.columnType === "deleteDate") {
                update.$currentDate[path] = true;
            }
        });
        return this.update(__assign(__assign({}, ctx), { data: update }));
    };
    Repository.prototype.restoreSoftDelete = function (ctx) {
        var update = {};
        this.model.schema.eachPath(function (path, type) {
            if (type.options.columnType === "deleteDate") {
                update[path] = null;
            }
        });
        return this.update(__assign(__assign({}, ctx), { data: update }));
    };
    // *** Utils ***
    Repository.prototype.buildQuery = function (ctx) {
        var query = ctx.query;
        // transform id => _id
        if (query.id) {
            query._id = query.id;
            delete query.id;
        }
        // Exclude all document softDeleted
        if (ctx.softDelete) {
            var deletePaths_1 = [];
            var deletedQuery_1 = {};
            this.model.schema.eachPath(function (path, type) {
                if (type.options.columnType === "deleteDate") {
                    deletePaths_1.push(path);
                    deletedQuery_1[path] = null;
                }
            });
            if (deletePaths_1.length > 0) {
                var originQuery = __assign({}, query);
                Object.keys(query).forEach(function (key) { return delete query[key]; });
                query.$and = [originQuery, deletedQuery_1];
            }
        }
    };
    Repository.prototype.populate = function (query, populates) {
        if (populates === void 0) { populates = []; }
        populates.forEach(function (populateItem) {
            query.populate(populateItem);
        });
        return query;
    };
    Repository.prototype.getReferenceModel = function (options, data) {
        return __awaiter(this, void 0, void 0, function () {
            var refPath, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (options.ref)
                            return [2 /*return*/, options.ref];
                        if (!options.refPath) return [3 /*break*/, 2];
                        refPath = lodash_1.default.get(data, options.refPath);
                        if (!(!refPath && utils_1.getObjectId(data))) return [3 /*break*/, 2];
                        _b = (_a = lodash_1.default).get;
                        return [4 /*yield*/, this.model.findById(utils_1.getObjectId(data))];
                    case 1:
                        refPath = _b.apply(_a, [_c.sent(), options.refPath]);
                        _c.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    Repository.prototype.cascadeCreate = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var data, cascadeTasks, handleCascade;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = ctx.data;
                        cascadeTasks = [];
                        handleCascade = function (path, options, fieldValue) {
                            if (mongoose_1.isValidObjectId(fieldValue))
                                return; // ignore if fieldValue is ObjectId
                            // update sub document
                            if (!utils_1.getObjectId(fieldValue)) {
                                cascadeTasks.push(function () { return __awaiter(_this, void 0, void 0, function () {
                                    var modelName, doc;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, this.getReferenceModel(options, data)];
                                            case 1:
                                                modelName = _b.sent();
                                                if (!modelName) return [3 /*break*/, 3];
                                                return [4 /*yield*/, ((_a = getRepository(this.connection, modelName)) === null || _a === void 0 ? void 0 : _a.create(__assign(__assign({}, ctx), { data: fieldValue })))];
                                            case 2:
                                                doc = _b.sent();
                                                lodash_1.default.set(data, path, utils_1.getObjectId(doc));
                                                _b.label = 3;
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                }); });
                            }
                            else {
                                var objectId_1 = utils_1.getObjectId(fieldValue);
                                cascadeTasks.push(function () { return __awaiter(_this, void 0, void 0, function () {
                                    var modelName;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, this.getReferenceModel(options, data)];
                                            case 1:
                                                modelName = _b.sent();
                                                if (!modelName) return [3 /*break*/, 3];
                                                return [4 /*yield*/, ((_a = getRepository(this.connection, modelName)) === null || _a === void 0 ? void 0 : _a.updateOne(__assign(__assign({}, ctx), { new: true, query: { _id: objectId_1 }, data: fieldValue })))];
                                            case 2:
                                                _b.sent();
                                                lodash_1.default.set(data, path, objectId_1);
                                                _b.label = 3;
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                }); });
                            }
                        };
                        this.schema.eachPath(function (path, type) {
                            var _a, _b, _c, _d;
                            var fieldValue;
                            if (type.instance === "ObjectID" && (fieldValue = lodash_1.default.get(data, path))) {
                                if (((_a = type.options) === null || _a === void 0 ? void 0 : _a.cascade) === true ||
                                    ((_c = (_b = type.options) === null || _b === void 0 ? void 0 : _b.cascade) === null || _c === void 0 ? void 0 : _c.create) === true) {
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
                                var options_1 = __assign(__assign({}, type.options), type.caster.options);
                                if (options_1.cascade === true || ((_d = options_1.cascade) === null || _d === void 0 ? void 0 : _d.create) === true) {
                                    fieldValue.forEach(function (item, index) {
                                        return handleCascade(path + "." + index, options_1, item);
                                    });
                                }
                                else {
                                    fieldValue.forEach(function (item, index) {
                                        return lodash_1.default.set(data, path + "." + index, utils_1.getObjectId(item));
                                    });
                                }
                            }
                        });
                        return [4 /*yield*/, Promise.all(cascadeTasks.map(function (t) { return t(); }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, data];
                }
            });
        });
    };
    Repository.prototype.cascadeUpdate = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var data, cascadeTasks, handleCascade;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = ctx.data;
                        cascadeTasks = [];
                        handleCascade = function (path, options, fieldValue) {
                            if (mongoose_1.isValidObjectId(fieldValue))
                                return; // ignore if fieldValue is ObjectId
                            var objectId = utils_1.getObjectId(fieldValue);
                            // update sub document
                            if (!utils_1.getObjectId(fieldValue)) {
                                cascadeTasks.push(function () { return __awaiter(_this, void 0, void 0, function () {
                                    var modelName, doc;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, this.getReferenceModel(options, data)];
                                            case 1:
                                                modelName = _b.sent();
                                                if (!modelName) return [3 /*break*/, 3];
                                                return [4 /*yield*/, ((_a = getRepository(this.connection, modelName)) === null || _a === void 0 ? void 0 : _a.create(__assign(__assign({}, ctx), { data: fieldValue })))];
                                            case 2:
                                                doc = _b.sent();
                                                lodash_1.default.set(data, path, utils_1.getObjectId(doc));
                                                _b.label = 3;
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                }); });
                            }
                            else {
                                var objectId_2 = utils_1.getObjectId(fieldValue);
                                cascadeTasks.push(function () { return __awaiter(_this, void 0, void 0, function () {
                                    var modelName;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, this.getReferenceModel(options, data)];
                                            case 1:
                                                modelName = _b.sent();
                                                if (!modelName) return [3 /*break*/, 3];
                                                return [4 /*yield*/, ((_a = getRepository(this.connection, modelName)) === null || _a === void 0 ? void 0 : _a.updateOne(__assign(__assign({}, ctx), { new: true, query: { _id: objectId_2 }, data: fieldValue })))];
                                            case 2:
                                                _b.sent();
                                                lodash_1.default.set(data, path, objectId_2);
                                                _b.label = 3;
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                }); });
                            }
                        };
                        this.schema.eachPath(function (path, type) {
                            var _a, _b, _c, _d;
                            var fieldValue;
                            if (type.instance === "ObjectID" &&
                                lodash_1.default.has(data, path) &&
                                (fieldValue = lodash_1.default.get(data, path))) {
                                if (((_a = type.options) === null || _a === void 0 ? void 0 : _a.cascade) === true ||
                                    ((_c = (_b = type.options) === null || _b === void 0 ? void 0 : _b.cascade) === null || _c === void 0 ? void 0 : _c.update) === true) {
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
                                var options_2 = __assign(__assign({}, type.options), type.caster.options);
                                if (options_2.cascade === true || ((_d = options_2.cascade) === null || _d === void 0 ? void 0 : _d.update) === true) {
                                    fieldValue.forEach(function (item, index) {
                                        return handleCascade(path + "." + index, options_2, item);
                                    });
                                }
                                else {
                                    fieldValue.forEach(function (item, index) {
                                        return lodash_1.default.set(data, path + "." + index, utils_1.getObjectId(item));
                                    });
                                }
                            }
                        });
                        return [4 /*yield*/, Promise.all(cascadeTasks.map(function (t) { return t(); }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, data];
                }
            });
        });
    };
    Repository.prototype.cascadeDelete = function (entity, ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var data, cascadeTasks, handleCascade;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = entity;
                        cascadeTasks = [];
                        handleCascade = function (options, fieldValue) {
                            if (utils_1.getObjectId(fieldValue)) {
                                // update sub document
                                cascadeTasks.push(function () { return __awaiter(_this, void 0, void 0, function () {
                                    var modelName;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, this.getReferenceModel(options, data)];
                                            case 1:
                                                modelName = _b.sent();
                                                if (!modelName) return [3 /*break*/, 3];
                                                return [4 /*yield*/, ((_a = getRepository(this.connection, modelName)) === null || _a === void 0 ? void 0 : _a.delete(__assign({ query: { _id: fieldValue } }, lodash_1.default.pick(ctx, "meta", "session"))))];
                                            case 2:
                                                _b.sent();
                                                _b.label = 3;
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                }); });
                            }
                        };
                        this.schema.eachPath(function (path, type) {
                            var _a, _b;
                            var fieldValue;
                            if (type.instance === "ObjectID" && (fieldValue = lodash_1.default.get(data, path))) {
                                if (((_a = type.options.cascade) === null || _a === void 0 ? void 0 : _a.delete) === true) {
                                    handleCascade(type.options, fieldValue);
                                }
                            }
                            // Array refs
                            else if (type.instance === "Array" &&
                                type.caster.instance === "ObjectID" &&
                                Array.isArray((fieldValue = lodash_1.default.get(data, path)))) {
                                var options_3 = __assign(__assign({}, type.options), type.caster.options);
                                if (((_b = options_3.cascade) === null || _b === void 0 ? void 0 : _b.delete) === true) {
                                    fieldValue.forEach(function (item) { return handleCascade(options_3, item); });
                                }
                            }
                        });
                        return [4 /*yield*/, Promise.all(cascadeTasks.map(function (t) { return t(); }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, data];
                }
            });
        });
    };
    Repository.prototype.validateEntity = function (data, options) {
        var descriptor = lodash_1.default.get(this.model.schema, utils_1.KEYS.SCHEMA_VALIDATOR);
        if (options === null || options === void 0 ? void 0 : options.makeAllOptional) {
            descriptor = __assign({}, descriptor);
            Object.values(descriptor).forEach(function (rule) {
                if (Array.isArray(rule)) {
                    rule.forEach(function (sr) {
                        sr.required = false;
                    });
                }
                else {
                    rule.required = false;
                }
            });
        }
        var validateSchema = new async_validator_1.default(descriptor);
        return new Promise(function (resolve) {
            validateSchema.validate(data, {}, function (errors, fields) {
                if (errors) {
                    resolve({ valid: false, errors: errors, fields: fields });
                }
                else {
                    resolve({ valid: true });
                }
            });
        });
    };
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
    return Repository;
}());
exports.Repository = Repository;
