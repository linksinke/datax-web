/* The upstream datasource page keeps its list and model; this renders its Vue/Element dialog.
 * Render with the parent's createElement so the existing dataForm ref remains on that parent. */
(window.webpackJsonp = window.webpackJsonp || []).push([["datax-datasource-form"], {
    "datax-datasource-form": function (module, exports, require) {
        "use strict";
        var request = require("b775").a;

        function busy(vm) {
            return vm.datasourceSaving || vm.datasourceTesting;
        }

        function validate(vm) {
            return new Promise(function (resolve) {
                vm.$refs.dataForm.validate(function (valid) {
                    resolve(!!valid);
                });
            });
        }

        function payload(vm) {
            return Object.assign({}, vm.temp);
        }

        function notify(vm, title, message, type) {
            vm.$notify({title: title, message: message, type: type, duration: 3000});
        }

        async function save(vm, method) {
            if (busy(vm)) return;
            vm.datasourceSaving = true;
            try {
                if (!await validate(vm)) return;
                var ok = await request({url: "/api/jobJdbcDatasource", method: method, data: payload(vm)});
                if (ok !== true) throw new Error("保存失败，请检查配置后重试");
                vm.dialogFormVisible = false;
                notify(vm, "保存成功", method === "post" ? "数据源已添加" : "数据源已更新", "success");
                vm.fetchData();
            } catch (error) {
                notify(vm, "保存失败", error.message || "请检查配置后重试", "error");
            } finally {
                vm.datasourceSaving = false;
            }
        }

        async function testConnection(vm) {
            if (busy(vm)) return;
            vm.datasourceTesting = true;
            vm.connectionResult = null;
            try {
                if (!await validate(vm)) return;
                var ok = await request({url: "/api/jobJdbcDatasource/test", method: "post", data: payload(vm)});
                vm.connectionResult = ok === true ? {type: "success", message: "连接成功，当前配置可以连接数据库。"}
                    : {type: "error", message: "连接失败，请检查连接地址和账号信息。"};
            } catch (error) {
                vm.connectionResult = {type: "error", message: error.message || "连接失败，请检查配置后重试。"};
            } finally {
                vm.datasourceTesting = false;
            }
        }

        function renderDialog(h, vm) {
            var mongo = vm.temp.datasource === "mongodb", hbase = vm.temp.datasource === "hbase",
                jdbc = !mongo && !hbase;

            function changed(key, value) {
                vm.$set(vm.temp, key, value);
                vm.connectionResult = null;
            }

            function input(key, props, attrs, children) {
                return h("el-input", {
                    props: Object.assign({value: vm.temp[key]}, props), attrs: attrs,
                    on: {
                        input: function (value) {
                            changed(key, value);
                        }
                    }
                }, children);
            }

            function field(label, prop, control, full, hint) {
                return h("el-form-item", {
                    class: {"datax-ds-full": !!full}, props: {label: label, prop: prop}
                }, [control, hint ? h("p", {class: "datax-ds-hint"}, [hint]) : null]);
            }

            function section(title, fields) {
                return h("section", {class: "datax-ds-section"}, [
                    h("h3", {class: "datax-ds-section-title"}, [title]), h("div", {class: "datax-ds-grid"}, fields)
                ]);
            }

            function button(text, action, props) {
                return h("el-button", {props: Object.assign({size: "small"}, props), on: {click: action}}, [text]);
            }

            var connection = [];
            if (jdbc) {
                connection.push(field("JDBC URL", "jdbcUrl", input("jdbcUrl", {
                    type: "textarea",
                    rows: 3,
                    resize: "none",
                    placeholder: "例如：jdbc:mysql://127.0.0.1:3306/business"
                }, {spellcheck: "false"}), true));
                connection.push(field("JDBC 驱动类", "jdbcDriverClass", input("jdbcDriverClass", {placeholder: "例如：com.mysql.jdbc.Driver"}, {spellcheck: "false"}), true));
            } else if (mongo) {
                connection.push(field("MongoDB 连接地址", "jdbcUrl", input("jdbcUrl", {
                    type: "textarea",
                    rows: 3,
                    resize: "none",
                    placeholder: "mongodb://127.0.0.1:27017"
                }, {spellcheck: "false"}), true));
                connection.push(field("数据库名称", "databaseName", input("databaseName", {placeholder: "填写要连接的数据库名称"}), true));
            } else {
                connection.push(field("ZooKeeper 地址", "zkAdress", input("zkAdress", {
                    type: "textarea",
                    rows: 2,
                    resize: "none",
                    placeholder: "127.0.0.1:2181"
                }, {spellcheck: "false"}), true, "多个节点使用逗号分隔。"));
            }
            var sections = [
                section("基础信息", [
                    field("数据源名称", "datasourceName", input("datasourceName", {placeholder: "例如：生产业务库、迁移目标库"})),
                    field("数据库类型", "datasource", h("el-select", {
                        props: {value: vm.temp.datasource, placeholder: "请选择数据库类型"}, on: {
                            input: function (value) {
                                if (value === vm.temp.datasource) return;
                                changed("datasource", value);
                                vm.selectDataSource(value);
                                vm.$nextTick(function () {
                                    if (vm.$refs.dataForm) vm.$refs.dataForm.clearValidate();
                                });
                            }
                        }
                    }, vm.dataSources.map(function (type) {
                        return h("el-option", {key: type.value, props: {value: type.value, label: type.label}});
                    }))),
                    field("数据源分组", "datasourceGroup", input("datasourceGroup", {placeholder: "例如：生产环境、测试环境；默认 Default"}), true)
                ]),
                section("连接配置", connection)
            ];
            if (jdbc) sections.push(section("登录凭据", [
                // Account fields were optional in the original dialog, including passwordless connections.
                field("用户名", undefined, input("jdbcUsername", {placeholder: "数据库用户名"}, {
                    autocomplete: "off",
                    spellcheck: "false"
                })),
                field("密码", undefined, input("jdbcPassword", {
                    type: vm.visible ? "password" : "text",
                    placeholder: "数据库密码"
                }, {autocomplete: "new-password"}, [
                    h("button", {
                        class: "datax-ds-password-toggle", slot: "suffix", attrs: {
                            type: "button",
                            title: vm.visible ? "显示密码" : "隐藏密码",
                            "aria-label": vm.visible ? "显示密码" : "隐藏密码",
                            "aria-pressed": String(!vm.visible),
                            disabled: busy(vm)
                        }, on: {
                            click: function () {
                                vm.changePass(vm.visible ? "show" : "hide");
                            }
                        }
                    }, [h("i", {class: vm.visible ? "el-icon-view" : "el-icon-check"})])
                ]))
            ]));
            sections.push(section("备注", [field("备注说明", undefined,
                input("comments", {
                    type: "textarea",
                    rows: 2,
                    resize: "none",
                    placeholder: "记录数据源用途、所属业务或其他说明（选填）"
                }), true)]));
            return h("el-dialog", {
                class: "datax-datasource-dialog", props: {
                    title: vm.dialogStatus === "create" ? "新增数据源" : "编辑数据源",
                    visible: vm.dialogFormVisible,
                    width: "980px",
                    top: "5vh",
                    closeOnClickModal: false,
                    closeOnPressEscape: !busy(vm),
                    beforeClose: function (done) {
                        if (!busy(vm)) done();
                    }
                }, on: {
                    "update:visible": function (visible) {
                        if (!busy(vm)) vm.dialogFormVisible = visible;
                    }
                }
            }, [
                h("el-form", {
                    ref: "dataForm", class: "datax-datasource-form", props: {
                        rules: vm.rules, model: vm.temp, labelPosition: "top", size: "small", disabled: busy(vm)
                    }, on: {
                        submit: function (event) {
                            event.preventDefault();
                        }
                    }
                }, sections),
                h("div", {slot: "footer", class: "datax-ds-footer-wrap"}, [
                    vm.connectionResult ? h("el-alert", {
                        class: "datax-ds-connection-result", props: {
                            title: vm.connectionResult.message,
                            type: vm.connectionResult.type,
                            closable: false,
                            showIcon: true
                        }
                    }) : null,
                    h("div", {class: "datax-ds-footer"}, [
                        button(vm.datasourceTesting ? "正在测试…" : "测试连接", function () {
                            vm.testDataSource();
                        }, {loading: vm.datasourceTesting, disabled: vm.datasourceSaving, icon: "el-icon-refresh"}),
                        h("div", {class: "datax-ds-footer-actions"}, [
                            button("取消", function () {
                                vm.dialogFormVisible = false;
                            }, {disabled: busy(vm)}),
                            button(vm.dialogStatus === "create" ? "保存数据源" : "保存修改", function () {
                                    vm.dialogStatus === "create" ? vm.createData() : vm.updateData();
                                },
                                {type: "primary", loading: vm.datasourceSaving, disabled: vm.datasourceTesting})
                        ])
                    ])
                ])
            ]);
        }

        module.exports = {renderDialog: renderDialog, save: save, testConnection: testConnection};
    }
}]);
