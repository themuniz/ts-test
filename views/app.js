/* eslint-env browser */
/* global Alpine, axios */

document.addEventListener('alpine:init', () => {
  Alpine.data('pageUtils', () => ({
    isLoggedIn: false,
    messageBoxHtml: '',
    messageBoxType: 'info',
    loginUsername: '',
    loginPassword: '',
    showToast: false,
    toastMessage: '',
    toastTitle: 'Success',
    toastType: 'success',
    limit: 10,
    slideOverOpen: false,
    user: {},
    async init() {
      const user = localStorage.getItem('user')
      if (!user) {
        this.messageBoxType = 'error'
        this.messageBoxHtml =
          '<p>You are not logged in. Please go to the <a class="text-blue-700" href="https://ofditprojects.sps.cuny.edu/" target="_blank">login</a> page, and then refresh this page after successfully logging in.</p><div><label for="username">Username:</label><input id="username" type="text" x-model="loginUsername"/><label for="password">Password:</label><input id="password" type="password" x-model="loginPassword"/><button @click="login">Login</button>'
      } else {
        this.user = JSON.parse(user)
        this.messageBoxHtml = 'Checking credentials'
        this.isLoggedIn = await this.checkToken(this.user.token)
      }
      if (this.isLoggedIn) {
        const app = document.getElementById('app')
        app.setAttribute(
          'hx-headers',
          `{"Authentication": "Bearer: ${this.user.token}"}`,
        )
      }
    },
    async login() {
      try {
        const response = await axios({
          url: 'https://ofditprojects.sps.cuny.edu/api/login',
          method: 'post',
          data: {
            username: this.loginUsername,
            password: this.loginPassword,
          },
        })
        this.user = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
        this.sendNotification(
          `Greetings ${this.user.first_name}, you have successfully logged in.`,
        )
      } catch (err) {
        console.error(err)
      }
    },
    async checkToken(token) {
      try {
        const response = await axios({
          url: 'https://ofditprojects.sps.cuny.edu/api/login/check-token',
          method: 'post',
          data: {
            user_token: token,
          },
        })
        this.user = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
        this.sendNotification(
          `Greetings ${this.user.first_name}, you have successfully logged in.`,
        )
        return true
      } catch (err) {
        this.messageBoxType = 'error'
        this.messageBoxHtml =
          'Your credential check failed. Please go to the <a class="text-blue-500" href="https://ofditprojects.sps.cuny.edu/" target="_blank">Login</a> page, and then return to refresh this page after successfully logging in.'
      }
      return false
    },
    async sendNotification(message) {
      this.toastMessage = message
      this.toastType = 'success'
      this.showToast = true
      await new Promise((res) => setTimeout(res, 3000))
      this.showToast = false
      this.toastMessage = ''
    },
    async copyToClipboard(value) {
      await navigator.clipboard.writeText(value)
      this.sendNotification(`Wrote <em>${value}</em> to the clipboard.`)
    },
  }))
})
