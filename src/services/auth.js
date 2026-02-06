    export const setAuthUser = (user) => {
  localStorage.setItem("authUser", JSON.stringify(user));
};

export const getAuthUser = () => {
  const data = localStorage.getItem("authUser");
  return data ? JSON.parse(data) : null;
};

export const logout = () => {
  localStorage.removeItem("authUser");
};

export const isLoggedIn = () => {
  return !!getAuthUser();
};
