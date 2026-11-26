/* Vue 2 / Element UI workspace navigation for the compiled upstream frontend.
 * Build menus from permission-filtered routes; never register these menu groups as routes. */
(window.webpackJsonp = window.webpackJsonp || []).push([["datax-navigation"], {
    "datax-navigation": function (module) {
        "use strict";
        var groups = [
            {key: "monitor", title: "运行监控", icon: "dashboard"},
            {key: "tasks", title: "任务中心", icon: "task-cfg"},
            {key: "templates", title: "模板中心", icon: "task-tmp"},
            {key: "settings", title: "系统配置", icon: "exe-cfg"}
        ];
        var pages = [
            {path: "/dashboard", group: "monitor", title: "运行报表", description: "查看任务运行情况与执行统计。"},
            {
                path: "/datax/log/jobLog",
                group: "monitor",
                title: "执行日志",
                description: "查询任务执行记录，定位失败原因。"
            },
            {
                path: "/datax/registry/registry",
                group: "monitor",
                title: "资源监控",
                description: "查看执行节点的资源使用情况。"
            },
            {
                path: "/datax/job/jobInfo",
                group: "tasks",
                title: "任务列表",
                description: "管理同步任务、调度计划与执行状态。"
            },
            {
                path: "/datax/job/jsonBuild",
                group: "tasks",
                title: "单任务构建",
                description: "选择读写数据源并配置字段映射，构建同步任务。"
            },
            {
                path: "/datax/job/jsonBuildBatch",
                group: "tasks",
                title: "批量任务构建",
                description: "按表批量构建同步任务。"
            },
            {
                path: "/datax/job/jobTemplate",
                group: "templates",
                title: "调度任务模板",
                description: "管理用于创建调度任务的配置模板。"
            },
            {path: "/datax/job/configTemplate", group: "templates", title: "JSON 配置批次", ownHeading: true},
            {
                path: "/datax/project/jobProject",
                group: "settings",
                title: "项目管理",
                description: "维护项目与数据源绑定，按业务组织同步任务。"
            },
            {
                path: "/datax/datasource/jdbcDatasource",
                group: "settings",
                title: "数据源管理",
                description: "维护业务数据库连接，供任务构建和模板生成使用。"
            },
            {
                path: "/datax/executor/executor",
                group: "settings",
                title: "执行器管理",
                description: "管理执行器分组与任务执行节点。"
            },
            {path: "/datax/user/user", group: "settings", title: "用户管理", description: "管理用户账号与访问权限。"}
        ];

        function pageAt(path) {
            return pages.filter(function (page) {
                return page.path === path;
            })[0];
        }

        function groupAt(key) {
            return groups.filter(function (group) {
                return group.key === key;
            })[0];
        }

        function joinPath(parent, path) {
            if (/^(https?:|mailto:|tel:)/.test(path)) return path;
            return (path.charAt(0) === "/" ? path : parent + "/" + path).replace(/\/{2,}/g, "/");
        }

        function copyRoute(route, path) {
            return Object.assign({}, route, {path: path, meta: Object.assign({}, route.meta)});
        }

        function buildMenu(routes) {
            var available = Object.create(null);

            // Keep future routes visible rather than silently dropping unmapped features.
            function visit(route, parent) {
                if (route.hidden) return null;
                var path = joinPath(parent, route.path), page = pageAt(path), copy = copyRoute(route, path);
                if (page) {
                    copy.meta.title = page.title;
                    available[path] = copy;
                    return null;
                }
                if (route.children) {
                    copy.children = route.children.map(function (child) {
                        return visit(child, path);
                    }).filter(Boolean);
                    if (!copy.children.length) return null;
                }
                return copy;
            }

            var extra = routes.map(function (route) {
                return visit(route, "");
            }).filter(Boolean);
            return groups.map(function (group) {
                var children = pages.filter(function (page) {
                    return page.group === group.key && available[page.path];
                })
                    .map(function (page) {
                        return available[page.path];
                    });
                return {
                    path: "/__menu/" + group.key, name: "DataxMenu_" + group.key, alwaysShow: true,
                    meta: {title: group.title, icon: group.icon}, children: children
                };
            }).filter(function (group) {
                return group.children.length;
            }).concat(extra);
        }

        function breadcrumbs(route) {
            var active = route.meta && route.meta.activeMenu || route.path, page = pageAt(active);
            if (!page) {
                return (route.matched || []).filter(function (item) {
                    return item.meta && item.meta.title && item.meta.breadcrumb !== false;
                });
            }
            var group = groupAt(page.group), items = [
                {path: "/__menu/" + group.key, redirect: "noRedirect", meta: {title: group.title}},
                {path: page.path, meta: {title: page.title}}
            ];
            if (active !== route.path) items.push({path: route.path, meta: {title: route.meta.title || "配置编辑"}});
            return items;
        }

        var WorkspaceHeading = {
            name: "DataxWorkspaceHeading",
            computed: {
                page: function () {
                    return pageAt(this.$route.path);
                }
            },
            render: function (h) {
                var page = this.page;
                if (!page || page.ownHeading) return null;
                return h("header", {class: "datax-workspace-heading"}, [
                    h("h1", [page.title]), h("p", [page.description])
                ]);
            }
        };
        module.exports = {buildMenu: buildMenu, breadcrumbs: breadcrumbs, WorkspaceHeading: WorkspaceHeading};
    }
}]);
