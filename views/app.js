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
        this.setLoginForm()
      } else {
        this.user = JSON.parse(user)
        this.messageBoxType = 'info'
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
    setLoginForm() {
      this.messageBoxType = 'error'
      this.messageBoxHtml =
        '<p>You are not logged in. Please use the login form below to access this page.</p><div class="flex mt-3 mx-auto flex-col md:w-1/2"><label for="username">Username</label><input class="rounded p-1" id="username" type="text" x-model="loginUsername"/><label class="mt-2" for="password">Password</label><input id="password" class="rounded p-1" type="password" x-model="loginPassword" @keyup.enter="login"/><button class="self-end mt-2 p-2 border bg-blue-700 text-white rounded hover:bg-blue-500" @click="login">Login</button>'
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
        this.init()
      } catch (err) {
        if (err.response.status === 400) {
          this.sendNotification(
            'Please check that you have entered both your username & password.',
            'error',
            'Error',
          )
        }
        if (err.response.status === 401) {
          this.sendNotification(
            'The login server rejected your credentials. Please try again. If you cannot login, please contact OFDIT.',
            'error',
            'Error',
          )
        }
        if (err.response.status === 500) {
          this.sendNotification(
            'The login server is down. Please contact OFDIT if this continues.',
            'error',
            'Error',
          )
        }
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
        this.setLoginForm()
      }
      return false
    },
    async sendNotification(
      message,
      messageType = 'success',
      toastTitle = 'Success',
    ) {
      this.toastMessage = message
      this.toastType = messageType
      this.toastTitle = toastTitle
      this.showToast = true
      await new Promise((res) => setTimeout(res, 3000))
      this.showToast = false
      this.toastMessage = ''
      this.toastTitle = ''
    },
    async copyToClipboard(value) {
      await navigator.clipboard.writeText(value)
      this.sendNotification(`Wrote <em>${value}</em> to the clipboard.`)
    },
  }))
})
