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
  const icons = active ? ICONS_ACTIVE : ICONS_DEFAULT;
  chrome.action.setIcon({ path: icons });
  console.log('[UA Extension] Icon set to:', active ? 'active' : 'default');
}

// Apply user agent override using declarativeNetRequest
async function applyUserAgent(userAgent) {
  console.log('[UA Extension] Applying user agent:', userAgent);

  try {
    // Remove existing rule first
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID]
    });

    if (userAgent) {
      // Add new rule to modify User-Agent header
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [{
          id: RULE_ID,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [{
              header: 'User-Agent',
              operation: 'set',
              value: userAgent
            }]
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

      console.log('[UA Extension] Rule applied successfully');

      // Verify the rule was added
      const rules = await chrome.declarativeNetRequest.getDynamicRules();
      console.log('[UA Extension] Current rules:', rules);

      // Set active icon
      setIconState(true);
    }

    return true;
  } catch (error) {
    console.error('[UA Extension] Error applying rule:', error);
    throw error;
  }
}

// Clear user agent override
async function clearUserAgent() {
  console.log('[UA Extension] Clearing user agent');

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID]
    });
    console.log('[UA Extension] Rule cleared');

    // Set default icon
    setIconState(false);

    return true;
  } catch (error) {
    console.error('[UA Extension] Error clearing rule:', error);
    throw error;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[UA Extension] Received message:', message);

  if (message.action === 'applyUserAgent') {
    applyUserAgent(message.userAgent)
      .then(() => {
        console.log('[UA Extension] Sending success response');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[UA Extension] Sending error response:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (message.action === 'clearUserAgent') {
    clearUserAgent()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'getStatus') {
    chrome.storage.local.get(['customUserAgent', 'persistEnabled'], (data) => {
      sendResponse({
        customUserAgent: data.customUserAgent || '',
        persistEnabled: data.persistEnabled || false
      });
    });
    return true;
  }
});

// On startup, restore persisted user agent if enabled
chrome.runtime.onStartup.addListener(() => {
  console.log('[UA Extension] Browser startup');
  chrome.storage.local.get(['customUserAgent', 'persistEnabled'], (data) => {
    if (data.persistEnabled && data.customUserAgent) {
      applyUserAgent(data.customUserAgent);
    } else {
      setIconState(false);
    }
  });
});

// Also check on install/update
chrome.runtime.onInstalled.addListener(() => {
  console.log('[UA Extension] Extension installed/updated');
  chrome.storage.local.get(['customUserAgent', 'persistEnabled'], (data) => {
    if (data.persistEnabled && data.customUserAgent) {
      applyUserAgent(data.customUserAgent);
    } else {
      setIconState(false);
    }
  });
});
