export function isLoggedIn(): boolean {
  const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
  return !!token && token !== "undefined" && token !== "null" && token.includes(".");
}
