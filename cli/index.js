#!/usr/bin/env node
const { Command } = require("commander");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

const program = new Command();
program
  .option("-b, --base <type>", "Base path, default src/services")
  .command("entity <dir> <name>")
  .action((dir, name) => {
    const basePath = path.join(process.cwd(), program.base || "src/services");
    const entityPath = path.join(basePath, dir, name);
    createEntity(entityPath, name);
  });

program.parse(process.argv);

async function createEntity(entityPath, entityName) {
  fs.mkdirSync(entityPath, { recursive: true });

  fs.writeFileSync(
    path.join(entityPath, `${entityName}.entity.ts`),
    await ejs.renderFile(path.join(__dirname, "./template/entity.template"), {
      name: entityName,
    })
  );
}
