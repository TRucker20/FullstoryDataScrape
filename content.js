// --- CONFIGURATION ---
// !!! YOU MUST REPLACE THIS with the actual CSS Selector you find using DevTools !!!
const TABLE_SELECTOR = 'table[data-testid="table"]'; 
// Selector for the button that controls the expanded/collapsed state.
const EXPAND_BUTTON_SELECTOR = '[data-testid="funnel-summary-expand"]'; 
// Selector for all individual step breakdown containers (boxes)
const STEP_BOX_SELECTOR = '[data-testid^="step-"]';

// --- HELPER FUNCTIONS ---

/**
 * Parses the current URL to extract the Funnel ID.
 * Assumes the URL format is similar to: https://app.fullstory.com/funnels/ABCDE12345/...
 */
function getFunnelIdFromUrl() {
  const currentUrl = window.location.href;
  const funnelMatch = currentUrl.match(/\/funnels\/details\/([a-zA-Z0-9]+)/);
  return funnelMatch && funnelMatch[1] ? funnelMatch[1] : 'UNKNOWN_ID';
}

/**
 * Function to check the DOM for the table selector repeatedly, handling dynamic content.
 */
function waitForElement(selector, timeout = 150000) { // Increased timeout for slow-loading SPAs
    return new Promise((resolve, reject) => {
        const intervalTime = 500; // Check every 500ms
        const startTime = Date.now();

        const check = () => {
            const element = document.querySelector(selector);
            if (element) {
                return resolve(element);
            }
            if (Date.now() - startTime >= timeout) {
                return reject(new Error(`Timeout: Element ${selector} not found after ${timeout / 1000}s.`));
            }
            setTimeout(check, intervalTime);
        };
        check();
    });
}
function expandButton() {
    const EXPAND_BUTTON_SELECTOR = '[data-testid="funnel-summary-expand"]'; // Replace with actual selector

    // Inside your scrapeTableData function, before waitForElement:
    const expandButton = document.querySelector(EXPAND_BUTTON_SELECTOR);

    if (expandButton) {
    console.log("Found expand button, clicking to reveal data...");
    expandButton.click(); // Programmatically click the button
    }
}
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/**
 * Scrapes the data table content once the element is found.
 */
// async function scrapeTableData(funnelId) {
//     // Array to hold the scraped data from ALL tables (flatted into one list)
//     const allTablesData = []; 
//     const TABLE_SELECTOR = 'table[data-testid="table"]'; // The stable selector

//     try {
//         // 1. Wait for ALL tables to appear and load their data
//         // (Assuming waitForElements is defined elsewhere and returns a NodeList)
//         const tableElements = await waitForElements(TABLE_SELECTOR); 
        
//         // 2. ITERATE THROUGH ALL FOUND TABLES
//         tableElements.forEach((table, index) => {
//         const tableData = [];
        
//         // Get the Step Context (e.g., "step-1-breakdown") for labeling
//         const parentBox = table.closest('[data-testid^="step-"]');
//         const stepId = parentBox ? parentBox.getAttribute('data-testid') : `Step-${index + 1}`;
        
//         // Add a header/separator row to identify the start of data for this step
//         tableData.push([`--- ${stepId.toUpperCase()} ---`]); 

//         // Extract Headers (from the <thead>)
//         const headers = Array.from(table.querySelectorAll('thead th')).map(h => h.innerText.trim());
//         tableData.push(["Metric", ...headers.slice(1)]); 

//         // 3. Extract Rows (from the <tbody>)
//         table.querySelectorAll('tbody tr').forEach(row => {
//             // Find all <td> elements and extract their text content
//             const rowData = Array.from(row.querySelectorAll('td')).map(cell => cell.innerText.trim());
//             tableData.push(rowData);
//         });

//         // Combine the collected data for this table with the main output array
//         allTablesData.push(...tableData);
//         });

//         return { 
//         funnelId: funnelId, 
//         data: allTablesData 
//         };
        
//     } catch (error) {
//         console.error(`Scraping failed for ${funnelId}:`, error.message);
//         return { 
//         funnelId: funnelId, 
//         error: error.message 
//         };
//     }
// }
function waitForDataReady(selector, timeout = 15000) { 
    return new Promise((resolve, reject) => {
        const intervalTime = 500;
        const startTime = Date.now();

        const check = () => {
            const elements = document.querySelectorAll(STEP_BOX_SELECTOR); // Targeting the boxes
            // Check if we found step boxes AND if the first box contains the table selector
            if (elements.length > 0 && elements[0].querySelector(TABLE_SELECTOR)) {
                return resolve(elements); // Resolve with the list of box elements
            }
            if (Date.now() - startTime >= timeout) {
                return reject(new Error(`Timeout: No step boxes found containing tables after ${timeout / 1000}s.`));
            }
            setTimeout(check, intervalTime);
        };
        check();
    });
}
function extractMobileUsers(rawData) {
    const results = [];
    let currentStep = null;
    let mobileIndex = 1; // Assuming 'Device Type - Mobile' is the second data column (index 1)

    for (const row of rawData) {
        // 1. Identify the start of a new step
        if (Array.isArray(row) && row[0] && row[0].startsWith('--- STEP-')) {
            currentStep = row[0].substring(4, row[0].length - 4); // Extracts 'STEP-X-BREAKDOWN'
        }
        
        // 2. Locate the 'Users' row
        // Check if the current row starts with 'Users' AND a step has been defined
        if (currentStep && Array.isArray(row) && row[0] === 'Users') {
            const mobileUsers = row[mobileIndex];

            results.push({
                step: currentStep,
                mobileCount: mobileUsers
            });
            // Reset currentStep after processing the header and the Users row 
            // to ensure we only capture the metric once per step.
            currentStep = null; 
        }
    }
    return results;
}
async function executeHybridClickSequence(button) {
    const doubleClickInterval = 100; // 100ms delay between the two activations
    
    // Step A: Focus the button so it can receive keyboard events
    button.focus();
    
    // Dispatch events directly on the button
    const dispatchTarget = button; 
    
    // Keyboard Event Details
    const keyboardDetails = {
        key: ' ', code: 'Space', keyCode: 32, charCode: 32, which: 32,
        bubbles: true, cancelable: true, view: window
    };

    // --- FIRST ACTIVATION (Spacebar Press) ---
    const keyDown1 = new KeyboardEvent('keydown', keyboardDetails);
    dispatchTarget.dispatchEvent(keyDown1);
    const keyUp1 = new KeyboardEvent('keyup', keyboardDetails);
    dispatchTarget.dispatchEvent(keyUp1);
    
    console.log(`Attempt ${currentAttempt}: Spacebar Press 1/2 dispatched. Waiting ${doubleClickInterval}ms...`);
    
    await delay(doubleClickInterval); // Wait for the short interval

    // --- SECOND ACTIVATION (Full Mouse Click Sequence) ---
    
    // 1. Mouse Down
    const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
    dispatchTarget.dispatchEvent(mouseDown);

    // 2. Mouse Up
    const mouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window });
    dispatchTarget.dispatchEvent(mouseUp);

    // 3. Click (The final event often checked by frameworks)
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    dispatchTarget.dispatchEvent(clickEvent);
}
function setTargetDateRanges(dateRanges) {
    const dateInputs = document.querySelectorAll(`[placeholder="MM/DD/YYYY"]`);
    const applyButton = document.querySelector('[data-testid="button-on-apply"]');
    if (dateInputs.length !== 4) {
        console.log(`⚠️ Found ${dateInputs.length} inputs, expected 4. Cannot set ranges.`);
        return;
    }

    // Define the two date ranges (MM/DD/YYYY format for robustness)
    const dateRangesconst = dateRanges;
    console.log(dateRangesconst);
    // const dateRanges = [
    //     "11/01/2025", // Range 1 Start
    //     "11/30/2025", // Range 1 End
    //     "11/15/2024", // Range 2 Start
    //     "11/30/2024"  // Range 2 End
    // ];

    // Enter Key Details
    const enterKeyDetails = {
        key: 'Enter', code: 'Enter', keyCode: 13, charCode: 0, which: 13,
        bubbles: true, cancelable: true, view: window
    };
    
    // Use an async loop to introduce small delays for better event handling
    for (let index = 0; index < dateInputs.length; index++) {
        const input = dateInputs[index];
        const newValue = dateRangesconst[index];
        
        // 1. Set Value
        input.value = newValue;
        
        // 2. Dispatch 'input' and 'change' events
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
        const changeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(changeEvent);

        // 3. Simulate Enter Key Press/Release
        input.focus(); // Ensure the current input is focused
        // Small delay before key press
        const keyDown = new KeyboardEvent('keydown', enterKeyDetails);
        input.dispatchEvent(keyDown);
        const keyUp = new KeyboardEvent('keyup', enterKeyDetails);
        input.dispatchEvent(keyUp);
        
        // updateLog(`✅ Set Input ${index + 1}: ${newValue} & Dispatched Enter.`);
         // Small delay before moving to the next input
    }
    executeHybridClickSequence(applyButton);
    console.log('🎉 **SUCCESS!** All four date range inputs have been set and confirmed with Enter events.');
}

/**
 * Initiates a polling mechanism: checks for the form, clicks if not found, and retries.
 */
const FORM_SELECTOR = 'form[name="target-form-to-show-up"]'; 
const MAX_ATTEMPTS = 10;
const POLLING_INTERVAL = 2000; // Time between click retries (in ms)

// Global references for DOM elements and state
let currentAttempt = 0;
let pollingIntervalId = null;
// async function clickPrimaryRangeButton() {
//     // Reset state for a new run
//     await delay(1000);
//     if (pollingIntervalId) { clearInterval(pollingIntervalId); }
//     currentAttempt = 0;

//     const targetTestId = 'button-primary-range';
//     const button = document.querySelector(`[data-testid="${targetTestId}"]`);
//     const formSelector ='[data-testid="popover"]';

//     // if (!button) {
//     //     console.log("Could not find button")
//     //     return;
//     // }

//     // --- POLLING LOOP ---
//     const pollForForm = () => {
//         currentAttempt++;
        
//         const form = document.querySelector(formSelector);
//         (async () => {
//             const form = document.querySelector(formSelector);
    
//             if (form) {
//                 // SUCCESS CONDITION: Form found
//                 setTargetDateRanges();
//                 clearInterval(pollingIntervalId);
//                 return;
//             }
    
//             if (currentAttempt > MAX_ATTEMPTS) {
//                 // FAILURE CONDITION: Max attempts reached
//                 clearInterval(pollingIntervalId);
//                 return;
//             }
    
//             // --- ACTION: Execute the click if form is not present ---
            
//             // 1. AWAIT the click sequence to ensure it finishes before scraping
//             await executeHybridClickSequence(button);
            
//             const funnelId = getFunnelIdFromUrl();
            
//             // 2. NOW you can safely AWAIT the asynchronous scrape function
//             const scrapedData = await scrapeTableData(funnelId);
            
//             console.log(scrapedData);
            
//             // Note: The original function returned the data, but in a content script 
//             // you would typically send it to the background script here:
//             // chrome.runtime.sendMessage({ action: "scrapedData", data: scrapedData });
    
//         })();
//     }
//     // Run the function immediately, then start the interval timer
//     pollForForm();
//     pollingIntervalId = setInterval(pollForForm, POLLING_INTERVAL);
// }
async function clickPrimaryRangeButton(dateRanges) {
    // 1. Return a Promise that will resolve with the scraped data later
    const maxAttempts = 10;
    const interval = 2000;
    return new Promise(async (resolve, reject) => {
        
        let pollingIntervalId = null;
        let currentAttempt = 0;

        // --- Initialization ---
        await delay(1000);
        
        const targetTestId = 'button-primary-range';
        const button = document.querySelector(`[data-testid="${targetTestId}"]`);
        const formSelector = '[data-testid="popover"]';

        // if (!button) {
        //      console.log("Could not find button");
        //      return reject(new Error("Target button not found.")); // Reject immediately
        // }

        // --- POLLING LOOP Definition ---
        const pollForForm = () => {
            currentAttempt++;
            
            // IIAFE allows us to use await inside this synchronous setInterval callback
            (async () => {
                const form = document.querySelector(formSelector);
        
                if (form) {
                    // SUCCESS CONDITION: Form found
                    clearInterval(pollingIntervalId);
                    
                    // Execute necessary final steps
                    await setTargetDateRanges(dateRanges);
                    await delay(1000)
                    const funnelId = getFunnelIdFromUrl();
                    
                    // 2. AWAIT the scrape and RESOLVE the outer Promise
                    const scrapedData = await scrapeTableData(funnelId);
                    
                    console.log("Scraping complete. Resolving Promise.");
                    resolve(scrapedData); // <-- THIS RETURNS THE DATA to the function's caller
                    return;
                }
        
                if (currentAttempt > maxAttempts) {
                    // FAILURE CONDITION: Max attempts reached
                    clearInterval(pollingIntervalId);
                    console.error(`Max attempts (${maxAttempts}) reached. Form not found.`);
                    return reject(new Error("Polling failed: Target form not found.")); // Reject the Promise
                }
        
                // --- ACTION: Execute the click if form is not present ---
                console.log(`Attempt ${currentAttempt}: Form not found. Executing click sequence.`);
                await executeHybridClickSequence(button);
    
            })();
        };

        // Run the function immediately, then start the interval timer
        pollForForm();
        pollingIntervalId = setInterval(pollForForm, interval);
    });
}

// function clickPrimaryRangeButton() {
//     const targetTestId = 'button-primary-range';
    
//     // 1. Find the element using the data-testid attribute selector
//     const button = document.querySelector(`[data-testid="${targetTestId}"]`);

//     if (button) {
//         console.log("Found Primary range buton");
//         button.scrollIntoView({ behavior: 'smooth', block: 'center' });
//         // 2. Define a handler to confirm the script-generated click
//         const clickHandler = (event) => {
//             event.stopPropagation();
//             // updateLog('🎉 **SUCCESS!** Script-simulated click event received by the button.');
            
//             // Clean up the temporary listener after the first successful click
//             button.removeEventListener('click', clickHandler);
//         };

//         // Attach the temporary handler to verify the click() method worked
//         button.addEventListener('click', clickHandler);
//         button.focus()
//         // 3. Simulate the click
//         setTimeout(async () => { // Using async here allows us to use await inside
            
//             // Step A: Focus the button so it can receive keyboard events
//             button.focus();
            
//             // *** CHANGE: Dispatch the event on the immediate parent element, which is the actual target for delegation ***
//             const dispatchTarget = button.parentElement || button;
            
//             const eventDetails = {
//                 key: ' ', // Use Spacebar
//                 code: 'Space',
//                 keyCode: 32,
//                 charCode: 32,
//                 which: 32,
//                 bubbles: true,
//                 cancelable: true,
//                 view: window
//             };

//             // --- FIRST ACTIVATION ---
//             const keyDown1 = new KeyboardEvent('keydown', eventDetails);
//             dispatchTarget.dispatchEvent(keyDown1);
//             const keyUp1 = new KeyboardEvent('keyup', eventDetails);
//             dispatchTarget.dispatchEvent(keyUp1);
//             updateLog(`Spacebar Press 1/2 dispatched on parent. Waiting ${doubleClickInterval}ms...`);
            
//             await delay(doubleClickInterval); // Wait for the short interval

//             // --- SECOND ACTIVATION ---
//             const keyDown2 = new KeyboardEvent('keydown', eventDetails);
//             dispatchTarget.dispatchEvent(keyDown2);
//             const keyUp2 = new KeyboardEvent('keyup', eventDetails);
//             dispatchTarget.dispatchEvent(keyUp2);
//             updateLog('Spacebar Press 2/2 dispatched on parent. Check application now.');


//             // Manual fallback to re-enable button
//             if (activateButton && activateButton.disabled) {
//                 activateButton.disabled = false;
//                 activateButton.textContent = 'Run JavaScript Click Function';
//             }
//         }, initialDelay);
//     } else {
//         console.log("Did not find Primary Range Button!");
//     }
// }
/**
 * Scrapes the data from ALL identified data tables, structuring the output.
 */
async function scrapeTableData(funnelId) {
  const allTablesData = []; 
  
  try {
    // 1. WAIT FOR AND FIND ALL STEP BOXES (post-click)
    // The result is now the list of DIVs (the box elements).
    const stepBoxes = await waitForDataReady(STEP_BOX_SELECTOR); 
    
    // 2. ITERATE THROUGH ALL FOUND BOXES and scrape the table inside
    stepBoxes.forEach((box, index) => {
      const tableData = [];
      const table = box.querySelector(TABLE_SELECTOR); // Find the table inside this specific box
      
      // Get the Step Context (e.g., "step-1-breakdown") directly from the box
      const stepId = box.getAttribute('data-testid') || `Step-${index + 1}`;
      
      // Check if the table exists inside the box before scraping
      if (!table) {
          console.warn(`Content Script: Step box ${stepId} found but no table inside.`);
          return;
      }
      
      tableData.push([`--- ${stepId.toUpperCase()} ---`]); 

      const headers = Array.from(table.querySelectorAll('thead th')).map(h => h.innerText.trim());
      tableData.push([headers.slice(0)]); 

      table.querySelectorAll('tr').forEach(row => {
        const rowData = Array.from(row.querySelectorAll('td')).map(cell => cell.innerText.trim());
        if(rowData.length != 0){
            tableData.push(rowData);
        }
        
      });

      allTablesData.push(tableData);
    });
    
    console.log(`Content Script: Scraping successful for ${funnelId}`);

    return { 
      funnelId: funnelId, 
      data: allTablesData 
    };
    
  } catch (error) {
    console.error(`Content Script: Scraping failed for ${funnelId}:`, error.message);
    return { 
      funnelId: funnelId, 
      error: error.message 
    };
  }
}

// --- MESSAGE LISTENER ---

// Listener waits for the command from the background script
chrome.runtime.onMessage.addListener((request,sender, sendResponse) => {
  if (request.action === "scrapeFunnel") {
    console.log("Here");
    const funnelId = getFunnelIdFromUrl();
    setTimeout(() => {
        clickPrimaryRangeButton(request.value).then(sendResponse);
     }, 1000);
    // console.log("Content Script: 500ms pre-click delay finished.");
    // Perform the synthetic click
    // expandButton();
    // Call the async scrape function and send the response once complete
    // scrapeTableData(funnelId).then(sendResponse);
    // sendResponse({ status: "Got to here" })
    return true; // Return true to indicate the response will be sent asynchronously
  }
});

// console.log("TEST CONTENT SCRIPT: INITIALIZING LISTENER.");

// function getFunnelIdFromUrl() {
//   const currentUrl = window.location.href;
//   const funnelMatch = currentUrl.match(/\/funnels\/details\/([a-zA-Z0-9]+)\//); 
//   return funnelMatch && funnelMatch[1] ? funnelMatch[1] : 'UNKNOWN_ID';
// }

// // Listener: This is the only function that needs to run for the retry to succeed.
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "scrapeFunnel") {
//     const funnelId = getFunnelIdFromUrl();
    
//     // CRITICAL: Log a success message to prove the message was received
//     console.log(`TEST CONTENT SCRIPT: Message RECEIVED successfully for ID: ${funnelId}`);
    
//     // Respond immediately with dummy data to satisfy the background script
//     sendResponse({ 
//       funnelId: funnelId, 
//       data: ["SUCCESS: Listener registered and responded."],
//       error: null 
//     });
    
//     return true; // Keep the connection open for async response
//   }
// });