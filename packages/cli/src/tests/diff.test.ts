import { describe, it, expect } from "vitest";
import { diffTables, Tables } from "../diff";

describe("diffTables", () => {
  it("should detect added and removed tables", () => {
    const dbTables: Tables = [
      {
        name: "users",
        columns: {
          id: { type: "integer" },
        },
      },
    ];
    const configTables: Tables = [
      {
        name: "users",
        columns: {
          id: { type: "integer" },
        },
      },
      {
        name: "posts",
        columns: {
          id: { type: "integer" },
        },
      },
    ];

    const diff = diffTables({
      current: dbTables,
      ideal: configTables,
    });

    expect(diff.addedTables).toEqual([
      {
        table: "posts",
        columns: {
          id: { type: "integer" },
        },
      },
    ]);
    expect(diff.removedTables).toEqual([]);
    expect(diff.changedTables).toEqual([]);
  });

  it("should detect removed tables", () => {
    const dbTables: Tables = [
      {
        name: "users",
        columns: {
          id: { type: "integer" },
        },
      },
      {
        name: "posts",
        columns: {
          id: { type: "integer" },
        },
      },
    ];
    const configTables: Tables = [
      {
        name: "users",
        columns: {
          id: { type: "integer" },
        },
      },
    ];

    const diff = diffTables({
      current: dbTables,
      ideal: configTables,
    });

    expect(diff.addedTables).toEqual([]);
    expect(diff.removedTables).toEqual(["posts"]);
    expect(diff.changedTables).toEqual([]);
  });

  it("should detect added, removed, and changed columns", () => {
    const dbTables: Tables = [
      {
        name: "users",
        columns: {
          id: { type: "integer" },
          name: { type: "varchar" },
          age: { type: "integer" },
        },
      },
    ];
    const configTables: Tables = [
      {
        name: "users",
        columns: {
          id: { type: "integer" },
          name: { type: "text" }, // type changed
          email: { type: "varchar" }, // added
        },
      },
    ];

    const diff = diffTables({
      current: dbTables,
      ideal: configTables,
    });

    expect(diff.addedTables).toEqual([]);
    expect(diff.removedTables).toEqual([]);
    expect(diff.changedTables).toEqual([
      {
        table: "users",
        addedColumns: [
          {
            column: "email",
            attributes: { type: "varchar" },
          },
        ],
        removedColumns: [
          {
            column: "age",
            attributes: { type: "integer" },
          },
        ],
        changedColumns: [
          {
            column: "name",
            before: { type: "varchar" },
            after: { type: "text" },
          },
        ],
      },
    ]);
  });

  it("should return empty diff for identical tables", () => {
    const dbTables: Tables = [
      {
        name: "users",
        columns: {
          id: { type: "integer" },
          name: { type: "varchar" },
        },
      },
    ];
    const configTables: Tables = [
      {
        name: "users",
        columns: {
          id: { type: "integer" },
          name: { type: "varchar" },
        },
      },
    ];

    const diff = diffTables({
      current: dbTables,
      ideal: configTables,
    });

    expect(diff.addedTables).toEqual([]);
    expect(diff.removedTables).toEqual([]);
    expect(diff.changedTables).toEqual([]);
  });
});
