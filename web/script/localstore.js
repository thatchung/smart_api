var SessionUser = {

  setUser(user) {
    window.localStorage.setItem('user', JSON.stringify(user));
  },

  getUser() {
    return window.localStorage.getItem('user');
  },

  getToken() {
    let user =  window.localStorage.getItem('user');
    if(user)
      return user.token;
    return null;
  },

  clearUser(){
    window.localStorage.removeItem('user');
  },
}