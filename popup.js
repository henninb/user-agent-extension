function setUserAgent(userAgent) {
    let headers = new Headers();
    headers.append('User-Agent', userAgent);
    let nav = new Navigator();
    nav.setUserAgentOverride(headers, null);
}

document.addEventListener('DOMContentLoaded', function () {
  var originalUserAgent = navigator.userAgent;

  navigator.__defineGetter__('userAgent', function(){
      return 'PhantomJS/123';
  });

  document.getElementById("uaButton").addEventListener("click", function () {
    var userAgent = navigator.userAgent;
    console.log("User Agent:", userAgent);
    alert('new:' + userAgent + '\noriginal:' + originalUserAgent);

  });

});
