export function sanitizeHTML(dirty) {
  if (window.DOMPurify) {
    return window.DOMPurify.sanitize(dirty);
  }
  // Simple fallback if DOMPurify is not loaded
  const div = document.createElement('div');
  div.textContent = dirty;
  return div.innerHTML; 
}
