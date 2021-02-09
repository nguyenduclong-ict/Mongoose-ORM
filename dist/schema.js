"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchema = exports.DeleteDateField = exports.Field = exports.Entity = void 0;
const lodash_1 = __importDefault(require("lodash"));
const mongoose_1 = require("mongoose");
require("reflect-metadata");
const constants_1 = require("./constants");
/**************** DECORATOR ****************/
function Entity(options) {
    return function (target) {
        options = options || {};
        options = {
            virtualId: true,
            autoIndex: true,
            ...options,
        };
        Reflect.defineMetadata(constants_1.KEYS.SCHEMA_OPTIONS, options, target);
    };
}
exports.Entity = Entity;
function Field(config) {
    return function (target, key) {
        if (!Array.isArray(config)) {
            config = config || {};
            config = { type: mongoose_1.SchemaTypes.String, ...config };
        }
        let fields;
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
    const fields = Reflect.getMetadata(constants_1.KEYS.SCHEMA_PATHS, classDefination);
    const options = Reflect.getMetadata(constants_1.KEYS.SCHEMA_OPTIONS, classDefination) || {};
    const schema = new mongoose_1.Schema(fields);
    if (options?.virtualId) {
        schema.set("toJSON", {
            virtuals: true,
            transform: (doc, converted) => {
                converted.id = doc._id;
                delete converted.__v;
                delete converted._id;
            },
        });
        schema.set("toObject", {
            virtuals: true,
            transform: (doc, converted) => {
                converted.id = doc._id;
                delete converted.__v;
                delete converted._id;
            },
        });
    }
    if (options.indexes) {
        options.indexes.forEach((indexSetting) => {
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
    const validateSchema = {};
    const fields = Reflect.getMetadata(constants_1.KEYS.SCHEMA_PATHS, classDefination);
    Object.keys(fields).forEach((path) => {
        let fieldOption = fields[path];
        const isArray = Array.isArray(fieldOption);
        if (isArray)
            fieldOption = fieldOption[0];
        if (fieldOption.validator) {
            validateSchema[path] = fieldOption.validator;
        }
        else {
            const rule = {};
            rule.required = fieldOption.required;
            // Type
            if (fieldOption.type === mongoose_1.SchemaTypes.String ||
                fieldOption.type === String) {
                rule.type = "string";
                if (lodash_1.default.has(fieldOption, "length"))
                    rule.len = fieldOption.length;
                if (lodash_1.default.has(fieldOption, "minlength"))
                    rule.min = fieldOption.minlength;
                if (lodash_1.default.has(fieldOption, "maxlength"))
                    rule.max = fieldOption.maxlength;
            }
            else if (isArray ||
                fieldOption.type === mongoose_1.SchemaTypes.Array ||
                fieldOption.type === Array ||
                Array.isArray(fieldOption.type)) {
                rule.type = "array";
                if (lodash_1.default.has(fieldOption, "length"))
                    rule.len = fieldOption.length;
                if (lodash_1.default.has(fieldOption, "minlength"))
                    rule.min = fieldOption.minlength;
                if (lodash_1.default.has(fieldOption, "maxlength"))
                    rule.max = fieldOption.maxlength;
            }
            else if (fieldOption.type === mongoose_1.SchemaTypes.Number ||
                fieldOption.type === Number) {
                rule.type = "number";
                if (lodash_1.default.has(fieldOption, "max"))
                    rule.max = fieldOption.max;
                if (lodash_1.default.has(fieldOption, "min"))
                    rule.min = fieldOption.min;
            }
            else if (fieldOption.type === mongoose_1.SchemaTypes.Boolean ||
                fieldOption.type === Boolean) {
                rule.type = "boolean";
            }
            else if (fieldOption.type === mongoose_1.SchemaTypes.ObjectId) {
                rule.type = "any";
                rule.validator = (r, v, cb) => {
                    if (rule.required && !v) {
                        return cb(r.fullField + " must be ObjectId");
                    }
                    if (!mongoose_1.isValidObjectId(v))
                        return cb(r.fullField + " must be ObjectId");
                    cb();
                };
            }
            if (lodash_1.default.has(fieldOption, "enum"))
                rule.enum = fieldOption.enum;
            if (rule.type) {
                validateSchema[path] = rule;
            }
        }
    });
    return validateSchema;
}
