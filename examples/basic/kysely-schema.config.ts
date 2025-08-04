export default {
  database: {
    dialect: "postgres",
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  },
  tables: {
    members: {
      email: {
        type: "varchar",
        length: 255,
        unique: true,
        notNull: true,
      },
      name: {
        type: "varchar",
        length: 255,
        notNull: true,
      },
      note: {
        type: "text",
      },
      age: {
        type: "integer",
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
