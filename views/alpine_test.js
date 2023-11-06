document.addEventListener('alpine:init', () => {
  Alpine.data('pageUtils', () => ({
    isLoggedIn: false,
    setupMessage: '',
    alertType: 'info',
    showToast: false,
    toastMessage: '',
    toastTitle: 'Success',
    toastType: 'success',
    limit: 10,
    slideOverOpen: false,
    user: {},
    async init() {
      const testUser = { token: 122 }
      localStorage.setItem('user', JSON.stringify(testUser))
      const user = localStorage.getItem('user')
      if (!user) {
        this.alertType = 'error'
        this.setupMessage =
          'You are not logged in. Please go to the login screen, and then refresh this screen.'
      } else {
        this.user = JSON.parse(user)
        this.setupMessage = 'Checking credentials'
        this.isLoggedIn = await this.checkToken(this.user.token)
        if (!this.isLoggedIn) {
          this.alertType = 'error'
          this.setupMessage =
            'Your credential check failed. Please go to the <a href="https://ofditprojects.sps.cuny.edu/login" target="_blank">Login</a> page, and then return to refresh this screen.'
        } else {
          this.isLoggedIn = true
          const app = document.getElementById('app')
          app.setAttribute(
            'hx-headers',
            `{"Authentication": "Bearer: ${this.user.token}"}`,
          )
        }
      }
    },
    async checkToken(token) {
      const response = await fetch(
        'https://ofditprojects.sps.cuny.edu/check-token',
        {
          method: 'post',
          body: JSON.stringify({ user_token: token}),
        },
      )
      return response.json()
    },
    async sendNotification(message, opts) {
      this.toastMessage = message
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
