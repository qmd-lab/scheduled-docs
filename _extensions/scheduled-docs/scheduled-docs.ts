// Import external libraries
import { parse, stringify } from "https://deno.land/std/yaml/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";

// ---------------------------- //
//     Function definitions     //
// ---------------------------- //

// ------------------------ //
//     Process Schedule     //
// ------------------------ //
// Set draft values for all items and collects them
// into a doclist key in the config file
export async function processSchedule(config: any, configKey: string = "scheduled-docs", itemsKey: string = "docs") {
  
  console.log("=== Scheduled-docs ===")
  console.log("> Processing schedule ...")
  const draftAfterStr = config[configKey]["draft-after"];
  const timezone = config[configKey]["timezone"];
  
  let thresholdDate = new Date(0);
  if (draftAfterStr === "system-time") {
      thresholdDate = new Date();
  } else {
      thresholdDate = new Date(convertDateToISOFormat(draftAfterStr, timezone));
  }
  
  // Initialize empty object and counters
  let collectedItems = []
  let nDrafts = 0;
  let nNotDrafts = 0;
  
  // Recursively process the config object an apply getDraftVal to all items
  function processItemsKeys(element: any) {
    if (typeof element === 'object' && element !== null) {
      if (Array.isArray(element[itemsKey])) {
        element[itemsKey].forEach((item, index) => {
          if (item && typeof item === 'object') {
            item.draft = getDraftVal(item, thresholdDate, timezone);
            collectedItems.push(item);
            if (item.draft) {
                nDrafts++;
            } else {
                nNotDrafts++;
            }
          }
        });
      }
      // Recursively process each property if it's an object or array
      Object.entries(element).forEach(([key, value]) => {
        if (typeof value === 'object') {
          processItemsKeys(value);
        }
      });
    }
  }
  
  // Get draft values for each item
  function getDraftVal(item: any, thresholdDate: Date, timezone: string): boolean {
    // default to false
    let draftValue = false;
    const itemDate = new Date(convertDateToISOFormat(item.date, timezone));
      
    // override if using draft-after
    if (itemDate > thresholdDate) {
      draftValue = true;
    } 
    // override default and draft-after if draft value specified in _quarto.yml
    if (item.hasOwnProperty('draft')) {
      draftValue = item.draft;
    } 
    return draftValue;
  }
  
  // Process all 
  if (config[configKey]) {
    processItemsKeys(config[configKey]);
  }
  
  // append collected docs for easy downstream processing
  config[configKey].doclist = collectedItems;
  
  console.log(`  - ${nDrafts} items set to 'draft: true'.`);
  console.log(`  - ${nNotDrafts} items set to 'draft: false'.`);

  
  return config;
}


// ------------------------ //
//     Write Draft List     //
// ------------------------ //
// Write a draft list yaml file from doclist
export async function writeDraftList(config: any, configKey: string = "scheduled-docs", tempFilesDir: string) {
  console.log("> Making draft list ...")
  const draftHrefs: string[] = [];
  
  config[configKey].doclist?.forEach((item: any) => {
        if (item.draft) {
         draftHrefs.push(item.href);
        }
      });
  
  const draftList = {
    website: {
      drafts: draftHrefs
    }
  };
  
  const outputPath = join(Deno.cwd(), tempFilesDir, "draft-list.yml");
  await Deno.mkdir(tempFilesDir, { recursive: true });
  await Deno.writeTextFile(outputPath, stringify(draftList));
  console.log(`  - Created metadata file: ${outputPath}`);
}


// ---------------------------------- //
//     Remove Temporary Directory     //
// ---------------------------------- //
// Remove temp files generated during render
// Turned off if debug: true exists in config file.

export async function removeTempDir(config: any, configKey: string = "scheduled-docs", tempFilesDir: string) {
  
  if (!config[configKey].debug) {
    try {
      await Deno.remove(tempFilesDir, { recursive: true });
      console.log(`> Temporary directory '${tempFilesDir}' has been removed.`);
    } catch (error) {
      console.error(`> Error removing temporary directory '${tempFilesDir}': ${error}`);
    }
  } else {
    console.log(`> Debug mode is on. Temporary files can be viewed in '${tempFilesDir}'.`)
  }
}


// ----------------- //
//     Utilities     //
// ----------------- //
export async function readYML(path: string): Promise<any> {
  const yamlContent = await Deno.readTextFile(path);
  return parse(yamlContent);
}

function convertDateToISOFormat(dateStr: string, timezone: string): string {
    const [month, day, year] = dateStr.split('/').map(num => num.padStart(2, '0'));
    return `20${year}-${month}-${day}T00:00:00${timezone}`;
}
