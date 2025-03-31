export function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

export function redirectTo(url) {
  window.location.href = url;
}
