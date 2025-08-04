export default {
  database: {
    dialect: "postgres",
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  },
  tables: {
    members: {
      id: {
        type: "uuid",
        notNull: true,
        primaryKey: true,
      },
      email: {
        type: "text",
        notNull: true,
        unique: true,
      },
      name: {
        type: "text",
        unique: true,
      },
      age: {
        type: "int4",
      },
      createdAt: {
        type: "timestamptz",
      },
    },
  },
};
