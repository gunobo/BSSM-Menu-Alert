export function getUser() {
  return localStorage.getItem("user");
}

export function isLoggedIn() {
  return !!localStorage.getItem("user");
}

export function logout() {
  localStorage.removeItem("user");
}
