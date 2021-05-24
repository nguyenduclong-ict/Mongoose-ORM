import { RuleItem, Rules } from "async-validator";
import { getValidateDescriptor } from "class-validate";
import _ from "lodash";
import { Schema, SchemaTypes } from "mongoose";
import "reflect-metadata";
import { EntityOptions, FieldType } from "./declaration";
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

  const validatorSchema = getSchemaValidation(classDefination);
  const vs2 = getValidateDescriptor(classDefination);
  Object.keys(vs2).forEach((key) => {
    const override = Reflect.getMetadata(
      "override:validate#" + key,
      classDefination
    );

    if (override) {
      validatorSchema[key] = vs2[key];
    } else {
      validatorSchema[key] = validatorSchema[key] || [];
      if (!Array.isArray(key)) {
        validatorSchema[key] = [validatorSchema[key] as any];
      }
      (validatorSchema[key] as any).push(...(vs2[key] as any));
    }
  });

  _.set(schema, KEYS.SCHEMA_VALIDATOR, validatorSchema);
  _.set(schema, KEYS.SCHEMA_OPTIONS, options);
  _.set(schema, KEYS.SCHEMA_PATHS, fields);

  return schema;
}

export function getSchemaValidation(classDefination: any) {
  const validateSchema: Rules = {};
  const fields: any = Reflect.getMetadata(KEYS.SCHEMA_PATHS, classDefination);
  Object.keys(fields).forEach((path) => {
    const rules: RuleItem[] = [];
    let fieldOption = fields[path];
    const isArray = Array.isArray(fieldOption);
    if (isArray) fieldOption = fieldOption[0];

    const name = fieldOption.name || path;

    if (fieldOption.required) {
      rules.push({
        required: true,
        message: name + " is required",
      });
    }
    if (
      fieldOption.type === SchemaTypes.String ||
      fieldOption.type === String
    ) {
      const rule: RuleItem = {};
      rule.type = "string";
      if (_.has(fieldOption, "length")) rule.len = fieldOption.length;
      if (_.has(fieldOption, "minlength")) rule.min = fieldOption.minlength;
      if (_.has(fieldOption, "maxlength")) rule.max = fieldOption.maxlength;
      rules.push(rule);
    } else if (
      isArray ||
      fieldOption.type === SchemaTypes.Array ||
      fieldOption.type === Array ||
      Array.isArray(fieldOption.type)
    ) {
      const rule: RuleItem = {};
      rule.type = "array";
      if (_.has(fieldOption, "length")) rule.len = fieldOption.length;
      if (_.has(fieldOption, "minlength")) rule.min = fieldOption.minlength;
      if (_.has(fieldOption, "maxlength")) rule.max = fieldOption.maxlength;
    } else if (
      fieldOption.type === SchemaTypes.Number ||
      fieldOption.type === Number
    ) {
      const rule: RuleItem = {};
      rule.type = "number";
      if (_.has(fieldOption, "max")) rule.max = fieldOption.max;
      if (_.has(fieldOption, "min")) rule.min = fieldOption.min;
      rules.push(rule);
    } else if (
      fieldOption.type === SchemaTypes.Boolean ||
      fieldOption.type === Boolean
    ) {
      rules.push({
        type: "boolean",
      });
    } else if (fieldOption.type?.schemaName === "ObjectId") {
      rules.push({
        type: "any",
        pattern: /^[a-fd]{24}$/i,
        patternObject: ["^[a-fd]{24}$", "i"],
        message: `${name} must be ObjectId`,
      } as any);
    }

    if (_.has(fieldOption, "enum")) {
      rules.push({
        enum: fieldOption.enum,
        message: `${name} must be in ${fieldOption.enum.join(", ")}`,
      });
    }
    validateSchema[path] = rules;
  });

  return validateSchema;
}
