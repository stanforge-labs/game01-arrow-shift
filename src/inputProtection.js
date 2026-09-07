const BLOCKED_EVENTS = ['contextmenu', 'selectstart', 'dragstart'];

/**
 * Prevent browser interaction chrome inside the game surface while leaving
 * normal pointer/touch clicks available to the game's own handlers.
 */
export function installInputProtection(root) {
  if (!root?.addEventListener) return () => {};
  const preventBrowserInteraction = (event) => event.preventDefault();
  BLOCKED_EVENTS.forEach((type) => root.addEventListener(type, preventBrowserInteraction, { capture: true }));
  return () => BLOCKED_EVENTS.forEach((type) => root.removeEventListener(type, preventBrowserInteraction, { capture: true }));
}

export { BLOCKED_EVENTS };
