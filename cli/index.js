#!/usr/bin/env node
const { Command } = require("commander");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

const program = new Command();
program.command("entity <dir> <name>").action((dir, name) => {
  const basePath = process.cwd();
  const entityPath = path.join(basePath, dir, name);
  createEntity(entityPath, name);
});

program.parse(process.argv);

async function createEntity(entityPath, entityName) {
  fs.mkdirSync(entityPath, { recursive: true });

  fs.writeFileSync(
    path.join(entityPath, `${entityName}.ts`),
    await ejs.renderFile(path.join(__dirname, "./template/entity.template"), {
      name: entityName,
    })
  );
}
