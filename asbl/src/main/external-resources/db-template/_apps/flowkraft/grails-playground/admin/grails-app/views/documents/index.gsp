<%@ page import="com.flowkraft.MockDataService" %>
<meta name="layout" content="main"/>
<g:set var="pageTitle" value="Documents (Paystubs)" />
<div class="container-fluid">
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Documents (Paystubs)</h3>
        </div>
        <div class="card-body table-responsive">
            <table class="table table-striped table-hover">
                <thead>
                    <tr><th>ID</th><th>Title</th><th>Employee</th><th>Period</th><th>Gross</th><th>Net</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    <g:each in="${paystubs}" var="p">
                        <tr>
                            <td>${p.id}</td>
                            <td>${p.post_title}</td>
                            <td>${users.find{ it.user_login == p.associated_user_login }?.display_name ?: p.employee}</td>
                            <td>${p.period}</td>
                            <td>${p.gross_amount}</td>
                            <td>${p.net_amount}</td>
                            <td>
                                <form method="post" action="/documents/delete" style="display:inline">
                                    <input type="hidden" name="id" value="${p.id}"/>
                                    <button class="btn btn-sm btn-outline-danger" type="submit">Delete</button>
                                </form>
                            </td>
                        </tr>
                    </g:each>
                </tbody>
            </table>
        </div>
        <div class="card-footer">
            <h5>Create Paystub (mock)</h5>
            <form method="post" action="/documents/create" class="row g-2">
                <div class="col-md-4"><input name="post_title" class="form-control" placeholder="Title"/></div>
                <div class="col-md-4"><input name="employee" class="form-control" placeholder="Employee"/></div>
                <div class="col-md-2"><input name="period" class="form-control" placeholder="Period"/></div>
                <div class="col-md-1"><input name="gross_amount" class="form-control" placeholder="Gross"/></div>
                <div class="col-md-1"><input name="net_amount" class="form-control" placeholder="Net"/></div>
                <div class="col-md-4"><input name="associated_user_login" class="form-control" placeholder="Associated user login"/></div>
                <div class="col-12"><button class="btn btn-primary mt-2" type="submit">Create</button></div>
            </form>
        </div>
    </div>
</div>
