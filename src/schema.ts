import { RuleItem, Rules } from "async-validator";
import { EntityOptions, FieldType } from "./declaration";
import _ from "lodash";
import { isValidObjectId, Schema, SchemaTypes } from "mongoose";
import "reflect-metadata";
import { KEYS } from "./utils";

export function Entity<E>(options?: EntityOptions<E>) {
  return function (target: any) {
    options = options || {};
    options = {
      autoIndex: true,
      ...options,
    };
    Reflect.defineMetadata(KEYS.SCHEMA_OPTIONS, options, target);
  };
}

export function Field(config?: FieldType) {
  return function (target: any, key: string) {
    if (!Array.isArray(config)) {
      config = { type: SchemaTypes.String, ...(config || {}) } as any;
    }
    let fields: any;
    if (
      !(fields = Reflect.getMetadata(KEYS.SCHEMA_PATHS, target.constructor))
    ) {
      fields = {};
      Reflect.defineMetadata(KEYS.SCHEMA_PATHS, fields, target.constructor);
    }
    fields[key] = config;
  };
}

export function DeleteDateField(config?: FieldType) {
  config = _.defaultsDeep(config, {
    required: false,
    type: SchemaTypes.Date,
    default: null,
    columnType: "deleteDate",
  });

  return Field(config);
}

export function createSchema(classDefination: any) {
  const fields: any = Reflect.getMetadata(KEYS.SCHEMA_PATHS, classDefination);
  const options: EntityOptions =
    Reflect.getMetadata(KEYS.SCHEMA_OPTIONS, classDefination) || {};
  options.id = options.id ?? true;
  options.versionKey = options.versionKey ?? false;
  const schema = new Schema<typeof classDefination>(fields, options);
  schema.set("toJSON", {
    virtuals: true,
    versionKey: options.versionKey,
    transform: (doc: any, converted: any) => {
      if (options.id) delete converted._id;
    },
  });
  if (options.indexes) {
    options.indexes.forEach((indexSetting) => {
      schema.index(indexSetting.fields, indexSetting.options);
    });
  }

  _.set(schema, KEYS.SCHEMA_VALIDATOR, getSchemaValidation(classDefination));
  _.set(schema, KEYS.SCHEMA_OPTIONS, options);
  _.set(schema, KEYS.SCHEMA_PATHS, fields);

  return schema;
}

export function getSchemaValidation(classDefination: any) {
  const validateSchema: Rules = {};
  const fields: any = Reflect.getMetadata(KEYS.SCHEMA_PATHS, classDefination);
  Object.keys(fields).forEach((path) => {
    let fieldOption = fields[path];
    const isArray = Array.isArray(fieldOption);
    if (isArray) fieldOption = fieldOption[0];
    if (fieldOption.validator) {
      validateSchema[path] = fieldOption.validator;
    } else {
      const rule: RuleItem = {};
      rule.required = fieldOption.required;
      // Type
      if (
        fieldOption.type === SchemaTypes.String ||
        fieldOption.type === String
      ) {
        rule.type = "string";
        if (_.has(fieldOption, "length")) rule.len = fieldOption.length;
        if (_.has(fieldOption, "minlength")) rule.min = fieldOption.minlength;
        if (_.has(fieldOption, "maxlength")) rule.max = fieldOption.maxlength;
      } else if (
        isArray ||
        fieldOption.type === SchemaTypes.Array ||
        fieldOption.type === Array ||
        Array.isArray(fieldOption.type)
      ) {
        rule.type = "array";
        if (_.has(fieldOption, "length")) rule.len = fieldOption.length;
        if (_.has(fieldOption, "minlength")) rule.min = fieldOption.minlength;
        if (_.has(fieldOption, "maxlength")) rule.max = fieldOption.maxlength;
      } else if (
        fieldOption.type === SchemaTypes.Number ||
        fieldOption.type === Number
      ) {
        rule.type = "number";
        if (_.has(fieldOption, "max")) rule.max = fieldOption.max;
        if (_.has(fieldOption, "min")) rule.min = fieldOption.min;
      } else if (
        fieldOption.type === SchemaTypes.Boolean ||
        fieldOption.type === Boolean
      ) {
        rule.type = "boolean";
      } else if (fieldOption.type === SchemaTypes.ObjectId) {
        rule.type = "any";
        rule.validator = (r, v, cb) => {
          if (rule.required && !v) {
            return cb(r.fullField + " must be ObjectId");
          }
          if (!isValidObjectId(v)) return cb(r.fullField + " must be ObjectId");
          cb();
        };
      }
      if (_.has(fieldOption, "enum")) rule.enum = fieldOption.enum;
      if (rule.type) {
        validateSchema[path] = rule;
      }
    }
  });

  return validateSchema;
}
