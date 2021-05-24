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
var class_validate_1 = require("class-validate");
var lodash_1 = __importDefault(require("lodash"));
var mongoose_1 = require("mongoose");
require("reflect-metadata");
var utils_1 = require("./utils");
function Entity(options) {
    return function (target) {
        options = options || {};
        options = __assign({ autoIndex: true }, options);
        Reflect.defineMetadata(utils_1.KEYS.SCHEMA_OPTIONS, options, target);
    };
}
exports.Entity = Entity;
function Field(config) {
    return function (target, key) {
        if (!Array.isArray(config)) {
            config = __assign({ type: mongoose_1.SchemaTypes.String }, (config || {}));
        }
        var fields;
        if (!(fields = Reflect.getMetadata(utils_1.KEYS.SCHEMA_PATHS, target.constructor))) {
            fields = {};
            Reflect.defineMetadata(utils_1.KEYS.SCHEMA_PATHS, fields, target.constructor);
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
    var fields = Reflect.getMetadata(utils_1.KEYS.SCHEMA_PATHS, classDefination);
    var options = Reflect.getMetadata(utils_1.KEYS.SCHEMA_OPTIONS, classDefination) || {};
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
    var validatorSchema = getSchemaValidation(classDefination);
    var vs2 = class_validate_1.getValidateDescriptor(classDefination);
    Object.keys(vs2).forEach(function (key) {
        var _a;
        var override = Reflect.getMetadata("override:validate#" + key, classDefination);
        if (override) {
            validatorSchema[key] = vs2[key];
        }
        else {
            validatorSchema[key] = validatorSchema[key] || [];
            if (!Array.isArray(key)) {
                validatorSchema[key] = [validatorSchema[key]];
            }
            (_a = validatorSchema[key]).push.apply(_a, vs2[key]);
        }
    });
    lodash_1.default.set(schema, utils_1.KEYS.SCHEMA_VALIDATOR, validatorSchema);
    lodash_1.default.set(schema, utils_1.KEYS.SCHEMA_OPTIONS, options);
    lodash_1.default.set(schema, utils_1.KEYS.SCHEMA_PATHS, fields);
    return schema;
}
exports.createSchema = createSchema;
function getSchemaValidation(classDefination) {
    var validateSchema = {};
    var fields = Reflect.getMetadata(utils_1.KEYS.SCHEMA_PATHS, classDefination);
    Object.keys(fields).forEach(function (path) {
        var _a;
        var rules = [];
        var fieldOption = fields[path];
        var isArray = Array.isArray(fieldOption);
        if (isArray)
            fieldOption = fieldOption[0];
        var name = fieldOption.name || path;
        if (fieldOption.required) {
            rules.push({
                required: true,
                message: name + " is required",
            });
        }
        if (fieldOption.type === mongoose_1.SchemaTypes.String ||
            fieldOption.type === String) {
            var rule = {};
            rule.type = "string";
            if (lodash_1.default.has(fieldOption, "length"))
                rule.len = fieldOption.length;
            if (lodash_1.default.has(fieldOption, "minlength"))
                rule.min = fieldOption.minlength;
            if (lodash_1.default.has(fieldOption, "maxlength"))
                rule.max = fieldOption.maxlength;
            rules.push(rule);
        }
        else if (isArray ||
            fieldOption.type === mongoose_1.SchemaTypes.Array ||
            fieldOption.type === Array ||
            Array.isArray(fieldOption.type)) {
            var rule = {};
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
            var rule = {};
            rule.type = "number";
            if (lodash_1.default.has(fieldOption, "max"))
                rule.max = fieldOption.max;
            if (lodash_1.default.has(fieldOption, "min"))
                rule.min = fieldOption.min;
            rules.push(rule);
        }
        else if (fieldOption.type === mongoose_1.SchemaTypes.Boolean ||
            fieldOption.type === Boolean) {
            rules.push({
                type: "boolean",
            });
        }
        else if (((_a = fieldOption.type) === null || _a === void 0 ? void 0 : _a.schemaName) === "ObjectId") {
            rules.push({
                type: "any",
                pattern: /^[a-fd]{24}$/i,
                patternObject: ["^[a-fd]{24}$", "i"],
                message: name + " must be ObjectId",
            });
        }
        if (lodash_1.default.has(fieldOption, "enum")) {
            rules.push({
                enum: fieldOption.enum,
                message: name + " must be in " + fieldOption.enum.join(", "),
            });
        }
        validateSchema[path] = rules;
    });
    return validateSchema;
}
exports.getSchemaValidation = getSchemaValidation;
