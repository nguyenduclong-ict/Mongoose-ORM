"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentClasses = exports.Inject = exports.getObjectId = exports.createConnection = exports.createMongoUri = exports.waterFallPromises = void 0;
const mongoose_1 = require("mongoose");
function waterFallPromises(promises) {
    return promises.reduce((prev, curr) => prev.then((prevResult) => curr(prevResult)), Promise.resolve());
}
exports.waterFallPromises = waterFallPromises;
function createMongoUri(options) {
    if (typeof options === "string") {
        return options;
    }
    options = {
        port: 27017,
        host: "localhost",
        dbName: "admin",
        authSource: options.dbName,
        ...options,
    };
    const str = "mongodb://{username}:{password}@{host}:{port}/{dbName}";
    let uri = str
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
    options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
        ...options,
    };
    const conn = mongoose_1.createConnection(createMongoUri(uri), options);
    conn.on("connected", () => {
        console.log("*** connection ready", conn.name);
    });
    return conn;
}
exports.createConnection = createConnection;
function getObjectId(value) {
    if (mongoose_1.isValidObjectId(value))
        return value;
    if (mongoose_1.isValidObjectId(value?.id))
        return value.id;
    if (mongoose_1.isValidObjectId(value?._id))
        return value._id;
    return false;
}
exports.getObjectId = getObjectId;
function Inject(options) {
    return (target) => {
        Object.assign(target.prototype, options);
    };
}
exports.Inject = Inject;
function getParentClasses(targetClass) {
    const parents = [];
    if (targetClass instanceof Function) {
        let baseClass = targetClass;
        while (baseClass) {
            parents.push(baseClass.name);
            const newBaseClass = Object.getPrototypeOf(baseClass);
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
