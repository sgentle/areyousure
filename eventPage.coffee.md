    DEFAULT_SITES = [
      { hostSuffix: "reddit.com" }
      { hostSuffix: "news.ycombinator.com" }
      { hostSuffix: "facebook.com" }
      { hostSuffix: "twitter.com" }
    ]
    storage = chrome.storage.sync
    filter = null

The listener is where most of the action happens. This code fires on page
navigate and is where we throw up our dialog. At this point filtering has
already happened so we must be on one of the sites in our filter list.

    listener = (ev) ->

onBeforeNavigate fires on every frame's navigation, so we ignore anything that
isn't the root

      return if ev.frameId > 0

Start by immediately setting the tab to about:blank. This kind of sucks, but
there's no mechanism to intercept navigation events so we have to be a bit
tricky.

      chrome.tabs.update ev.tabId, url: "about:blank"

Then we confirm the navigation. Since we've already been pessimistic and set
the page to blank, we're already done if the user wants to cancel. To stop it
from being a "ARE YOU SURE" click-fest we give a 5-minute grace window after
click through onto any site by removing the listener entirely.

      if confirm "Are you sure you want to visit " + ev.url + " ?"
        chrome.tabs.update ev.tabId, url: ev.url
        unlisten()
        chrome.alarms.create delayInMinutes: 5

Listen and unlisten methods. This API is very efficient, and does all the
filtering on Chrome-side without even loading our code.

    listen = ->
      chrome.alarms.clearAll()
      chrome.webNavigation.onBeforeNavigate.addListener listener, filter
    unlisten = ->
      chrome.webNavigation.onBeforeNavigate.removeListener listener

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
      listen()

    chrome.alarms.onAlarm.addListener listen
    chrome.storage.onChanged.addListener reload