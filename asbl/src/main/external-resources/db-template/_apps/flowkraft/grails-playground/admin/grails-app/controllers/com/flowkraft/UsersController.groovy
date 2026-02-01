package com.flowkraft

class UsersController {

    MockDataService mockDataService

    def index() {
        [users: mockDataService.listUsers()]
    }

    def create() {
        def newUser = [user_login: params.user_login ?: "user${System.currentTimeMillis()}", display_name: params.display_name ?: params.user_login, user_email: params.user_email ?: 'noreply@example.com']
        mockDataService.createUser(newUser)
        redirect(action:'index')
    }

    def delete() {
        mockDataService.deleteUser(params.user_login)
        redirect(action:'index')
    }
}
