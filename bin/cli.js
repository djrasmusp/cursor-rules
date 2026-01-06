#!/usr/bin/env node

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import inquirer from "inquirer";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rulesDir = path.join(__dirname, "../rules");
const targetDir = path.join(process.cwd(), ".cursor/rules");

async function main() {
    const files = await fs.readdir(rulesDir);

    if (!files.length) {
        console.log("No rules found");
        return;
    }

    const rules = await Promise.all(
        files
            .filter(file => file.endsWith(".mdc")) // evt. filter
            .map(async (filename) => {
                const rulePath = path.join(rulesDir, filename);
                const content = await fs.readFile(rulePath, "utf8");
                const { data } = matter(content);

                return {
                    filename,
                    name: data.name ?? filename.replace(".mdc", ""),
                    description: data.description ?? "",
                    tags: data.tags ?? []
                };
            })
    );

    rules.sort((a, b) => a.name.localeCompare(b.name));

    const { selected } = await inquirer.prompt([
        {
            type: "checkbox",
            name: "selected",
            message: "Pick Cursor Rules to be installed:",
            choices: rules.map(rule => ({
        name: `${rule.name} — ${rule.description}`,
        value: rule.filename
    }))
        }
    ]);

    if (!selected.length) {
        console.log("No rules selected");
        return;
    }

    await fs.ensureDir(targetDir);

    for (const file of selected) {
        await fs.copy(
            path.join(rulesDir, file),
            path.join(targetDir, file)
        );
    }

    console.log(`✅ Installerede ${selected.length} rule(s) i .cursor/rules`);
}

main();