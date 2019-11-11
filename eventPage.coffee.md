    DEFAULT_SITES = [
      { hostSuffix: "reddit.com" }
      { hostSuffix: "news.ycombinator.com" }
      { hostSuffix: "facebook.com" }
      { hostSuffix: "twitter.com" }
    ]
    storage = chrome.storage.sync
    filter = url: DEFAULT_SITES
    cooldown = 5
    urlRegex = /^(([^:\/?#]+):)?(\/\/([^\/:?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/

The listener is where most of the action happens. This code fires on page
navigate and is where we inject the content script. At this point filtering
has already happened so we must be on one of the sites in our filter list.

    listener = (ev) ->
      return if ev.frameId > 0

      chrome.tabs.executeScript ev.tabId, file: "content.js", runAt: "document_start"

    tabReplacedListener = (ev) ->
      chrome.tabs.get ev.tabId, (tab) ->
        domain = urlRegex.exec(tab.url)?[4]
        return unless domain
        for site in filter.url
          return listener(ev) if domain.match new RegExp site.hostSuffix + '$'

Listen and unlisten methods. This API is very efficient, and does all the
filtering on Chrome-side without even loading our code.

    listen = ->
      chrome.alarms.clearAll()
      chrome.webNavigation.onCommitted.addListener listener, filter
      chrome.webNavigation.onTabReplaced.addListener tabReplacedListener
      chrome.runtime.onMessage.addListener msgListener

    unlisten = ->
      chrome.webNavigation.onCommitted.removeListener listener
      chrome.webNavigation.onTabReplaced.removeListener tabReplacedListener
      chrome.runtime.onMessage.removeListener msgListener


We receive a message from the page when the confirm button is clicked. When
this happens we turn off all our listeners (so no more confirm dialogs will
appear) and set an alarm to turn them back on after a configurable cooldown.

    msgListener = (msg) ->
      return unless msg is "clicked"
      unlisten()
      chrome.alarms.create delayInMinutes: cooldown


Reload the stored sites from Chrome's synchronised storage. We just bail on
errors here because there's not much we can realistically do about them.

    reload = ->
      storage.get ['sites', 'cooldown'], (result) ->
        return unless result
        filter = url: result.sites if Array.isArray result.sites
        cooldown = result.cooldown if result.cooldown
        unlisten()
        listen()

First-time setup. If there aren't any stored sites (including if the storage
API is somehow broken) we just use the defaults.

    storage.get ['sites', 'cooldown'], (result) ->
      return unless result

      if Array.isArray result.sites
        filter = url: result.sites
      else
        storage.set sites: DEFAULT_SITES

      if result.cooldown
        cooldown = result.cooldown
      else
        storage.set cooldown: 5

Only start listening if we haven't deliberately removed our listeners (because
we're waiting for the alarm to turn them back on).

      chrome.alarms.get (alarm) ->
        listen() unless alarm

    chrome.alarms.onAlarm.addListener listen
    chrome.storage.onChanged.addListener reload
