import fs from "node:fs";
import path from "node:path";
import { generateOpenApiDocument } from "./openapi";

const outputPath = path.resolve(process.cwd(), "../docs/openapi.generated.json");
const document = generateOpenApiDocument();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");

console.log(`Generated OpenAPI spec at ${path.relative(path.resolve(process.cwd(), ".."), outputPath)}`);
