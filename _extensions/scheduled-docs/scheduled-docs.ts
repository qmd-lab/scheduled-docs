// Import external libraries
import { parse, stringify } from "https://deno.land/std/yaml/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";



// --------------------- //
//     Propagate Keys    //
// --------------------- //
// Propagate the unignored keys into nested objects, being sure to not overwrite
// any keys of the same name.

export function propagateKeys(obj: any, parentProps: Record<string, string> = {}, ignoreKeys = ['debug', 'draft-after', 'timezone', 'this-week', 'grouping-label']) {
    if (Array.isArray(obj)) {
        obj.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                propagateKeys(item, parentProps, ignoreKeys);
            }
        });
    } else if (typeof obj === 'object' && obj !== null) {
        const newProps = { ...parentProps };
        
        Object.keys(obj).forEach(key => {
            if (!ignoreKeys.includes(key)) {
                if (typeof obj[key] === 'string') {
                    newProps[key] = obj[key];
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    propagateKeys(obj[key], newProps, ignoreKeys);
                }
            }
        });

        Object.keys(newProps).forEach(key => {
            if (obj[key] === undefined) {
                obj[key] = newProps[key];
            }
        });
    }
}


// ------------------------ //
//     Process Schedule     //
// ------------------------ //
// Set draft values for all items and collects them
// into a doclist key in the config file

export function processSchedule(obj, itemsKey: string = "docs") {
  
  console.log("> Processing schedule ...")
  const draftAfterStr = obj["draft-after"];
  const timezone = obj["timezone"];
  
  let thresholdDate = new Date(0);
  if (draftAfterStr === "system-time") {
      thresholdDate = new Date();
  } else {
      thresholdDate = new Date(convertDateToISOFormat(draftAfterStr, timezone));
  }
  
  let collectedItems = []
  let nDrafts = 0;
  let nNotDrafts = 0;
  
  // recursively process the config object and apply getDraftVal to all items
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
      // recurse if it's an object
      Object.entries(element).forEach(([key, value]) => {
        if (typeof value === 'object') {
          processItemsKeys(value);
        }
      });
    }
  }
  
  // get draft values for each item
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
  
  // run recursive function
  processItemsKeys(obj);
  
  // append collected docs for easy downstream processing
  obj.doclist = collectedItems;
  
  console.log(`  - ${nDrafts} docs set to 'draft: true'.`);
  console.log(`  - ${nNotDrafts} docs set to 'draft: false'.`);

  //return config;
}


// ------------------------ //
//     Write Draft List     //
// ------------------------ //
// Write a draft list yaml file from doclist

export async function writeDraftList(obj: any, tempFilesDir: string) {
  console.log("> Making draft list ...")
  const draftHrefs: string[] = [];
  
  obj.doclist?.forEach((item: any) => {
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
  console.log(`  - Created file: ${outputPath}`);
}

// -------------------------------- //
//     Write scheduled-docs.yml     //
// -------------------------------- //
// Write the contents of scheduled-docs.yml to a file.

export async function writeScheduledDocs(obj: any, tempFilesDir: string) {
  console.log("> Making scheduled docs yml ...")
  
  // make a deep copy without any anchors / aliases so that stringify will
  // create a yml version that can be parsed by ejs easily
  const objNoAA = deepCopy(obj);
  
  const outputPath = join(Deno.cwd(), tempFilesDir, "scheduled-docs.yml");
  await Deno.mkdir(tempFilesDir, { recursive: true });
  await Deno.writeTextFile(outputPath, stringify(objNoAA));
  console.log(`  - Created file: ${outputPath}`);
}


// ------------------------------- //
//     Write listing contents      //
// ------------------------------- //
// Write the listing contents for all sets of docs with a defined group

export async function writeListingContents(obj: any, tempFilesDir: string ) {
  console.log("> Making listing contents files ...")
  const groupedDocs: Record<string, any[]> = {};
  
  // use a `grouping-label` if defined, otherwise use `type`
  const type = obj['grouping-label'] ? obj['grouping-label'] : 'type';

  // group documents by their type
  for (const doc of obj.doclist) {
    if (!doc[type] || !doc.href) {
      continue;
    }
    const typeKey = doc[type].replace(" ", "-").toLowerCase();
    if (!groupedDocs[typeKey]) {
      groupedDocs[typeKey] = [];
    }
    groupedDocs[typeKey].push({ path: `../${doc.href}` });
  }
  
  if (Object.keys(groupedDocs).length === 0) {
    console.log("  - No listing groups found");
  } else {
    for (const [typeKey, items] of Object.entries(groupedDocs)) {
      const outputPath = join(Deno.cwd(), tempFilesDir, `${typeKey}-docs.yml`);
      await Deno.mkdir(tempFilesDir, { recursive: true });
      await Deno.writeTextFile(outputPath, stringify(items));
      console.log(`Created file: ${outputPath}`);
    }
  }
}
  

  
// --------------------------------- //
//    Remove Temporary Directory     //
// --------------------------------- //
// Remove temp files generated during render
// Turned off if debug: true exists in config file.

export async function removeTempDir(obj: any, tempFilesDir: string) {
  
  if (!obj.debug) {
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
export async function readYML(ymlPath: string, scheduledDocsKey: string): Promise<any> {
  const yamlContent = await Deno.readTextFile(ymlPath);
  const scheduledDocs = parse(yamlContent)[scheduledDocsKey];
  return scheduledDocs;
}

function convertDateToISOFormat(dateStr: string, timezone: string): string {
    const [month, day, year] = dateStr.split('/').map(num => num.padStart(2, '0'));
    return `20${year}-${month}-${day}T00:00:00${timezone}`;
}

function deepCopy(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    let temp = obj.constructor();
    for (let key in obj) {
        temp[key] = deepCopy(obj[key]);
    }
    return temp;
}
