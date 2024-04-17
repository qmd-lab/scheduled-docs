
// Import external libraries
import { readYML, removeTempDir } from "./scheduled-docs.ts";

// Set parameters
const ymlPath = '_quarto.yml';
const scheduledDocsKey = "scheduled-docs"
const tempFilesDir = './scheduled-docs_files';

// Run functions
const scheduledDocs = await readYML(ymlPath, scheduledDocsKey);
await removeTempDir(scheduledDocs, tempFilesDir);
