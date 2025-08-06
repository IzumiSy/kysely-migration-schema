import { column as c, defineTable as t } from "@izumisy/kyrage";

export const members = t("members", {
  id: c("uuid", { primaryKey: true }),
  email: c("text", { unique: true }),
  name: c("text", { unique: true }),
  age: c("integer", { nullable: true }),
  createdAt: c("timestamptz"),
});

export const posts = t("posts", {
  id: c("uuid", { primaryKey: true }),
  author_id: c("uuid"),
  title: c("text"),
  content: c("text"),
  published: c("boolean", { default: false }),
  published_at: c("timestamptz", { nullable: true }),
});
