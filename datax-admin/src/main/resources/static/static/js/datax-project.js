/* Readable Vue 2 + Element UI project page. */
(window.webpackJsonp = window.webpackJsonp || []).push([["datax-project"], {
    "datax-project": function (module, exports, require) {
        "use strict";
        var request = require("b775").a;

        function api(url, method, data, params) {
            return request({url: url, method: method || "get", data: data, params: params});
        }

        function button(h, label, action, props) {
            return h("el-button", {
                class: props && props.class,
                props: Object.assign({size: "small"}, props),
                on: {click: action}
            }, [label]);
        }

        function availability(source) {
            return source.status === 1 ? "" : source.status === 2 ? "已禁用" : source.status === 0 ? "已删除" : "不可用";
        }

        function label(source) {
            return (source.datasourceName || "数据源 #" + source.id) + "（" + (availability(source) || source.datasource || "未知类型") + "）";
        }

        module.exports = {
            name: "jobProject",
            data: function () {
                return {
                    rows: [],
                    total: 0,
                    keyword: "",
                    current: 1,
                    size: 10,
                    loading: false,
                    listError: "",
                    fetchVersion: 0,
                    hasActivated: false,
                    dialogVisible: false,
                    dialogLoading: false,
                    dialogError: "",
                    dialogVersion: 0,
                    mode: "create",
                    saving: false,
                    availableSources: [],
                    form: {id: null, name: "", description: "", datasourceIds: [], datasources: []}
                };
            },
            computed: {
                sourceOptions: function () {
                    var options = this.availableSources.slice();
                    this.form.datasources.forEach(function (source) {
                        if (!options.some(function (option) {
                            return option.id === source.id;
                        })) options.push(source);
                    });
                    return options;
                },
                selectedSources: function () {
                    var options = this.sourceOptions;
                    return this.form.datasourceIds.map(function (id) {
                        return options.find(function (source) {
                            return source.id === id;
                        }) || {id: id};
                    });
                }
            },
            created: function () {
                this.fetch();
            },
            activated: function () {
                if (this.hasActivated) this.fetch(); else this.hasActivated = true;
            },
            methods: {
                fetch: async function () {
                    var vm = this, version = ++vm.fetchVersion;
                    vm.loading = true;
                    vm.listError = "";
                    try {
                        var page = await api("/api/jobProject", "get", null, {
                            pageNo: vm.current,
                            pageSize: vm.size,
                            searchVal: vm.keyword
                        });
                        if (version === vm.fetchVersion) {
                            vm.rows = page.records;
                            vm.total = page.total;
                        }
                    } catch (error) {
                        if (version === vm.fetchVersion) vm.listError = error.message || "项目加载失败，请重试";
                    } finally {
                        if (version === vm.fetchVersion) vm.loading = false;
                    }
                },
                search: function () {
                    this.current = 1;
                    return this.fetch();
                },
                open: async function (mode, row) {
                    var vm = this, version = ++vm.dialogVersion;
                    vm.mode = mode;
                    vm.dialogVisible = true;
                    vm.dialogLoading = true;
                    vm.dialogError = "";
                    vm.form = {
                        id: row ? row.id : null,
                        name: row ? row.name : "",
                        description: "",
                        datasourceIds: [],
                        datasources: []
                    };
                    try {
                        var result = await Promise.all([api("/api/jobJdbcDatasource/all"), row ? api("/api/jobProject/" + row.id) : Promise.resolve(null)]);
                        if (version !== vm.dialogVersion) return;
                        vm.availableSources = result[0].filter(function (source) {
                            return source.status === 1;
                        });
                        if (result[1]) {
                            var project = result[1];
                            vm.form = {
                                id: project.id,
                                name: project.name,
                                description: project.description || "",
                                datasourceIds: (project.datasourceIds || []).slice(),
                                datasources: project.datasources || []
                            };
                        }
                    } catch (error) {
                        if (version === vm.dialogVersion) vm.dialogError = error.message || "数据源加载失败，请关闭后重试";
                    } finally {
                        if (version === vm.dialogVersion) vm.dialogLoading = false;
                    }
                },
                close: function () {
                    if (!this.saving) {
                        ++this.dialogVersion;
                        this.dialogVisible = false;
                    }
                },
                save: async function () {
                    var vm = this;
                    if (vm.saving || vm.dialogLoading || vm.dialogError) return;
                    if (!vm.form.name.trim()) {
                        vm.$message.warning("请填写项目名称");
                        return;
                    }
                    vm.saving = true;
                    try {
                        var bindingOnly = vm.mode === "bindings";
                        var body = bindingOnly ? {datasourceIds: vm.form.datasourceIds.slice()} : {
                            id: vm.form.id || 0,
                            name: vm.form.name.trim(),
                            description: vm.form.description,
                            datasourceIds: vm.form.datasourceIds.slice()
                        };
                        var ok = await api(bindingOnly ? "/api/jobProject/" + vm.form.id + "/datasources" : "/api/jobProject",
                            vm.mode === "create" ? "post" : "put", body);
                        if (!ok) throw new Error("保存失败，请刷新后重试");
                        vm.dialogVisible = false;
                        vm.$message.success(bindingOnly ? "数据源绑定已保存" : "项目已保存");
                        await vm.fetch();
                    } catch (error) {
                        vm.$message.error(error.message || "保存失败，请重试");
                    } finally {
                        vm.saving = false;
                    }
                },
                remove: async function (row) {
                    try {
                        await this.$confirm("确认删除项目“" + row.name + "”及其数据源绑定？", "删除项目", {
                            type: "warning",
                            confirmButtonText: "删除",
                            cancelButtonText: "取消"
                        });
                    } catch (cancel) {
                        return;
                    }
                    try {
                        var ok = await api("/api/jobProject", "delete", null, {idList: row.id});
                        if (!ok) throw new Error("删除失败，请刷新后重试");
                        if (this.rows.length === 1 && this.current > 1) --this.current;
                        this.$message.success("项目已删除");
                        await this.fetch();
                    } catch (error) {
                        this.$message.error(error.message || "删除失败，请重试");
                    }
                },
                generate: function (row) {
                    this.$router.push({
                        path: "/datax/job/configTemplateEdit/new-" + Date.now(),
                        query: {projectId: row.id, name: row.name}
                    });
                }
            },
            render: function (h) {
                var vm = this;

                function column(label, prop, width, render) {
                    return h("el-table-column", {
                        props: {
                            label: label,
                            prop: prop,
                            width: width,
                            minWidth: width ? undefined : 170,
                            showOverflowTooltip: !render
                        },
                        scopedSlots: render ? {
                            default: function (scope) {
                                return render(scope.row, scope.$index);
                            }
                        } : undefined
                    });
                }

                function input(value, change, props) {
                    return h("el-input", {props: Object.assign({value: value}, props), on: {input: change}});
                }

                function field(title, child) {
                    return h("el-form-item", {props: {label: title}}, [child]);
                }

                function sourceTag(source) {
                    return h("el-tag", {
                        key: source.id,
                        props: {size: "small", type: source.status === 1 ? "" : "info"}
                    }, [label(source)]);
                }

                var bindingOnly = vm.mode === "bindings";
                return h("div", {class: "app-container datax-project-page"}, [
                    h("div", {class: "filter-container"}, [
                        h("el-input", {
                            props: {value: vm.keyword, clearable: true, size: "small", placeholder: "搜索项目名称"},
                            style: {width: "260px"},
                            on: {
                                input: function (value) {
                                    vm.keyword = value;
                                }, clear: vm.search
                            },
                            nativeOn: {
                                keyup: function (event) {
                                    if (event.key === "Enter") vm.search();
                                }
                            }
                        }),
                        button(h, "搜索", vm.search, {icon: "el-icon-search"}),
                        button(h, "新增项目", function () {
                            vm.open("create");
                        }, {type: "primary", icon: "el-icon-plus"})
                    ]),
                    vm.listError ? h("el-alert", {props: {title: vm.listError, type: "error", closable: false}}) : null,
                    h("el-table", {
                        props: {
                            data: vm.rows,
                            border: true,
                            rowKey: "id",
                            emptyText: vm.loading ? "正在加载…" : "暂无项目，点击“新增项目”创建并绑定数据源"
                        },
                        directives: [{name: "loading", value: vm.loading}]
                    }, [
                        column("序号", null, 65, function (row, index) {
                            return (vm.current - 1) * vm.size + index + 1;
                        }),
                        column("项目名称", "name"), column("项目描述", "description"),
                        column("已绑定数据源", null, null, function (row) {
                            var sources = row.datasources || [];
                            if (!sources.length) return h("span", {class: "datax-project-muted"}, ["未绑定"]);
                            return h("div", {class: "datax-project-tags"}, sources.slice(0, 3).map(sourceTag).concat(sources.length > 3 ? [
                                h("el-tooltip", {
                                    props: {
                                        content: sources.map(label).join("、"),
                                        placement: "top"
                                    }
                                }, [h("el-tag", {props: {size: "small", type: "info"}}, ["+" + (sources.length - 3)])])
                            ] : []));
                        }), column("所属用户", "userName", 120), column("创建时间", "createTime", 175),
                        column("操作", null, 305, function (row) {
                            return h("div", {class: "datax-project-actions"}, [
                                button(h, "绑定数据源", function () {
                                    vm.open("bindings", row);
                                }, {type: "primary", plain: true, size: "mini"}),
                                button(h, "生成 JSON", function () {
                                    vm.generate(row);
                                }, {type: "text", size: "mini", disabled: !(row.datasourceIds || []).length}),
                                button(h, "编辑", function () {
                                    vm.open("edit", row);
                                }, {type: "text", size: "mini"}),
                                button(h, "删除", function () {
                                    vm.remove(row);
                                }, {type: "text", size: "mini", class: "datax-project-delete"})
                            ]);
                        })
                    ]),
                    h("div", {class: "pagination-container"}, [h("el-pagination", {
                        props: {
                            total: vm.total,
                            currentPage: vm.current,
                            pageSize: vm.size,
                            pageSizes: [10, 20, 50, 100],
                            layout: "total, sizes, prev, pager, next, jumper",
                            background: true
                        },
                        on: {
                            "current-change": function (page) {
                                vm.current = page;
                                vm.fetch();
                            }, "size-change": function (size) {
                                vm.size = size;
                                vm.current = 1;
                                vm.fetch();
                            }
                        }
                    })]),
                    h("el-dialog", {
                        class: "datax-project-dialog", props: {
                            title: bindingOnly ? "绑定数据源 · " + vm.form.name : vm.mode === "create" ? "新增项目" : "编辑项目",
                            visible: vm.dialogVisible,
                            width: "680px",
                            closeOnClickModal: false,
                            closeOnPressEscape: !vm.saving,
                            beforeClose: function (done) {
                                if (!vm.saving) {
                                    vm.close();
                                    done();
                                }
                            }
                        }, on: {
                            "update:visible": function (visible) {
                                if (!visible) vm.close();
                            }
                        }
                    }, [
                        vm.dialogError ? h("el-alert", {
                            props: {
                                title: vm.dialogError,
                                type: "error",
                                closable: false
                            }
                        }) : null,
                        h("el-form", {
                            props: {labelPosition: "top", disabled: vm.saving || vm.dialogLoading || !!vm.dialogError},
                            directives: [{name: "loading", value: vm.dialogLoading}], on: {
                                submit: function (event) {
                                    event.preventDefault();
                                }
                            }
                        }, [
                            bindingOnly ? null : field("项目名称", input(vm.form.name, function (value) {
                                vm.form.name = value;
                            }, {maxlength: 100, showWordLimit: true, placeholder: "例如：陕西电信数据迁移"})),
                            bindingOnly ? null : field("项目描述", input(vm.form.description, function (value) {
                                vm.form.description = value;
                            }, {type: "textarea", rows: 2, maxlength: 200, showWordLimit: true})),
                            field("绑定数据源", h("el-select", {
                                    style: {width: "100%"}, props: {
                                        value: vm.form.datasourceIds,
                                        multiple: true,
                                        filterable: true,
                                        clearable: true,
                                        collapseTags: true,
                                        placeholder: "搜索并选择已有数据源，可多选",
                                        noDataText: "暂无可用数据源，请先到数据源管理创建"
                                    }, on: {
                                        input: function (ids) {
                                            vm.form.datasourceIds = ids;
                                        }
                                    }
                                },
                                vm.sourceOptions.map(function (source) {
                                    return h("el-option", {
                                        key: source.id,
                                        props: {value: source.id, label: label(source)}
                                    });
                                }))),
                            h("p", {class: "datax-project-muted"}, ["从数据源管理中选择，支持绑定多个数据源。"]),
                            h("div", {class: "datax-project-selected"}, vm.selectedSources.map(sourceTag)),
                            vm.selectedSources.some(function (source) {
                                return source.status !== 1;
                            }) ? h("el-alert", {
                                props: {
                                    type: "warning",
                                    closable: false,
                                    title: "部分绑定的数据源已不可用，可在上方取消选择；生成配置时仅使用可用数据源。"
                                }
                            }) : null
                        ]),
                        h("div", {slot: "footer"}, [button(h, "取消", vm.close, {disabled: vm.saving}),
                            button(h, bindingOnly ? "保存绑定" : "保存项目", vm.save, {
                                type: "primary",
                                loading: vm.saving,
                                disabled: vm.dialogLoading || !!vm.dialogError
                            })])
                    ])
                ]);
            }
        };
    }
}]);
