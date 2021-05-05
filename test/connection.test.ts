import { createConnection } from "../utils";

export const connection = createConnection({
  dbName: "demo",
  user: "demo2",
  pass: "123456",
  authSource: "admin",
});
