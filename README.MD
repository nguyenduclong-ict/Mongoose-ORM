```bash
npm i --save mongoose-orm
```

```bash
# CLI mongoose-orm
npm i -g mongoose-orm
mongoose-orm --help

# create entity
mongoose-orm entity entities User

# => generate
src/services/entities/User.schema.ts
src/services/entities/User.repository.ts
```

## Create mongoose connection

```typescript
# connection.ts
import { createConnection } from "mongoose-orm";

export const connection = createConnection({
  dbName: "demo",
  user: "demo2",
  pass: "123456",
  authSource: "admin",
});
```

## Create Entity

```typescript
import {
  Hook,
  Repository,
  createSchema,
  Field,
  Entity,
  Inject,
} from "mongoose-orm";
import { connection } from "./connection";

@Entity({ timestamps: true }) // Pass schema option here
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
```

```typescript
// Use repository
const photoRepository = new PhotoRepository();
const photos = await photoRepository.find({ query: { alt: "abc" } });
```

## Cascade

Support cascade on create, update, delete

```typescript
@Entity({ timestamps: true })
class Post {
  @Field({ required: true })
  title: string;

  @Field()
  content: string;

  @Field([{ type: SchemaTypes.ObjectId, ref: "Photo", cascade: true }]) // enable cascade here
  photos: Photo[];
}

export const PostSchema = createSchema(Post);

@Inject<Repository>({
  connection: connection,
  schema: PostSchema,
})
export class PostRepository extends Repository<Post> {}

// Use cascade, example on create post
const postRepository = new PostRepository();
const photoRepository = new PhotoRepository();

const post = await postRepository.create({
  data: {
    title: "What is Lorem Ipsum?",
    content:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
    photos: [{ url: "https://fakeimg.pl/300", alt: "" }],
  },
  populates: ["photos"], // auto populate after create
});
```

## Validate Entity

Auto generate validate from schema, see rule [async-validator](https://www.npmjs.com/package/async-validator)

```typescript
const result = await postRepository.validateEntity({ content: "demo" });
// => validate result
{
  valid: false,
  errors: [ { message: 'title is required', field: 'title' } ],
  fields: { title: [ [Object] ] }
}

// Custom rule on schema
@Field({validator: <Rule>})
<fieldName>: string
```
