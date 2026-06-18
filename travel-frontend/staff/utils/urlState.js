export const UrlState = {
  getParams() {
    return new URLSearchParams(window.location.search);
  },
  getParam(key, defaultValue = null) {
    const params = this.getParams();
    return params.has(key) ? params.get(key) : defaultValue;
  },
  setParam(key, value) {
    const params = this.getParams();
    if (value === null || value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  },
  setParams(obj) {
    const params = this.getParams();
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }
};
