// --- CONFIGURATION ---
// const FUNNEL_IDS = [
//     "XuZYJWXN1yiA", // REPLACE with your actual FullStory Funnel IDs
//     "c9mgg9PQIE7F",
//     // "FGHIJ67890",
//     // Add more IDs here...
//   ];
  const FUNNEL_IDS = [
    "yE1Z9yC2QKpN",
    "BX9hGsxXdQRw",
    "5M3cZUNOETCp",
    "0cefYCcDdKOI",
    "cMB0WVfriDTa",
  ]
  const FULLSTORY_BASE_URL = "https://app.fullstory.com/ui/12ZXGN/funnels/details/";
  const scrapeResults = [];
  
  // --- MAIN SCRAPING LOOP ---
  
  /**
   * Orchestrates the scraping of all funnels in the FUNNEL_IDS list.
   */
  function convertArrayToCSV(data) {
    if (!data || data.length === 0) return '';
    
    let csv = '';

    data.forEach(row => {
        // 1. Handle rows that are markers (like '--- STEP-X-BREAKDOWN ---')
        if (row.length === 1 && row[0].startsWith('--- STEP-')) {
            // Extract the clean title (e.g., 'STEP-1-BREAKDOWN') and add it as a separator row
            const stepTitle = row[0].replace(/---|/g, '').trim(); 
            // csv += `\n${stepTitle}\\r\\n`;
            return;
        }
        // console.log(row)
        // 2. Handle regular data rows
        row.slice(1).forEach(value =>{
          const values = value.map(val => {
            const strValue = ('' + val).trim();
            
            // Fix: Check if the value is numeric (allowing commas or dots)
            if (strValue.match(/^-?[\d,.\s]+%?$/)) {
                 // CRUCIAL: Strip commas from numbers before they are written to CSV
                 return strValue.replace(/,/g, '');
            }

            // Normal CSV escaping for non-numeric strings
            const escaped = strValue.replace(/"/g, '""');
            
            // Check if value needs quotes (contains literal commas)
            if (escaped.includes(',') || escaped.match(/^\s/) || escaped.match(/\s$/)) {
                return `""${escaped}""`;
            }
            return escaped;
          });
          csv += values.join(',') + '\n';
        })
        
    });
    
    return csv;
}
// function convertArrayToCSV(data) {
//     if (!data || data.length === 0) return '';
    
//     const headers = Object.keys(data[0]);
    
//     // Create the header row
//     let csv = headers.join(',') + '\n';

//     // Create the data rows
//     data.forEach(row => {
//         const values = headers.map(header => {
//             const value = row[header];
//             // Escape double quotes and surround with quotes if value contains comma
//             const escaped = ('' + value).replace(/"/g, '""');
//             return `"${escaped}"`;
//         });
//         csv += values.join(',') + '\n';
//     });
    
//     return csv;
// }

/**
 * Triggers a browser download of the CSV string.
 */
function downloadCSV(csvString, filename) {
  // 1. Encode the CSV string for inclusion in the URL
  // encodeURIComponent is crucial for handling commas and quotes in the CSV data
  const encodedCsv = encodeURIComponent(csvString);
  
  // 2. Create the Data URL
  const dataUrl = 'data:text/csv;charset=utf-8,' + encodedCsv;
  
  // 3. Initiate the download using the Chrome Downloads API
  chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false // Download file without showing save dialog
  }, (downloadId) => {
      if (chrome.runtime.lastError) {
          console.error("Error initiating download:", chrome.runtime.lastError.message);
      } else {
          console.log(`Download initiated with ID: ${downloadId}`);
      }
  });
  // No need for URL.revokeObjectURL here, as no object URL was created.
}

  async function scrapeAllFunnels(org_id,funnel_names,ids,dateRanges,) {
    console.log("Starting FullStory scraping process...");
    let finalcsv = ''
    const baseURL = `https://app.fullstory.com/ui/${org_id}/funnels/details/`
    for(let i = 0; i < ids.length; i++) {
      const url = baseURL + ids[i] + "/";
      console.log(`Navigating to Funnel ID: ${ids[i]}`);
      
      // 1. Open the tab, wait for load, and send scrape command.
      const result = await openTabAndWaitForScrape(url,ids[i],dateRanges);
      
      // 2. Process the result
      if (result && result.data && result.funnelId) {
        scrapeResults.push(result);
        const funneldata = result.data
        console.log(`✅ Successfully scraped ${result.data.length} rows from ${ids[i]}`);
        if (funneldata.length > 0) {
          const csvContent = convertArrayToCSV(funneldata);
          // const organization = '12ZXGN';
          const funnelIdRow = `\nOrg_${org_id},Date_Range(${ids[i]}_${dateRanges},Date_Range${dateRanges[0]}_${dateRanges[1]}\n`;
          finalcsv += funnelIdRow;
          const funnelNameRow = `${funnel_names[i]},----,----\n`;
          finalcsv += funnelNameRow;
          finalcsv += csvContent;
          
          
          
          // console.log(`🎉 CSV Download initiated for Funnel ID: ${ids[i]}`);
        } else {
            console.warn(`No valid user data was extracted for Funnel ID: ${ids[i]}. CSV download skipped.`);
        }
      } else {
        console.error(`❌ Failed or timed out on ${ids[i]}. Error: ${result ? result.error : 'Unknown'}`);
      }
      
      // Throttle: Wait 1 second before opening the next tab to be polite to the server
      await new Promise(r => setTimeout(r, 1000));
    }
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
    const filename = `FullStory_Org_${org_id}_Summary_${timestamp}.csv`;
    downloadCSV(finalcsv, filename);
    console.log("--- All Scraping Complete ---");
    console.log("Collected results:", scrapeResults);
    // TODO: Add logic here to download scrapeResults as a CSV or JSON file.
  }
  
  /**
   * Opens a tab, waits for it to fully load, sends the scrape command, and returns the result.
   */
//   function sendScrapeMessageWithRetry(tabId, funnelId, attempt = 1, maxAttempts = 10) {
//     return new Promise(resolve => {
//         // 1. Attempt to send the message
//         chrome.tabs.sendMessage(tabId, { action: "scrapeFunnel" }, (response) => {
//             if (chrome.runtime.lastError && attempt < maxAttempts) {
//                 // Error encountered (e.g., "Receiving end does not exist)
//                 // --- DEBUG CHANGE: Use console.log for visibility ---
//                 console.log(`[RETRY] Tab ${tabId}: Attempt ${attempt} failed. Retrying...`);
                
//                 // Retry after 500ms
//                 setTimeout(() => {
//                     sendScrapeMessageWithRetry(tabId, funnelId, attempt + 1, maxAttempts)
//                         .then(resolve);
//                 }, 500);
//                 return; // Exit the current attempt
//             }

//             if (chrome.runtime.lastError) {
//                 // Max attempts reached, still failing
//                 console.error(`[RETRY FAILED] Tab ${tabId}: Failed to connect to content script after ${maxAttempts} attempts.`);
//                 resolve({ funnelId, error: "Content script failed to initialize or respond." });
//                 return;
//             }
            
//             // Success: Content script received message and responded
//             resolve(response);
//         });
//     });
// }

  function openTabAndWaitForScrape(url,funnelId,dateRanges) {
    return new Promise(resolve => {
      // Open the new tab (active: false keeps it in the background)
      chrome.tabs.create({ url: url, active: false }, (tab) => {
        const tabId = tab.id;
        console.log("Checking here.")
        const onUpdatedListener = (updatedTabId, changeInfo) => {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
              // Stop listening for the load event
              chrome.tabs.onUpdated.removeListener(onUpdatedListener); 
              
              // --- DIRECT MESSAGE SEND (NO RETRY) ---
              chrome.tabs.sendMessage(tabId, { action: "scrapeFunnel" ,value:dateRanges }, (response) => {
                  
                  chrome.tabs.remove(tabId); // TEMPORARILY DISABLED
                  
                  // Handle timing failure gracefully
                  if (chrome.runtime.lastError) {
                      console.error(`[ERROR] Tab ${tabId}: Failed to connect to content script.`, chrome.runtime.lastError.message);
                      resolve({ funnelId, error: "Content script did not initialize or respond immediately." });
                      return;
                  }
                //   console.log(response.status)
                  resolve(response);
              });
              // --- END DIRECT MESSAGE SEND ---
            }
          };
        // const onUpdatedListener = (updatedTabId, changeInfo) => {
        //     if (updatedTabId === tabId && changeInfo.status === 'complete') {
        //       // Stop listening for the load event
        //       chrome.tabs.onUpdated.removeListener(onUpdatedListener); 
              
        //       // CRITICAL: Now, retry sending the message until the content script is ready
        //       sendScrapeMessageWithRetry(tabId, funnelId)
        //         .then((response) => {
        //             // clearTimeout(timeoutId);
                    
        //             // chrome.tabs.remove(tabId); // TEMPORARILY DISABLED
        //             console.log(response.status)
        //             resolve(response);
        //         });
        //     }
        //   };
  
        // Start listening for the tab update event
        chrome.tabs.onUpdated.addListener(onUpdatedListener);
      });
    });
  }
  
  // --- OPTIONAL: Listener to start the scrape via a message (e.g., from a popup.js) ---
  
  chrome.runtime.onMessage.addListener((request,sender, sendResponse) => {
    if (request.action === "startScrapeAll") {
    //   scrapeAllFunnels(FUNNEL_IDS);
      console.log(request.value);
      sendResponse({ status: "Scraping started." });
      const baseURL = `https://app.fullstory.com/ui/${request.org_id}/funnels/details/`
      scrapeAllFunnels(request.org_id,request.funnel_names,request.funnel_ids,request.value);
      sendResponse({status: "Scraping Complete."});
      return true; // Keep the message channel open for async response
    }
  });
  
  
  // For testing, you might just run it directly on extension launch or uncomment the listener above
  // scrapeAllFunnels(FUNNEL_IDS);