    $ = document.querySelector.bind(document)
    storage = chrome.storage.sync

Callback wrapper to throw up an ugly alert box if anything goes wrong.

    catchError = (f) -> ->
      if chrome.runtime.lastError
        alert chrome.runtime.lastError.string
      else if f
        f.apply(this, arguments)

Just load and unload the sites from a simple textarea-backed list. The sites
are actually stored in full Chrome event filter syntax so we can make this
more complicated if we want to later.

    storage.get 'sites', catchError ({sites}) ->
      $('#sites').value = (site.hostSuffix for site in sites).join('\n')

    $('#sites').addEventListener 'input', ->
      sites = ({hostSuffix: site} for site in $('#sites').value.split('\n') when site)

      storage.set {sites}, catchError()