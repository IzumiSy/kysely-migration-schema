import { members, posts } from "./schema";

export default {
  database: {
    dialect: "postgres",
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  },
  tables: {
    members,
    posts,
  },
};
