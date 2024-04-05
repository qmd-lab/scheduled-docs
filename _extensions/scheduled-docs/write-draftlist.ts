
// Import external libraries
import { readYML, processSchedule, writeDraftList } from "./scheduled-docs.ts";

// Set parameters
const configPath = '_quarto.yml';
const configKey = 'scheduled-docs';
const itemsKey = 'docs';
const tempFilesDir = './scheduled-docs_files';
const tempFilesDirOffset = "..";

// Run functions
let config = await readYML(configPath);
//config = await propagateDates(config);
config = await processSchedule(config, configKey, itemsKey);
await writeDraftList(config, configKey, tempFilesDir);
