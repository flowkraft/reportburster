package com.flowkraft

class DocumentsController {

    MockDataService mockDataService

    def index() {
        [paystubs: mockDataService.listPaystubs(), users: mockDataService.listUsers()]
    }

    def create() {
        def paramsMap = params.subMap(['post_title','employee','period','gross_amount','net_amount','associated_user_login'])
        if(!paramsMap.post_title) paramsMap.post_title = "New Paystub"
        paramsMap.gross_amount = paramsMap.gross_amount as Integer ?: 0
        paramsMap.net_amount = paramsMap.net_amount as Integer ?: 0
        mockDataService.createPaystub(paramsMap)
        redirect(action:'index')
    }

    def delete() {
        mockDataService.deletePaystub(params.int('id'))
        redirect(action:'index')
    }
}
