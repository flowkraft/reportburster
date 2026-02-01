package com.flowkraft

class RolesController {

    MockDataService mockDataService

    def index() {
        [roles: mockDataService.listRoles()]
    }

    def create() {
        mockDataService.createRole(params.role ?: 'NewRole')
        redirect(action:'index')
    }

    def delete() {
        mockDataService.deleteRole(params.role)
        redirect(action:'index')
    }
}
