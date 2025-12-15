<%@ page import="grails.util.Environment; org.springframework.core.SpringVersion; org.springframework.boot.SpringBootVersion"
%><!doctype html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>FlowKraft Admin Panel</title>
</head>
<body>
<content tag="nav">
    <li class="nav-item dropdown">
        <a href="#" class="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">Application Status <span class="caret"></span></a>
        <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#">Server: ${request.getServletContext().getServerInfo()}</a></li>
            <li><a class="dropdown-item" href="#">Host: ${InetAddress.getLocalHost()}</a></li>
            <li><a class="dropdown-item" href="#">Environment: ${Environment.current.name}</a></li>
            <li><a class="dropdown-item" href="#">App version: <g:meta name="info.app.version"/></a></li>
            <li><a class="dropdown-item" href="#">App profile: ${grailsApplication.config.getProperty('grails.profile')}</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#">Reloading active: ${Environment.reloadingAgentEnabled}</a></li>
        </ul>
    </li>
    <li class="nav-item dropdown">
        <a href="#" class="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">Artefacts <span class="caret"></span></a>
        <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#">Controllers: ${grailsApplication.controllerClasses.size()}</a></li>
            <li><a class="dropdown-item" href="#">Domains: ${grailsApplication.domainClasses.size()}</a></li>
            <li><a class="dropdown-item" href="#">Services: ${grailsApplication.serviceClasses.size()}</a></li>
            <li><a class="dropdown-item" href="#">Tag Libraries: ${grailsApplication.tagLibClasses.size()}</a></li>
        </ul>
    </li>
    <li class="nav-item dropdown">
        <a href="#" class="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">Installed Plugins<span class="caret"></span></a>
        <ul class="dropdown-menu dropdown-menu-right">
            <g:each var="plugin" in="${applicationContext.getBean('pluginManager').allPlugins}">
                <li><a class="dropdown-item" href="#">${plugin.name} - ${plugin.version}</a></li>
            </g:each>
        </ul>
    </li>
</content>

<div class="svg" role="presentation">
    <div class="bg-dark-subtle text-center">
        <asset:image src="favicon.svg" class="w-50"/>
    </div>
</div>

<div id="content" role="main">
    <div class="container">
        <div class="hero-section">
            <h1 class="hero-tagline">FlowKraft Admin Panel</h1>
            <br><br>
            <p class="hero-description">Easily build admin user interfaces on top of your business data: rapidly assemble
                searchable, filterable lists and configurable forms for CRUD workflows, expose role-aware views and
                actions for administrators, and surface dashboards, exports and activity logs so teams can operate with
                confidence and context.</p>
        </div>

        <div class="container">
            <h5 class="text-center text-muted mb-3">Admin Tools</h5>
            <div class="component-grid">
                <g:link uri="/users" class="component-card text-decoration-none">
                    <i class="bi bi-people icon"></i>
                    <h6>Users</h6>
                    <p>Manage accounts and access</p>
                </g:link>
                <g:link uri="/roles" class="component-card text-decoration-none">
                    <i class="bi bi-shield-lock icon"></i>
                    <h6>Roles</h6>
                    <p>Permission and policy control</p>
                </g:link>
                <g:link uri="/workflows" class="component-card text-decoration-none">
                    <i class="bi bi-flow-chart icon"></i>
                    <h6>Workflows</h6>
                    <p>Approval rules and automations</p>
                </g:link>
                <g:link uri="/exports" class="component-card text-decoration-none">
                    <i class="bi bi-cloud-arrow-up icon"></i>
                    <h6>Exports</h6>
                    <p>Scheduled and on-demand exports</p>
                </g:link>
                <g:link uri="/dashboards" class="component-card text-decoration-none">
                    <i class="bi bi-bar-chart icon"></i>
                    <h6>Dashboards</h6>
                    <p>Operational insights & KPIs</p>
                </g:link>
                <g:link uri="/logs" class="component-card text-decoration-none">
                    <i class="bi bi-journal-text icon"></i>
                    <h6>Audit Logs</h6>
                    <p>Activity and change history</p>
                </g:link>
            </div>
        </div>
    </div>
</div>

</body>
</html>
