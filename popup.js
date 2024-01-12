document.addEventListener('DOMContentLoaded', function () {
  document.getElementById("uaButton").addEventListener("click", function () {
    var userAgent = navigator.userAgent;
    console.log("User Agent:", userAgent);
    alert(userAgent);

    //chrome.runtime.getBackgroundPage(function (backgroundPage) {
    //var userAgent = backgroundPage.navigator.userAgent;
    //console.log('User Agent:', userAgent);
    //}

    // Now you can use the userAgent string as needed
  });
});
