import { column, defineTable } from "@izumisy/kyrage";

export const members = defineTable("members", {
  id: column("uuid", { primaryKey: true }),
  email: column("text", { unique: true }),
  name: column("text", { unique: true }),
  age: column("integer", { nullable: true }),
  createdAt: column("timestamptz"),
});

export const posts = defineTable("posts", {
  id: column("uuid", { primaryKey: true }),
  author_id: column("uuid"),
  title: column("text"),
  content: column("text"),
  published: column("boolean", { default: false }),
  published_at: column("timestamptz", { nullable: true }),
});
