export default {
  tables: {
    users: {
      id: {
        type: "string",
        primaryKey: true,
        generated: "uuid",
      },
      name: {
        type: "varchar",
        length: 255,
        notNull: true,
      },
      email: {
        type: "varchar",
        length: 255,
        unique: true,
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
