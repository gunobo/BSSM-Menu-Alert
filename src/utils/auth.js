export function isLoggedIn() {
  const token = sessionStorage.getItem("accessToken");
  return !!token && token !== "undefined" && token !== "null" && token.includes(".");
}
