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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchemaValidation = exports.createSchema = exports.DeleteDateField = exports.Field = exports.Entity = void 0;
var lodash_1 = __importDefault(require("lodash"));
var mongoose_1 = require("mongoose");
require("reflect-metadata");
var constants_1 = require("./constants");
/**************** DECORATOR ****************/
function Entity(options) {
    return function (target) {
        options = options || {};
        options = __assign({ autoIndex: true }, options);
        Reflect.defineMetadata(constants_1.KEYS.SCHEMA_OPTIONS, options, target);
    };
}
exports.Entity = Entity;
function Field(config) {
    return function (target, key) {
        if (!Array.isArray(config)) {
            config = __assign({ type: mongoose_1.SchemaTypes.String }, (config || {}));
        }
        var fields;
        if (!(fields = Reflect.getMetadata(constants_1.KEYS.SCHEMA_PATHS, target.constructor))) {
            fields = {};
            Reflect.defineMetadata(constants_1.KEYS.SCHEMA_PATHS, fields, target.constructor);
        }
        fields[key] = config;
    };
}
exports.Field = Field;
function DeleteDateField(config) {
    config = lodash_1.default.defaultsDeep(config, {
        required: false,
        type: mongoose_1.SchemaTypes.Date,
        default: null,
        columnType: "deleteDate",
    });
    return Field(config);
}
exports.DeleteDateField = DeleteDateField;
function createSchema(classDefination) {
    var _a, _b;
    var fields = Reflect.getMetadata(constants_1.KEYS.SCHEMA_PATHS, classDefination);
    var options = Reflect.getMetadata(constants_1.KEYS.SCHEMA_OPTIONS, classDefination) || {};
    options.id = (_a = options.id) !== null && _a !== void 0 ? _a : true;
    options.versionKey = (_b = options.versionKey) !== null && _b !== void 0 ? _b : false;
    var schema = new mongoose_1.Schema(fields, options);
    schema.set("toJSON", {
        virtuals: true,
        versionKey: options.versionKey,
        transform: function (doc, converted) {
            if (options.id)
                delete converted._id;
        },
    });
    if (options.indexes) {
        options.indexes.forEach(function (indexSetting) {
            schema.index(indexSetting.fields, indexSetting.options);
        });
    }
    lodash_1.default.set(schema, constants_1.KEYS.SCHEMA_VALIDATOR, getSchemaValidation(classDefination));
    lodash_1.default.set(schema, constants_1.KEYS.SCHEMA_OPTIONS, options);
    lodash_1.default.set(schema, constants_1.KEYS.SCHEMA_PATHS, fields);
    return schema;
}
exports.createSchema = createSchema;
function getSchemaValidation(classDefination) {
    var validateSchema = {};
    var fields = Reflect.getMetadata(constants_1.KEYS.SCHEMA_PATHS, classDefination);
    Object.keys(fields).forEach(function (path) {
        var fieldOption = fields[path];
        var isArray = Array.isArray(fieldOption);
        if (isArray)
            fieldOption = fieldOption[0];
        if (fieldOption.validator) {
            validateSchema[path] = fieldOption.validator;
        }
        else {
            var rule_1 = {};
            rule_1.required = fieldOption.required;
            // Type
            if (fieldOption.type === mongoose_1.SchemaTypes.String ||
                fieldOption.type === String) {
                rule_1.type = "string";
                if (lodash_1.default.has(fieldOption, "length"))
                    rule_1.len = fieldOption.length;
                if (lodash_1.default.has(fieldOption, "minlength"))
                    rule_1.min = fieldOption.minlength;
                if (lodash_1.default.has(fieldOption, "maxlength"))
                    rule_1.max = fieldOption.maxlength;
            }
            else if (isArray ||
                fieldOption.type === mongoose_1.SchemaTypes.Array ||
                fieldOption.type === Array ||
                Array.isArray(fieldOption.type)) {
                rule_1.type = "array";
                if (lodash_1.default.has(fieldOption, "length"))
                    rule_1.len = fieldOption.length;
                if (lodash_1.default.has(fieldOption, "minlength"))
                    rule_1.min = fieldOption.minlength;
                if (lodash_1.default.has(fieldOption, "maxlength"))
                    rule_1.max = fieldOption.maxlength;
            }
            else if (fieldOption.type === mongoose_1.SchemaTypes.Number ||
                fieldOption.type === Number) {
                rule_1.type = "number";
                if (lodash_1.default.has(fieldOption, "max"))
                    rule_1.max = fieldOption.max;
                if (lodash_1.default.has(fieldOption, "min"))
                    rule_1.min = fieldOption.min;
            }
            else if (fieldOption.type === mongoose_1.SchemaTypes.Boolean ||
                fieldOption.type === Boolean) {
                rule_1.type = "boolean";
            }
            else if (fieldOption.type === mongoose_1.SchemaTypes.ObjectId) {
                rule_1.type = "any";
                rule_1.validator = function (r, v, cb) {
                    if (rule_1.required && !v) {
                        return cb(r.fullField + " must be ObjectId");
                    }
                    if (!mongoose_1.isValidObjectId(v))
                        return cb(r.fullField + " must be ObjectId");
                    cb();
                };
            }
            if (lodash_1.default.has(fieldOption, "enum"))
                rule_1.enum = fieldOption.enum;
            if (rule_1.type) {
                validateSchema[path] = rule_1;
            }
        }
    });
    return validateSchema;
}
exports.getSchemaValidation = getSchemaValidation;
