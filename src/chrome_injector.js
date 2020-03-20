var s = document.createElement('script');
s.src = chrome.runtime.getURL('twitch_content.js');
(document.head || document.documentElement).appendChild(s);
s.onload = function() {
    s.parentNode.removeChild(s);
};
