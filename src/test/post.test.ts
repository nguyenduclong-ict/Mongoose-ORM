import { SchemaTypes } from "mongoose";
import { Repository } from "../repository";
import { Inject } from "../utils";
import { Entity, Field, createSchema } from "../schema";
import { connection } from "./connection.test";
import { Photo } from "./photo.test";

@Entity()
class Post {
  @Field({ required: true })
  title: string;

  @Field()
  content: string;

  @Field([{ type: SchemaTypes.ObjectId, ref: "Photo", cascade: true }])
  photos: Photo[];
}

export const PostSchema = createSchema(Post);

@Inject<Repository>({
  connection: connection,
  schema: PostSchema,
})
export class PostRepository extends Repository<Post> {}
