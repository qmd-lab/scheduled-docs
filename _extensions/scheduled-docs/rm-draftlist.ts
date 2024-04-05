
// Import external libraries
import { readYML, removeTempDir } from "./scheduled-docs.ts";

// Set parameters
const configPath = '_quarto.yml';
const configKey = "scheduled-docs"
const tempFilesDir = './scheduled-docs_files';

// Run functions
const config = await readYML(configPath);
await removeTempDir(config, configKey, tempFilesDir);
