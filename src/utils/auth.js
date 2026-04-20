export function isLoggedIn() {
  // Android WebView(localStorage)와 웹 브라우저(sessionStorage) 모두 확인
  const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
  return !!token && token !== "undefined" && token !== "null" && token.includes(".");
}
