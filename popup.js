document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startScrapeButton');
    const statusDiv = document.getElementById('status');
    function getManualDateRanges() {
        const ids = ['input-r1-start', 'input-r1-end', 'input-r2-start', 'input-r2-end'];
        const values = [];
    
        for (const id of ids) {
            const input = document.getElementById(id);
            if (!input || !input.value.trim()) {
                console.log(`❌ Error: User input '${id}' is missing or empty. Please fill all four fields.`);
                return null;
            }
            values.push(input.value.trim());
        }
        return values;
    }
    startButton.addEventListener('click', () => {
        statusDiv.innerText = "Scraping started... Check console for progress.";
        startButton.disabled = true;
        console.log("Clicked");
        // Send a message to the background script to start the orchestration
        chrome.runtime.sendMessage({ action: "startScrapeAll",value: getManualDateRanges(),funnel_ids:document.getElementById('funnel-id-1').value.trim().split(','),org_id:document.getElementById('org-id-1').value.trim(),funnel_names:'Checkout Flow - Past 30 Days + YoY (Channel - Paid),Checkout Flow - Past 30 Days + YoY (Channel Type - Engagement),Checkout Flow - Past 30 Days + YoY (Channel Type - Organic),Checkout Flow - Past 30 Days + YoY (Device Type - Desktop and Tablet),Checkout Flow - Past 30 Days + YoY (Device Type - Mobile),HP -> PDP -> Checkout Flow - Past 30 Days + YoY (Channel - Paid),HP -> PDP -> Checkout Flow - Past 30 Days + YoY (Channel Type - Engagement),HP -> PDP -> Checkout Flow - Past 30 Days + YoY (Channel Type - Organic),HP -> PDP -> Checkout Flow - Past 30 Days + YoY (Device Type - Desktop and Tablet),HP -> PDP -> Checkout Flow - Past 30 Days + YoY (Device Type - Mobile),HP -> PLP -> PDP -> Checkout Flow - Past 30 Days + YoY (Channel - Paid),HP -> PLP -> PDP -> Checkout Flow - Past 30 Days + YoY (Channel Type - Engagement),HP -> PLP -> PDP -> Checkout Flow - Past 30 Days + YoY (Channel Type - Organic),HP -> PLP -> PDP -> Checkout Flow - Past 30 Days + YoY (Device Type - Desktop and Tablet),HP -> PLP -> PDP -> Checkout Flow - Past 30 Days + YoY (Device Type - Mobile),PDP -> Checkout Flow - Past 30 Days + YoY (Channel - Paid),PDP -> Checkout Flow - Past 30 Days + YoY (Channel Type - Engagement),PDP -> Checkout Flow - Past 30 Days + YoY (Channel Type - Organic),PDP -> Checkout Flow - Past 30 Days + YoY (Device Type - Desktop and Tablet),PDP -> Checkout Flow - Past 30 Days + YoY (Device Type - Mobile),PLP -> PDP -> Checkout Flow - Past 30 Days + YoY (Channel - Paid),PLP -> PDP -> Checkout Flow - Past 30 Days + YoY (Channel Type - Engagement),PLP -> PDP -> Checkout Flow - Past 30 Days + YoY (Channel Type - Organic),PLP -> PDP -> Checkout Flow - Past 30 Days + YoY (Device Type - Desktop and Tablet),PLP -> PDP -> Checkout Flow - Past 30 Days + YoY (Device Type - Mobile)'.split(',')}, (response) => {
            if (chrome.runtime.lastError) {
                statusDiv.innerText = "Error communicating with background script.";
                startButton.disabled = false;
                return;
            }
            if (response && response.status) {
                console.log(response.status);
                
                statusDiv.innerText = response.status;
            }
            
            // Note: The background script will run in the background. 
            // The final results will be logged to the background console.
        });
    });

    // You can add logic here to fetch and display the final aggregated results 
    // from chrome.storage once the background script finishes and saves them.
});