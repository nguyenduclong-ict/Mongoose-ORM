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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentClasses = exports.Inject = exports.getObjectId = exports.createConnection = exports.createMongoUri = exports.waterFallPromises = void 0;
var mongoose_1 = require("mongoose");
function waterFallPromises(promises) {
    return promises.reduce(function (prev, curr) { return prev.then(function (prevResult) { return curr(prevResult); }); }, Promise.resolve());
}
exports.waterFallPromises = waterFallPromises;
function createMongoUri(options) {
    if (typeof options === "string") {
        return options;
    }
    options = __assign({ port: 27017, host: "localhost", dbName: "admin", authSource: options.dbName }, options);
    var str = "mongodb://{username}:{password}@{host}:{port}/{dbName}";
    var uri = str
        .replace("{username}", options.user)
        .replace("{password}", options.pass)
        .replace("{host}", options.host)
        .replace("{port}", options.port)
        .replace("{dbName}", options.dbName);
    if (options.authSource) {
        uri += "?authSource=" + options.authSource;
    }
    return uri;
}
exports.createMongoUri = createMongoUri;
function createConnection(uri, options) {
    options = __assign({ useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }, options);
    var conn = mongoose_1.createConnection(createMongoUri(uri), options);
    conn.on("connected", function () {
        console.log("*** connection ready", conn.name);
    });
    return conn;
}
exports.createConnection = createConnection;
function getObjectId(value) {
    if (typeof value === "string" && mongoose_1.isValidObjectId(value))
        return value;
    if (value instanceof mongoose_1.Types.ObjectId)
        return String(value);
    if ((value === null || value === void 0 ? void 0 : value._id) && mongoose_1.isValidObjectId(value === null || value === void 0 ? void 0 : value._id))
        return String(value._id);
    if ((value === null || value === void 0 ? void 0 : value.id) && mongoose_1.isValidObjectId(value === null || value === void 0 ? void 0 : value.id))
        return String(value.id);
    return null;
}
exports.getObjectId = getObjectId;
function Inject(options) {
    return function (target) {
        Object.assign(target.prototype, options);
    };
}
exports.Inject = Inject;
function getParentClasses(targetClass) {
    var parents = [];
    if (targetClass instanceof Function) {
        var baseClass = targetClass;
        while (baseClass) {
            parents.push(baseClass.name);
            var newBaseClass = Object.getPrototypeOf(baseClass);
            if (newBaseClass && newBaseClass !== Object && newBaseClass.name) {
                baseClass = newBaseClass;
            }
            else {
                break;
            }
        }
    }
    return parents;
}
exports.getParentClasses = getParentClasses;
