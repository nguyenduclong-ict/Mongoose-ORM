import { Hook, Repository } from "../repository";
import { Inject } from "../utils";
import { createSchema, Field, Entity } from "../schema";
import { connection } from "./connection.test";

@Entity()
export class Photo {
  @Field()
  url: string;

  @Field()
  alt: string;
}

export const PhotoSchema = createSchema(Photo);

@Inject<Repository>({
  connection: connection,
  schema: PhotoSchema,
})
export class PhotoRepository extends Repository<Photo> {
  @Hook("before", ["create"])
  beforeCreate(ctx: any) {
    console.log("beforeCreate", ctx);
  }
}
