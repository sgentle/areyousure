We don't want to ever have more than one of these on a page.

    return if document.getElementById 'areyousure'

This is our content blob. It contains an svg circle to do hold-and-confirm as
seen here: http://sgentle.github.io/hold-to-confirm/

    CONTENT = """
      <button hidden>
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1"
          viewBox="0 0 240 240">

            <filter id="areyousure-dropshadow" height="130%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="2" dy="0" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.5"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <circle id="areyousure-circle" cx="120" cy="120" r="100" style="filter:url(#areyousure-dropshadow)"/>
            <text id="areyousure-text" x="120" y="120" font-size="24px"
                fill="white" dominant-baseline="middle" text-anchor="middle">
              Are you sure?
            </text>
        </svg>
      </button>
    """

Set up an HTML5 dialog object and fill it with our content. We append it
directly to the html element because document.body doesn't exist yet.

    container = document.createElement 'div'

    shadow = container.attachShadow mode: 'open'
    shadow.resetStyleInheritance = true

    dialog = document.createElement 'dialog'
    dialog.style.background = 'none'
    dialog.style.border = 'none'
    shadow.appendChild dialog

    dialog.id = 'areyousure'
    dialog.innerHTML = CONTENT
    dialog.addEventListener 'cancel', (e) -> e.preventDefault()

    document.documentElement.appendChild container

    dialog.showModal()

Load our static style from the extension

    staticStyle = document.createElement 'link'
    staticStyle.rel = 'stylesheet'
    staticStyle.type = 'text/css'
    staticStyle.href = chrome.runtime.getURL 'content.css'
    shadow.appendChild staticStyle


Create a dynamic style element so we can customise the hold time and backdrop
opacity

    dynamicStyle = document.createElement 'style'
    shadow.appendChild dynamicStyle

    setStyles = ({holdTime, backdropOpacity}) ->
      content = """
        #areyousure button:active circle {
          transition: stroke-dashoffset #{holdTime}s linear !important;
        }

        #areyousure::backdrop {
          background-color: rgba(0,0,0,#{backdropOpacity});
        }
      """
      dynamicStyle.textContent = content

Add listeners so we know when to dismiss the dialog.

    timer = null
    completed = false
    button = dialog.querySelector 'button'
    text = dialog.querySelector 'text'

    chrome.storage.sync.get {holdTime: 2, backdropOpacity: 0.8}, (opts) ->
      setStyles opts

      start = (ev) ->
        return unless ev.button is 0 or ev.code is 'Space'
        return if timer or completed

        timer = setTimeout ->
          completed = true
          button.classList.add 'completed'

        , opts.holdTime * 1000

      stop = (ev) ->
        return unless ev.button is 0 or ev.code is 'Space'
        return if !timer

        clearTimeout timer
        timer = null
        button.classList.remove 'activated'

      button.addEventListener 'blur', -> button.focus()

      button.addEventListener 'mousedown', start
      window.addEventListener 'mouseup', stop

      button.addEventListener 'keydown', start
      window.addEventListener 'keyup', stop

      button.addEventListener 'click', (e) ->
        return e.preventDefault() unless completed

        window.removeEventListener 'mouseup', stop
        window.removeEventListener 'keyup', stop

        dialog.close()
        container.remove()

        chrome.runtime.sendMessage "clicked"
