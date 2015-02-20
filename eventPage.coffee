listener = (ev) ->
  chrome.tabs.update ev.tabId, url: "about:blank"
  if confirm "Are you sure you want to visit " + ev.url + " ?"
    chrome.tabs.update ev.tabId, url: ev.url
    unlisten()
    chrome.alarms.create delayInMinutes: 5

filter = url: [
  { hostSuffix: "reddit.com" }
  { hostSuffix: "news.ycombinator.com" }
]

listen = -> chrome.webNavigation.onBeforeNavigate.addListener listener, filter
unlisten = -> chrome.webNavigation.onBeforeNavigate.removeListener listener

chrome.alarms.onAlarm.addListener listen
listen()