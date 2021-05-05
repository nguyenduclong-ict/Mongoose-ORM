import { PhotoRepository } from "./photo.test";
import { PostRepository } from "./post.test";

async function main() {
  const postRepository = new PostRepository();
  const photoRepository = new PhotoRepository();

  console.log(await postRepository.validateEntity({ content: "abc" } as any));
  const post = await postRepository.create({
    data: {
      title: "What is Lorem Ipsum?",
      content:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
      photos: [{ url: "https://fakeimg.pl/300", alt: "" }],
    },
    populates: ["photos"],
  });
  console.log(JSON.parse(JSON.stringify(post)));
  console.log(await photoRepository.find({}));
  await postRepository.delete({ query: { id: post.id } });
}

main();
