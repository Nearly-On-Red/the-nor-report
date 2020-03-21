const SUPPORTED_CHANNELS = [
    /^\/?nearlyonred\/?$/i,
];

if (SUPPORTED_CHANNELS.some(e => window.location.pathname.match(e))) {
    const s = document.createElement('script');
    s.src = browser.runtime.getURL('twitch_content.js');
    (document.head || document.documentElement).appendChild(s);

    s.onload = function() {
        s.parentNode.removeChild(s);
    };
}
