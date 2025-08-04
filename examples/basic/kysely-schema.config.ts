export default {
  database: {
    dialect: "postgres",
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  },
  tables: {
    members: {
      email: {
        type: "varchar",
        notNull: true,
      },
      name: {
        type: "varchar",
        notNull: true,
      },
      note: {
        type: "text",
      },
      age: {
        type: "int4",
        notNull: true,
      },
    },
  },
  indexes: {
    users_email_idx: {
      table: "users",
      columns: ["email"],
      unique: true,
    },
  },
};
