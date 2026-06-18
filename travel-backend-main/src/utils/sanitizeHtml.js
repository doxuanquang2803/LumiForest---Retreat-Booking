const sanitizeHtml = (htmlString) => {
  if (typeof htmlString !== 'string') return htmlString;
  
  // Basic XSS sanitization (removing common script tags and inline handlers)
  // For production, consider using a library like DOMPurify or sanitize-html
  return htmlString
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/on\w+=\w+/gi, '');
};

module.exports = sanitizeHtml;
