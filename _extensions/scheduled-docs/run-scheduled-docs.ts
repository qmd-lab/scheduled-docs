
// Import external libraries
import { readYML, propagateKeys, processSchedule, writeDraftList, writeScheduledDocs, writeListingContents } from "./scheduled-docs.ts";

// Set parameters
const ymlPath = '_quarto.yml';
const scheduledDocsKey = 'scheduled-docs';
const itemsKey = 'docs';
const tempFilesDir = './scheduled-docs_files';
const tempFilesDirOffset = "..";

// Run functions
console.log("=== Scheduled-docs ===")
let scheduledDocs = await readYML(ymlPath, scheduledDocsKey);
propagateKeys(scheduledDocs);
processSchedule(scheduledDocs, itemsKey);
await writeDraftList(scheduledDocs, tempFilesDir);
await writeScheduledDocs(scheduledDocs, tempFilesDir);
await writeListingContents(scheduledDocs, tempFilesDir);
