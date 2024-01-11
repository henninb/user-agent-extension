document.addEventListener('DOMContentLoaded', function () {
  document.getElementById("helloButton").addEventListener("click", function () {
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

//document.getElementById("helloButton").addEventListener("click", function () {
//  alert("Hello!");
//  console.log("Hello!");
//});
