/* Menu titles, descriptions and editable HTML views. All paths remain compatible with saved links. */
window.DataxRouteCatalog = [
    {path:'/datax/project/recipes', name:'ProjectRecipes', title:'项目配置方案', group:'templates', icon:'project', view:'recipes', noCache:true, description:'保存和复用项目的连接、表字段映射与查询 SQL。'},
    {path:'/datax/operations/jobs', name:'WorkbenchJobs', title:'后台作业', group:'operations', icon:'task-cfg', view:'operations', noCache:true, description:'跟踪生成、复制和导出进度，查看结果或重试失败作业。'},
    {path:'/datax/operations/exports', name:'ExportRecords', title:'导出记录', group:'operations', icon:'documentation', view:'exports', noCache:true, description:'查询文件归档与下载记录，重新下载已导出的配置。'},
    {path:'/datax/operations/audit', name:'OperationAudit', title:'操作审计', group:'operations', icon:'log', view:'audit', noCache:true, description:'按账号和操作追溯变更与处理结果。'},
    {
        path: "/dashboard",
        name: "Dashboard",
        title: "运行报表",
        group: "monitor",
        icon: "dashboard",
        view: "overview",
        description: "查看任务运行情况与近七日执行趋势。",
        affix: true
    },
    {
        path: "/datax/log/jobLog",
        name: "JobLog",
        title: "执行日志",
        group: "monitor",
        icon: "log",
        view: "logs",
        description: "筛选执行记录、查看运行日志并定位失败原因。"
    },
    {
        path: "/datax/registry/registry",
        name: "Registry",
        title: "资源监控",
        group: "monitor",
        icon: "battery-line",
        view: "resources",
        description: "查看执行节点上报的 CPU、内存和系统负载。"
    },
    {
        path: "/datax/job/jobInfo",
        name: "JobInfo",
        title: "任务列表",
        group: "tasks",
        icon: "task-cfg",
        view: "tasks",
        description: "管理同步任务、调度计划和执行状态。"
    },
    {
        path: "/datax/job/jsonBuild",
        name: "JsonBuild",
        title: "单任务构建",
        group: "tasks",
        icon: "guide",
        view: "buildSingle",
        description: "配置读写连接和字段映射，创建同步任务。"
    },
    {
        path: "/datax/job/jsonBuildBatch",
        name: "JsonBuildBatch",
        title: "批量任务构建",
        group: "tasks",
        icon: "batch-create",
        view: "buildBatch",
        description: "配对源表与目标表，使用调度模板批量创建任务。"
    },
    {
        path: "/datax/job/jobTemplate",
        name: "JobTemplate",
        title: "调度任务模板",
        group: "templates",
        icon: "task-tmp",
        view: "schedulerTemplates",
        description: "维护可复用的执行器、项目与调度配置。"
    },
    {
        path: "/datax/job/configTemplate",
        name: "DataxConfigTemplateList",
        title: "JSON 配置批次",
        group: "templates",
        icon: "task-tmp",
        view: "batches",
        ownHeading: true,
        noCache: true
    },
    {
        path: "/datax/project/jobProject",
        name: "jobProject",
        title: "项目管理",
        group: "settings",
        icon: "project",
        view: "projects",
        description: "维护项目与数据源绑定，按业务组织同步任务。"
    },
    {
        path: "/datax/datasource/jdbcDatasource",
        name: "JdbcDatasource",
        title: "数据源管理",
        group: "settings",
        icon: "cfg-datasouce",
        view: "datasources",
        description: "统一管理连接配置，供任务构建和模板生成使用。"
    },
    {
        path: "/datax/executor/executor",
        name: "Executor",
        title: "执行器管理",
        group: "settings",
        icon: "exe-cfg",
        view: "executors",
        description: "维护执行器分组、注册方式和执行节点。"
    },
    {
        path: "/datax/user/user",
        name: "User",
        title: "用户管理",
        group: "settings",
        icon: "table",
        view: "users",
        roles: ["ROLE_ADMIN"],
        description: "维护用户账号、角色与执行器权限。"
    }
];

(function () {
    function load(view, require) {
        return function () {
            return window.DataxPageComponents.load(view, require).then(function (options) {
                return window.DataxUI.page(options, view);
            });
        };
    }

    function record(item, path, require) {
        return {
            path: path, name: item.name, component: load(item.view, require), meta: {
                title: item.title, icon: item.icon, roles: item.roles, affix: item.affix, noCache: item.noCache
            }
        };
    }

    window.DataxUI.constantRoutes = function (layout, require) {
        return [
            {
                path: "/redirect",
                component: layout,
                hidden: true,
                children: [{
                    path: "/redirect/:path*", component: function () {
                        return Promise.resolve(require('views/redirect/index').default);
                    }
                }]
            },
            {path: "/login", hidden: true, component: load("login", require)},
            {
                path: "/auth-redirect", hidden: true, component: function () {
                    return Promise.resolve(require('views/login/auth-redirect').default);
                }
            },
            {path: "/404", hidden: true, component: load("not-found", require)},
            {path: "/401", hidden: true, component: load("forbidden", require)},
            {
                path: "/",
                component: layout,
                redirect: "/dashboard",
                children: [record(window.DataxRouteCatalog.find(function(item) { return item.path === "/dashboard"; }), "dashboard", require)]
            }
        ];
    };
    window.DataxUI.businessRoutes = function (layout, require) {
        var groups = {}, result = [];
        window.DataxRouteCatalog.filter(function (item) {
            return item.path !== "/dashboard";
        }).forEach(function (item) {
            var index = item.path.lastIndexOf("/"), parentPath = item.path.slice(0, index);
            if (!groups[parentPath]) {
                var parent = {
                    path: parentPath, component: layout, redirect: item.path, name: "Area_" + item.name,
                    meta: {title: item.title, roles: item.roles}, children: []
                };
                groups[parentPath] = parent;
                result.push(parent);
            }
            groups[parentPath].children.push(record(item, item.path.slice(index + 1), require));
        });
        groups["/datax/job"].children.push({
            path: "configTemplateEdit/:templateKey",
            name: "DataxConfigTemplateEditor",
            hidden: true,
            component: load("templateEditor", require),
            meta: {title: "模板配置编辑", activeMenu: "/datax/job/configTemplate", noCache: true}
        });
        result.push({
            path: "/profile",
            component: layout,
            redirect: "/profile/index",
            hidden: true,
            children: [{
                path: "index",
                name: "Profile",
                component: load("profile", require),
                meta: {title: "当前账号", noCache: true}
            }]
        });
        result.push({path: "/error/401", redirect: "/401", hidden: true});
        result.push({path: "/error/404", redirect: "/404", hidden: true});
        result.push({
            path: "/data/log", hidden: true, component: function () {
                return Promise.resolve(require('views/datax/jobLog/log').default);
            }, meta: {title: "任务日志"}
        });
        result.push({path: "*", redirect: "/404", hidden: true});
        return result;
    };
})();
