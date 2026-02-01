<meta name="layout" content="main"/>
<g:set var="pageTitle" value="Users (mock)" />
<div class="container-fluid">
    <div class="card">
        <div class="card-header"><h3 class="card-title">Users (mock)</h3></div>
        <div class="card-body table-responsive">
            <table class="table table-striped table-hover">
                <thead><tr><th>Login</th><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
                <tbody>
                    <g:each in="${users}" var="u">
                        <tr>
                            <td>${u.user_login}</td>
                            <td>${u.display_name}</td>
                            <td>${u.user_email}</td>
                            <td>
                                <form method="post" action="/users/delete" style="display:inline">
                                    <input type="hidden" name="user_login" value="${u.user_login}"/>
                                    <button class="btn btn-sm btn-outline-danger" type="submit">Delete</button>
                                </form>
                            </td>
                        </tr>
                    </g:each>
                </tbody>
            </table>
        </div>
        <div class="card-footer">
            <h5>Create User (mock)</h5>
            <form method="post" action="/users/create" class="row g-2">
                <div class="col-md-4"><input name="user_login" class="form-control" placeholder="Login"/></div>
                <div class="col-md-4"><input name="display_name" class="form-control" placeholder="Display name"/></div>
                <div class="col-md-4"><input name="user_email" class="form-control" placeholder="Email"/></div>
                <div class="col-12"><button class="btn btn-primary mt-2" type="submit">Create</button></div>
            </form>
        </div>
    </div>
</div>
