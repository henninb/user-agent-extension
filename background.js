const RULE_ID = 1;

// Icon paths
const ICONS_DEFAULT = {
  16: 'images/icon16.png',
  48: 'images/icon48.png',
  128: 'images/icon128.png'
};

const ICONS_ACTIVE = {
  16: 'images/icon16_active.png',
  48: 'images/icon48_active.png',
  128: 'images/icon128_active.png'
};

// Set icon to active or default state
function setIconState(active) {
  chrome.action.setIcon({ path: active ? ICONS_ACTIVE : ICONS_DEFAULT });
  console.log('[UA Extension] Icon set to:', active ? 'active' : 'default');
}

// Apply headers using declarativeNetRequest
async function applyHeaders(userAgent, headerName, headerValue) {
  console.log('[UA Extension] Applying headers:', { userAgent, headerName, headerValue });

  try {
    // Remove existing rule first
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID]
    });

    // Build the request headers array
    const requestHeaders = [];

    if (userAgent) {
      requestHeaders.push({
        header: 'User-Agent',
        operation: 'set',
        value: userAgent
      });
    }

    if (headerName && headerValue) {
      requestHeaders.push({
        header: headerName,
        operation: 'set',
        value: headerValue
      });
    }

    if (requestHeaders.length > 0) {
      // Add new rule to modify headers
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [{
          id: RULE_ID,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: requestHeaders
          },
          condition: {
            urlFilter: '|http',
            resourceTypes: [
              'main_frame',
              'sub_frame',
              'stylesheet',
              'script',
              'image',
              'font',
              'object',
              'xmlhttprequest',
              'ping',
              'media',
              'websocket',
              'other'
            ]
          }
        }]
      });

      console.log('[UA Extension] Rules applied successfully');
      setIconState(true);
    } else {
      setIconState(false);
    }

    return true;
  } catch (error) {
    console.error('[UA Extension] Error applying rules:', error);
    throw error;
  }
}

// Clear all header rules
async function clearHeaders() {
  console.log('[UA Extension] Clearing headers');

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID]
    });
    console.log('[UA Extension] Rules cleared');
    setIconState(false);
    return true;
  } catch (error) {
    console.error('[UA Extension] Error clearing rules:', error);
    throw error;
  }
}

// Apply rules from storage
async function applyFromStorage() {
  const data = await chrome.storage.local.get(['customUserAgent', 'customHeaderName', 'customHeaderValue', 'persistEnabled']);
  console.log('[UA Extension] Applying from storage:', data);

  if (data.persistEnabled && (data.customUserAgent || data.customHeaderName)) {
    await applyHeaders(data.customUserAgent, data.customHeaderName, data.customHeaderValue);
  } else {
    await clearHeaders();
  }
}

// Listen for storage changes - this ensures rules are applied even if message fails
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    console.log('[UA Extension] Storage changed:', changes);
    applyFromStorage();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[UA Extension] Received message:', message);

  if (message.action === 'applyHeaders') {
    applyHeaders(message.userAgent, message.headerName, message.headerValue)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'applyUserAgent') {
    applyHeaders(message.userAgent, null, null)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'clearHeaders' || message.action === 'clearUserAgent') {
    clearHeaders()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'getStatus') {
    chrome.storage.local.get(['customUserAgent', 'customHeaderName', 'customHeaderValue', 'persistEnabled'], (data) => {
      sendResponse(data);
    });
    return true;
  }
});

// On startup, restore persisted headers
chrome.runtime.onStartup.addListener(() => {
  console.log('[UA Extension] Browser startup');
  applyFromStorage();
});

// On install/update, restore persisted headers
chrome.runtime.onInstalled.addListener(() => {
  console.log('[UA Extension] Extension installed/updated');
  applyFromStorage();
});
