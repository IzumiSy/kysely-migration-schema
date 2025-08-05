export const tables = {
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
};
