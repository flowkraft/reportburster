<meta name="layout" content="main"/>
<g:set var="pageTitle" value="Roles (mock)" />
<div class="container-fluid">
    <div class="card">
        <div class="card-header"><h3 class="card-title">Roles (mock)</h3></div>
        <div class="card-body">
            <ul class="list-group mb-3">
                <g:each in="${roles}" var="r">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${r}
                        <form method="post" action="/roles/delete" style="display:inline">
                            <input type="hidden" name="role" value="${r}"/>
                            <button class="btn btn-sm btn-outline-danger" type="submit">Delete</button>
                        </form>
                    </li>
                </g:each>
            </ul>
        </div>
        <div class="card-footer">
            <form method="post" action="/roles/create" class="row g-2">
                <div class="col-md-8"><input name="role" class="form-control" placeholder="Role name"/></div>
                <div class="col-md-4"><button class="btn btn-primary" type="submit">Create Role</button></div>
            </form>
        </div>
    </div>
</div>
