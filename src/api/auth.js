const USERS_KEY = "users";
const LOGIN_KEY = "user";

/* 회원가입 */
export function signup(id, pw) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

  if (users.find(u => u.id === id)) {
    throw new Error("EXIST");
  }

  users.push({ id, pw });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/* 로그인 */
export function login(id, pw) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  const user = users.find(u => u.id === id && u.pw === pw);

  if (!user) throw new Error("INVALID");

  localStorage.setItem(LOGIN_KEY, id);
}

/* 로그아웃 */
export function logout() {
  localStorage.removeItem(LOGIN_KEY);
}

/* 로그인 사용자 */
export function getLoginUser() {
  return localStorage.getItem(LOGIN_KEY);
}
