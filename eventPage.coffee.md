    DEFAULT_SITES = [
      { hostSuffix: "reddit.com" }
      { hostSuffix: "news.ycombinator.com" }
      { hostSuffix: "facebook.com" }
      { hostSuffix: "twitter.com" }
    ]
    storage = chrome.storage.sync
    filter = null

The listener is where most of the action happens. This code fires on page
navigate and is where we inject the content script. At this point filtering
has already happened so we must be on one of the sites in our filter list.

    listener = (ev) ->
      return if ev.frameId > 0

      chrome.tabs.insertCSS ev.tabId, file: "content.css", runAt: "document_start"
      chrome.tabs.executeScript ev.tabId, file: "content.js", runAt: "document_start"

Listen and unlisten methods. This API is very efficient, and does all the
filtering on Chrome-side without even loading our code.

    listen = ->
      chrome.alarms.clearAll()
      chrome.webNavigation.onCommitted.addListener listener, filter
      chrome.runtime.onMessage.addListener msgListener

    unlisten = ->
      chrome.webNavigation.onCommitted.removeListener listener
      chrome.runtime.onMessage.removeListener msgListener


We receive a message from the page when the confirm button is clicked. When
this happens we turn off all our listeners (so no more confirm dialogs will
appear) and set an alarm to turn them back on after 5 minutes.

    msgListener = (msg) ->
      return unless msg is "clicked"
      chrome.runtime.onMessage.removeListener msgListener
      unlisten()
      chrome.alarms.create delayInMinutes: 5


Reload the stored sites from Chrome's synchronised storage. We just bail on
errors here because there's not much we can realistically do about them.

    reload = ->
      storage.get 'sites', (result) ->
        return unless result and Array.isArray result.sites
        filter = url: result.sites
        unlisten()
        listen()

First-time setup. If there's no stored sites (including if the storage API is
somehow broken) we just use the defaults.

    storage.get 'sites', (result) ->
      if result and Array.isArray result.sites
        filter = url: result.sites
      else
        filter = url: DEFAULT_SITES
        storage.set sites: DEFAULT_SITES

Only start listening if we haven't deliberately removed our listeners (because
we're waiting for the alarm to turn them back on).

      chrome.alarms.get (alarm) ->
        listen() unless alarm

    chrome.alarms.onAlarm.addListener listen
    chrome.storage.onChanged.addListener reload
