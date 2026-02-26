document.addEventListener('DOMContentLoaded', function () {
  console.log('[UA Popup] Loaded');

  const originalUserAgent = navigator.userAgent;
  const userAgentDisplay = document.getElementById('userAgentDisplay');
  const userAgentField = document.getElementById('userAgentField');
  const headerNameField = document.getElementById('headerName');
  const headerValueField = document.getElementById('headerValue');
  const persistCheckbox = document.getElementById('persistCheckbox');
  const applyButton = document.getElementById('uaButton');
  const resetButton = document.getElementById('resetButton');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  // Display original user agent
  userAgentDisplay.textContent = originalUserAgent;

  // Check if chrome APIs are available
  if (typeof chrome === 'undefined' || !chrome.storage) {
    console.error('[UA Popup] Chrome APIs not available. Make sure to reload the extension.');
    statusText.textContent = 'Error: Reload extension';
    return;
  }

  // Load saved state
  chrome.storage.local.get(['customUserAgent', 'customHeaderName', 'customHeaderValue', 'persistEnabled'], (data) => {
    console.log('[UA Popup] Loaded storage:', data);
    if (data.customUserAgent) {
      userAgentField.value = data.customUserAgent;
      if (data.persistEnabled) {
        userAgentDisplay.textContent = data.customUserAgent;
      }
    }
    if (data.customHeaderName) {
      headerNameField.value = data.customHeaderName;
    }
    if (data.customHeaderValue) {
      headerValueField.value = data.customHeaderValue;
    }
    persistCheckbox.checked = data.persistEnabled || false;

    if (data.persistEnabled && (data.customUserAgent || data.customHeaderName)) {
      setStatus(true, 'Persisting custom headers');
    } else {
      setStatus(true, 'Ready');
    }
  });

  // Update status indicator
  function setStatus(active, text) {
    console.log('[UA Popup] Status:', text);
    statusDot.classList.toggle('inactive', !active);
    statusText.textContent = text;
  }

  // Apply settings
  applyButton.addEventListener('click', async function () {
    console.log('[UA Popup] Apply button clicked');

    const customUA = userAgentField.value.trim();
    const headerName = headerNameField.value.trim();
    const headerValue = headerValueField.value.trim();
    const persist = persistCheckbox.checked;

    if (!customUA && !headerName) {
      setStatus(false, 'Enter a user agent or header');
      return;
    }

    if (headerName && !headerValue) {
      setStatus(false, 'Header value required');
      return;
    }

    // Save to storage - the background script listens for storage changes
    // and will apply the rules automatically
    await chrome.storage.local.set({
      customUserAgent: customUA,
      customHeaderName: headerName,
      customHeaderValue: headerValue,
      persistEnabled: persist
    });

    console.log('[UA Popup] Saved to storage');

    if (customUA) {
      userAgentDisplay.textContent = customUA;
    }

    if (persist) {
      setStatus(true, 'Persisting across all sites');
    } else {
      setStatus(true, 'Applied to this session');
    }
  });

  // Reset to original
  resetButton.addEventListener('click', async function () {
    console.log('[UA Popup] Reset button clicked');

    userAgentField.value = '';
    headerNameField.value = '';
    headerValueField.value = '';
    persistCheckbox.checked = false;
    userAgentDisplay.textContent = originalUserAgent;

    // Clear storage - the background script will clear rules automatically
    await chrome.storage.local.remove(['customUserAgent', 'customHeaderName', 'customHeaderValue', 'persistEnabled']);
    console.log('[UA Popup] Cleared storage');

    setStatus(true, 'Reset to original');
  });

  // Handle checkbox change
  persistCheckbox.addEventListener('change', async function () {
    console.log('[UA Popup] Checkbox changed:', persistCheckbox.checked);

    const persist = persistCheckbox.checked;

    // Just update the persist flag - background will handle the rest
    await chrome.storage.local.set({ persistEnabled: persist });

    if (persist) {
      setStatus(true, 'Persistence enabled');
    } else {
      setStatus(true, 'Persistence disabled');
    }
  });
});
