
import { existsSync } from "https://deno.land/std/fs/mod.ts";
import { ensureDirSync } from "https://deno.land/std/fs/mod.ts";

// Check for _schedule.yml in project root - silently exit if not found
if (!existsSync("_schedule.yml")) {
    // Create empty draft-list.yml to satisfy metadata-files expectation
    ensureDirSync("scheduled-docs_files");
    Deno.writeTextFileSync("scheduled-docs_files/draft-list.yml", "# No _schedule.yml found\n");
    Deno.exit(0);
}

// Import external libraries
import { readConfig, readScheduledDocs, propagateKeys, setDraftStatuses, writeDraftList, writeSchedule, writeListingContents, writeAutonavContents } from "./scheduled-docs.ts";

console.log("=== Scheduled-docs ===");

// Get parameters
const configParams = await readConfig();
const ymlPath = configParams['path-to-yaml']
const scheduledDocsKey = configParams['scheduled-docs-key'];
const itemsKey = configParams['docs-key'];
const tempFilesDir = configParams['temp-files-dir'];

let dateFormat = configParams['date-format'];
if ( dateFormat === undefined ) {
    dateFormat = "yyyy-MM-dd";
}

// Run functions
let scheduledDocs = await readScheduledDocs(ymlPath, scheduledDocsKey, configParams);
propagateKeys(scheduledDocs);
setDraftStatuses(scheduledDocs, itemsKey, dateFormat, ymlPath);
await writeDraftList(scheduledDocs, tempFilesDir);
await writeSchedule(scheduledDocs, tempFilesDir);
await writeListingContents(scheduledDocs, tempFilesDir);
await writeAutonavContents(scheduledDocs, tempFilesDir);
