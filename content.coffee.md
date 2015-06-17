This is our content blob. It contains an svg circle to do hold-and-confirm as
seen here: http://sgentle.github.io/hold-to-confirm/

    CONTENT = """
      <?xml version="1.0"?>
      <svg id="areyousure-button" viewBox="0 0 240 240" version="1.1"
        xmlns="http://www.w3.org/2000/svg">

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
    """

Set up an HTML5 dialog object and fill it with our content. We append it
directly to the html element because document.body doesn't exist yet.

    dialog = document.createElement 'dialog'
    dialog.id = 'areyousure'
    dialog.innerHTML = CONTENT
    document.children[0].appendChild dialog
    dialog.showModal()


Add listeners so we know when to dismiss the dialog.

    timer = null
    clickable = false
    button = dialog.querySelector '#areyousure-button'
    text = dialog.querySelector '#areyousure-text'

    button.addEventListener 'mousedown', (ev) ->
      return unless ev.button is 0

      timer = setTimeout ->
        clickable = true
        button.classList.add 'activated'
      , 2000

    button.addEventListener 'mouseup', ->
      clearTimeout timer
      button.classList.remove 'activated'

    button.addEventListener 'click', (e) ->
      return unless clickable

      text.textContent = '✔'
      button.classList.add 'completed'
      dialog.close()
      dialog.remove()
      chrome.runtime.sendMessage "clicked"
