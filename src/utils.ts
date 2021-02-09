import {
  isValidObjectId,
  ConnectionOptions,
  createConnection as createMongoConnection,
} from "mongoose";

export function waterFallPromises(promises: any[]) {
  return promises.reduce(
    (prev: any, curr: any) => prev.then((prevResult: any) => curr(prevResult)),
    Promise.resolve()
  );
}

interface UriOption {
  host?: string;
  port?: string | number;
  dbName?: string;
  user?: string;
  pass?: string;
  authSource?: string;
}

export function createMongoUri(options: UriOption | string) {
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
    .replace("{port}", options.port as string)
    .replace("{dbName}", options.dbName);

  if (options.authSource) {
    uri += "?authSource=" + options.authSource;
  }

  return uri;
}

export function createConnection(
  uri: string | UriOption,
  options?: ConnectionOptions
) {
  options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    ...options,
  };

  const conn = createMongoConnection(createMongoUri(uri), options);

  conn.on("connected", () => {
    console.log("*** connection ready", conn.name);
  });

  return conn;
}

export function getObjectId(value: any): any {
  if (isValidObjectId(value)) return value;
  if (isValidObjectId(value?.id)) return value.id;
  if (isValidObjectId(value?._id)) return value._id;
  return false;
}

export function Inject<T = any>(options?: Partial<T>) {
  return (target: any) => {
    Object.assign(target.prototype, options);
  };
}

export function getParentClasses(targetClass: any): string[] {
  const parents: string[] = [];
  if (targetClass instanceof Function) {
    let baseClass = targetClass;

    while (baseClass) {
      parents.push(baseClass.name);
      const newBaseClass = Object.getPrototypeOf(baseClass);

      if (newBaseClass && newBaseClass !== Object && newBaseClass.name) {
        baseClass = newBaseClass;
      } else {
        break;
      }
    }
  }
  return parents;
}
