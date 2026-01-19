document.addEventListener('DOMContentLoaded', function () {
  console.log('[UA Popup] Loaded');
  console.log('[UA Popup] chrome object:', typeof chrome);
  console.log('[UA Popup] chrome.storage:', typeof chrome !== 'undefined' ? typeof chrome.storage : 'N/A');

  const originalUserAgent = navigator.userAgent;
  const userAgentDisplay = document.getElementById('userAgentDisplay');
  const userAgentField = document.getElementById('userAgentField');
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
  chrome.storage.local.get(['customUserAgent', 'persistEnabled'], (data) => {
    console.log('[UA Popup] Loaded storage:', data);
    if (data.customUserAgent) {
      userAgentField.value = data.customUserAgent;
      if (data.persistEnabled) {
        userAgentDisplay.textContent = data.customUserAgent;
      }
    }
    persistCheckbox.checked = data.persistEnabled || false;

    if (data.persistEnabled && data.customUserAgent) {
      setStatus(true, 'Persisting custom UA');
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

  // Apply custom user agent
  applyButton.addEventListener('click', function () {
    console.log('[UA Popup] Apply button clicked');

    const customUA = userAgentField.value.trim();
    const persist = persistCheckbox.checked;

    console.log('[UA Popup] Custom UA:', customUA);
    console.log('[UA Popup] Persist:', persist);

    if (!customUA) {
      setStatus(false, 'Please enter a user agent');
      return;
    }

    // Save to storage
    chrome.storage.local.set({
      customUserAgent: customUA,
      persistEnabled: persist
    }, () => {
      console.log('[UA Popup] Saved to storage');

      if (persist) {
        // Send to background script to apply globally
        console.log('[UA Popup] Sending applyUserAgent message');
        chrome.runtime.sendMessage(
          { action: 'applyUserAgent', userAgent: customUA },
          (response) => {
            console.log('[UA Popup] Got response:', response);
            if (chrome.runtime.lastError) {
              console.error('[UA Popup] Runtime error:', chrome.runtime.lastError);
              setStatus(false, 'Error: ' + chrome.runtime.lastError.message);
              return;
            }
            if (response && response.success) {
              userAgentDisplay.textContent = customUA;
              setStatus(true, 'Persisting across all sites');
            } else {
              setStatus(false, 'Failed to apply UA');
            }
          }
        );
      } else {
        // Just update display locally (single page only)
        userAgentDisplay.textContent = customUA;
        setStatus(true, 'Applied to this session');

        // Clear any global rules
        chrome.runtime.sendMessage({ action: 'clearUserAgent' });
      }
    });
  });

  // Reset to original
  resetButton.addEventListener('click', function () {
    console.log('[UA Popup] Reset button clicked');

    userAgentField.value = '';
    persistCheckbox.checked = false;
    userAgentDisplay.textContent = originalUserAgent;

    // Clear storage
    chrome.storage.local.remove(['customUserAgent', 'persistEnabled'], () => {
      console.log('[UA Popup] Cleared storage');

      // Clear global rules
      chrome.runtime.sendMessage({ action: 'clearUserAgent' }, (response) => {
        console.log('[UA Popup] Clear response:', response);
        if (response && response.success) {
          setStatus(true, 'Reset to original');
        }
      });
    });
  });

  // Handle checkbox change
  persistCheckbox.addEventListener('change', function () {
    console.log('[UA Popup] Checkbox changed:', persistCheckbox.checked);

    const persist = persistCheckbox.checked;
    const customUA = userAgentField.value.trim();

    chrome.storage.local.set({ persistEnabled: persist }, () => {
      if (!persist && customUA) {
        // If unchecking, clear global rules
        chrome.runtime.sendMessage({ action: 'clearUserAgent' }, () => {
          setStatus(true, 'Persistence disabled');
        });
      } else if (persist && customUA) {
        // If checking and we have a UA, apply it
        chrome.runtime.sendMessage(
          { action: 'applyUserAgent', userAgent: customUA },
          () => {
            setStatus(true, 'Persistence enabled');
          }
        );
      }
    });
  });
});
