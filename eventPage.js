// Generated by CoffeeScript 1.12.5
(function() {
  var DEFAULT_SITES, cooldown, filter, listen, listener, msgListener, reload, storage, tabReplacedListener, unlisten, urlRegex;

  DEFAULT_SITES = [
    {
      hostSuffix: "reddit.com"
    }, {
      hostSuffix: "news.ycombinator.com"
    }, {
      hostSuffix: "facebook.com"
    }, {
      hostSuffix: "twitter.com"
    }
  ];

  storage = chrome.storage.sync;

  filter = {
    url: DEFAULT_SITES
  };

  cooldown = 5;

  urlRegex = /^(([^:\/?#]+):)?(\/\/([^\/:?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;

  listener = function(ev) {
    if (ev.frameId > 0) {
      return;
    }
    return chrome.tabs.executeScript(ev.tabId, {
      file: "content.js",
      runAt: "document_start"
    });
  };

  tabReplacedListener = function(ev) {
    return chrome.tabs.get(ev.tabId, function(tab) {
      var domain, i, len, ref, ref1, site;
      domain = (ref = urlRegex.exec(tab.url)) != null ? ref[4] : void 0;
      if (!domain) {
        return;
      }
      ref1 = filter.url;
      for (i = 0, len = ref1.length; i < len; i++) {
        site = ref1[i];
        if (domain.match(new RegExp(site.hostSuffix + '$'))) {
          return listener(ev);
        }
      }
    });
  };

  listen = function() {
    chrome.alarms.clearAll();
    chrome.webNavigation.onCommitted.addListener(listener, filter);
    chrome.webNavigation.onTabReplaced.addListener(tabReplacedListener);
    return chrome.runtime.onMessage.addListener(msgListener);
  };

  unlisten = function() {
    chrome.webNavigation.onCommitted.removeListener(listener);
    chrome.webNavigation.onTabReplaced.removeListener(tabReplacedListener);
    return chrome.runtime.onMessage.removeListener(msgListener);
  };

  msgListener = function(msg) {
    if (msg !== "clicked") {
      return;
    }
    unlisten();
    return chrome.alarms.create({
      delayInMinutes: cooldown
    });
  };

  reload = function() {
    return storage.get(['sites', 'cooldown'], function(result) {
      if (!result) {
        return;
      }
      if (Array.isArray(result.sites)) {
        filter = {
          url: result.sites
        };
      }
      if (result.cooldown) {
        cooldown = result.cooldown;
      }
      unlisten();
      return listen();
    });
  };

  storage.get(['sites', 'cooldown'], function(result) {
    if (!result) {
      return;
    }
    if (Array.isArray(result.sites)) {
      filter = {
        url: result.sites
      };
    } else {
      storage.set({
        sites: DEFAULT_SITES
      });
    }
    if (result.cooldown) {
      cooldown = result.cooldown;
    } else {
      storage.set({
        cooldown: 5
      });
    }
    return chrome.alarms.get(function(alarm) {
      if (!alarm) {
        return listen();
      }
    });
  });

  chrome.alarms.onAlarm.addListener(listen);

  chrome.storage.onChanged.addListener(reload);

}).call(this);
