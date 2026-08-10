(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  function __accessProp(key) {
    return this[key];
  }
  var __toCommonJS = (from) => {
    var entry = (__moduleCache ??= new WeakMap).get(from), desc;
    if (entry)
      return entry;
    entry = __defProp({}, "__esModule", { value: true });
    if (from && typeof from === "object" || typeof from === "function") {
      for (var key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(entry, key))
          __defProp(entry, key, {
            get: __accessProp.bind(from, key),
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
          });
    }
    __moduleCache.set(from, entry);
    return entry;
  };
  var __moduleCache;
  var __returnValue = (v) => v;
  function __exportSetter(name, newValue) {
    this[name] = __returnValue.bind(null, newValue);
  }
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {
        get: all[name],
        enumerable: true,
        configurable: true,
        set: __exportSetter.bind(all, name)
      });
  };

  // src/index.ts
  var exports_src = {};
  __export(exports_src, {
    GhostCursors: () => GhostCursors
  });
  var VERSION = "0.1.0";
  var cursors = new Map;
  var socket;
  var retry;
  var shouldReconnect = true;
  var lastPosition;
  function socketUrl() {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const host = location.hostname === "localhost" ? "localhost:3001" : "ghost-cursors.vivek.ink";
    return `${protocol}//${host}/ws`;
  }
  function cursorIcon(color) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg.setAttribute("viewBox", "0 0 14 20");
    svg.setAttribute("aria-hidden", "true");
    path.setAttribute("d", "M1 1 13 14 7.4 14.4 4.8 19Z");
    path.setAttribute("fill", color);
    path.setAttribute("stroke", "white");
    path.setAttribute("stroke-width", "1");
    svg.append(path);
    return svg;
  }
  function render(cursor) {
    let current = cursors.get(cursor.id);
    if (!current) {
      const element = document.createElement("div");
      element.className = "ghost-cursor";
      element.append(cursorIcon(cursor.color));
      document.body.append(element);
      current = { ...cursor, element };
      cursors.set(cursor.id, current);
    }
    Object.assign(current, cursor);
    current.element.dataset.name = cursor.name;
    current.element.style.transform = `translate3d(${cursor.x * innerWidth}px, ${cursor.y * innerHeight}px, 0)`;
  }
  function remove(id) {
    cursors.get(id)?.element.remove();
    cursors.delete(id);
  }
  function showCount(count) {
    const element = document.querySelector("#ghost-cursors-count-value");
    if (element)
      element.textContent = String(count);
  }
  function connect(options = {}) {
    if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING)
      return;
    shouldReconnect = true;
    const url = options.url ?? window.GhostCursorsConfig?.url ?? socketUrl();
    const currentSocket = new WebSocket(url);
    socket = currentSocket;
    currentSocket.addEventListener("open", () => {
      if (lastPosition)
        currentSocket.send(JSON.stringify({ type: "move", ...lastPosition }));
    });
    currentSocket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "sync") {
          message.cursors.forEach(render);
          showCount(message.count);
        }
        if (message.type === "move")
          render(message);
        if (message.type === "leave")
          remove(message.id);
        if (message.type === "count")
          showCount(message.count);
      } catch {}
    });
    currentSocket.addEventListener("close", () => {
      if (socket === currentSocket)
        socket = undefined;
      cursors.forEach(({ element }) => element.remove());
      cursors.clear();
      showCount(0);
      if (shouldReconnect)
        retry = setTimeout(() => connect({ url }), 1000);
    });
  }
  function disconnect() {
    shouldReconnect = false;
    clearTimeout(retry);
    socket?.close();
  }
  function inject(options) {
    if (!document.querySelector("#ghost-cursors-style")) {
      const style = document.createElement("style");
      style.id = "ghost-cursors-style";
      style.textContent = `.ghost-cursor{position:fixed;top:0;left:0;z-index:2147483647;width:14px;height:20px;pointer-events:auto;transition:transform 50ms linear;filter:drop-shadow(0 1px 2px #0008)}.ghost-cursor svg{display:block;width:14px;height:20px}.ghost-cursor:hover::after{content:attr(data-name);position:absolute;top:18px;left:10px;padding:3px 6px;border-radius:4px;background:#111;color:#fff;font:11px/1.2 system-ui,sans-serif;white-space:nowrap}#ghost-cursors-count{position:fixed;right:10px;bottom:8px;z-index:2147483647;display:flex;align-items:center;gap:3px;padding:3px 6px;border-radius:5px;background:#111c;color:#fff;font:11px/1.2 system-ui,sans-serif;pointer-events:none}#ghost-cursors-count svg{width:8px;height:12px}`;
      document.head.append(style);
    }
    if (!document.querySelector("#ghost-cursors-count")) {
      const count = document.createElement("div");
      count.id = "ghost-cursors-count";
      count.title = "Active cursors";
      const value = document.createElement("span");
      value.id = "ghost-cursors-count-value";
      value.textContent = "0";
      count.append(value, cursorIcon("white"));
      document.body.append(count);
    }
    document.documentElement.dataset.ghostCursorsSdk = VERSION;
    connect(options);
    window.dispatchEvent(new CustomEvent("ghost-cursors:ready", { detail: { version: VERSION } }));
  }
  var frame = 0;
  window.addEventListener("pointermove", (event) => {
    lastPosition = { x: event.clientX / innerWidth, y: event.clientY / innerHeight };
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "move", ...lastPosition }));
      }
    });
  });
  window.addEventListener("resize", () => cursors.forEach(render));
  var GhostCursors = Object.freeze({
    version: VERSION,
    inject,
    connect,
    disconnect
  });
  window.GhostCursors = GhostCursors;
  GhostCursors.inject();
})();
