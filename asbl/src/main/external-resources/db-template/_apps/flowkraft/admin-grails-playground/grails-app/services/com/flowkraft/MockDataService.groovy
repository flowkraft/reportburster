package com.flowkraft

import jakarta.inject.Singleton
import java.util.concurrent.atomic.AtomicInteger

@Singleton
class MockDataService {

    private List<Map> users = []
    private List<Map> paystubs = []
    private List<String> roles = []
    private AtomicInteger paystubId = new AtomicInteger(1)

    MockDataService() {
        // Initialize mock roles
        roles = ['Administrator', 'Employee']

        // Initialize users (from Provisioner.php)
        users = [
            [user_login: 'clyde.grew', display_name: 'Clyde Grew', user_email: 'clyde.grew@northridgehealth.org'],
            [user_login: 'kyle.butford', display_name: 'Kyle Butford', user_email: 'kyle.butford@northridgehealth.org'],
            [user_login: 'alfreda.waldback', display_name: 'Alfreda Waldback', user_email: 'alfreda.waldback@northridgehealth.org']
        ]

        // Initialize paystubs and associate to users
        paystubs = [
            [id: paystubId.getAndIncrement(), post_title: 'March 2024 Paystub - Clyde Grew', employee: 'Clyde Grew', period: 'March 2024', gross_amount: 4000, net_amount: 3790, associated_user_login: 'clyde.grew'],
            [id: paystubId.getAndIncrement(), post_title: 'March 2024 Paystub - Kyle Butford', employee: 'Kyle Butford', period: 'March 2024', gross_amount: 3000, net_amount: 2890, associated_user_login: 'kyle.butford'],
            [id: paystubId.getAndIncrement(), post_title: 'March 2024 Paystub - Alfreda Waldback', employee: 'Alfreda Waldback', period: 'March 2024', gross_amount: 3500, net_amount: 3590, associated_user_login: 'alfreda.waldback']
        ]
    }

    List<Map> listUsers() { users }
    Map getUser(String login) { users.find { it.user_login == login } }
    void createUser(Map u) { users << u }
    void deleteUser(String login) { users.removeAll { it.user_login == login }; paystubs.removeAll { it.associated_user_login == login } }

    List<Map> listPaystubs() { paystubs }
    Map getPaystub(int id) { paystubs.find { it.id == id } }
    Map createPaystub(Map p) { p.id = paystubId.getAndIncrement(); paystubs << p; return p }
    void deletePaystub(int id) { paystubs.removeAll { it.id == id } }

    List<String> listRoles() { roles }
    void createRole(String r) { if(!roles.contains(r)) roles << r }
    void deleteRole(String r) { roles.removeAll { it == r } }
}
