/* Readable Vue2 components for the upstream project's compiled-only frontend.
 * Metadata connections and runtime connections intentionally travel through different paths. */
(window.webpackJsonp = window.webpackJsonp || []).push([["datax-config-template"], {
    "datax-config-template": function (module, exports, require) {
        "use strict";
        var request = require("b775").a;
        var token = require("5f87").a;
        var base = "/api/dataxConfigTemplate";
        var types = ["mysql", "oracle", "sqlserver", "postgresql", "clickhouse"];
        var nextKey = 0;

        function api(url, method, data) {
            return request({url: url, method: method || "get", data: data});
        }

        function clone(value) {
            return JSON.parse(JSON.stringify(value));
        }

        function normalize(name) {
            return (name || "").split(".").pop().toLowerCase();
        }

        function button(h, text, click, props) {
            return h("el-button", {props: Object.assign({size: "small"}, props), on: {click: click}}, [text]);
        }

        function field(h, label, child) {
            return h("el-form-item", {props: {label: label}}, [child]);
        }

        function input(h, value, change, props) {
            return h("el-input", {props: Object.assign({value: value}, props), on: {input: change}});
        }

        function select(h, value, change, values, props) {
            return h("el-select", {
                    style: {width: "100%"},
                    props: Object.assign({value: value, filterable: true}, props),
                    on: {input: change}
                },
                values.map(function (item) {
                    return h("el-option", {key: item.value, props: item});
                }));
        }

        function sources(vm, rows) {
            return (rows || vm.datasources).map(function (ds) {
                return {value: ds.id, label: ds.datasourceName + "（" + ds.datasource + "）"};
            });
        }

        function loadSources(vm) {
            return api("/api/jobJdbcDatasource/all").then(function (rows) {
                vm.datasources = rows.filter(function (ds) {
                    return types.indexOf(ds.datasource) >= 0 && ds.status === 1;
                });
            });
        }

        function saveBlob(blob, fileName) {
            var url = URL.createObjectURL(blob), anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(function () {
                URL.revokeObjectURL(url);
            }, 1000);
        }

        function download(dto) {
            saveBlob(new Blob([JSON.stringify(JSON.parse(dto.jobJson), null, 2)], {type: "application/json;charset=utf-8"}), dto.fileName || dto.name + ".json");
        }

        async function downloadZip(ids, vm) {
            if (!ids.length) {
                vm.$message.warning("请先选择生成记录");
                return;
            }
            return downloadArchive(base + "/downloadBatch", "POST", ids, "datax-templates.zip");
        }

        async function downloadArchive(url, method, data, fileName) {
            // The shared JSON interceptor cannot handle binary responses; reuse its token for this ZIP endpoint.
            var options = {
                method: method,
                credentials: "same-origin",
                headers: {"Content-Type": "application/json", Authorization: token()}
            };
            if (data) options.body = JSON.stringify(data);
            var response = await fetch(url, options);
            if (!response.ok) throw new Error("下载失败，请检查登录状态后重试");
            if ((response.headers.get("content-type") || "").indexOf("application/zip") < 0) {
                var error = await response.json();
                throw new Error(error.msg || "下载失败");
            }
            saveBlob(await response.blob(), fileName);
        }

        function createJsonEditorCore(CodeMirror) {
            return {
                name: "DataxJsonCodeEditor", props: {value: {type: String, default: ""}, readOnly: Boolean},
                data: function () {
                    return {error: "", errorLine: null};
                },
                mounted: function () {
                    var vm = this;
                    vm.cm = CodeMirror.fromTextArea(vm.$refs.textarea, {
                        value: vm.value, lineNumbers: true, mode: "application/json", theme: "default",
                        lineWrapping: false, tabSize: 2, indentUnit: 2, readOnly: vm.readOnly, viewportMargin: 15,
                        extraKeys: {
                            "Ctrl-S": function () {
                                vm.$emit("save");
                            }, "Cmd-S": function () {
                                vm.$emit("save");
                            },
                            "Ctrl-Shift-F": function () {
                                vm.$emit("format");
                            }, "Cmd-Shift-F": function () {
                                vm.$emit("format");
                            }
                        }
                    });
                    vm.cm.setValue(vm.value);
                    vm.changeHandler = function () {
                        vm.$emit("input", vm.cm.getValue());
                        vm.validate();
                    };
                    vm.cm.on("change", vm.changeHandler);
                    vm.validate();
                    if (typeof ResizeObserver !== "undefined") {
                        vm.resizeObserver = new ResizeObserver(function () {
                            vm.cm.refresh();
                        });
                        vm.resizeObserver.observe(vm.$el);
                    }
                    vm.$nextTick(function () {
                        vm.cm.refresh();
                    });
                },
                watch: {
                    value: function (value) {
                        if (!this.cm || value === this.cm.getValue()) return;
                        this.cm.off("change", this.changeHandler);
                        this.cm.setValue(value);
                        this.cm.on("change", this.changeHandler);
                        this.validate();
                    },
                    readOnly: function (value) {
                        if (this.cm) this.cm.setOption("readOnly", value);
                    }
                },
                beforeDestroy: function () {
                    if (this.resizeObserver) this.resizeObserver.disconnect();
                    if (this.cm) {
                        this.cm.off("change", this.changeHandler);
                        this.cm.toTextArea();
                    }
                },
                methods: {
                    refresh: function () {
                        if (this.cm) this.cm.refresh();
                    },
                    validate: function () {
                        if (this.errorLine !== null) this.cm.removeLineClass(this.errorLine, "background", "datax-json-error-line");
                        this.errorLine = null;
                        this.error = "";
                        try {
                            JSON.parse(this.cm.getValue());
                        } catch (error) {
                            this.error = "JSON 格式错误：" + error.message;
                            var position = /position\s+(\d+)/i.exec(error.message);
                            var line = /line\s+(\d+)/i.exec(error.message);
                            this.errorLine = position ? this.cm.posFromIndex(Number(position[1])).line : line ? Number(line[1]) - 1 : 0;
                            this.cm.addLineClass(this.errorLine, "background", "datax-json-error-line");
                        }
                        this.$emit("validation", this.error);
                    }
                },
                render: function (h) {
                    return h("div", {class: "datax-code-editor"}, [h("textarea", {
                        ref: "textarea",
                        attrs: {"aria-label": "当前模板 JSON 编辑器"}
                    }),
                        h("div", {
                            class: {
                                "datax-code-status": true,
                                "has-error": !!this.error
                            }
                        }, [this.error || "JSON 格式正确 · Ctrl+S 保存 · Ctrl+Shift+F 格式化"])]);
                }
            };
        }

        function createJsonEditor(CodeMirror) {
  var options = createJsonEditorCore(CodeMirror);
  return window.DataxUI ? window.DataxUI.apply(options, "json-editor") : options;
}

        var JsonCodeEditor = function () {
            return require.e("chunk-52071f51").then(function () {
                var imported = require("56b3");
                ["0dd0", "a7be", "acdf", "f9d4", "8822", "d2de", "ae67"].forEach(function (id) {
                    require(id);
                });
                return createJsonEditor(imported.default || imported);
            });
        };

        function newSelection(table, actual, columns) {
            return {
                metadataTable: table, actualTable: actual || table, columns: columns ? columns.slice() : [],
                availableColumns: [], loaded: false, custom: !!columns, loading: false, error: ""
            };
        }

        function newPair() {
            return {key: "pair-" + (++nextKey), reader: null, writer: null, original: null};
        }

        var List = {
            name: "DataxConfigTemplateList",
            data: function () {
                return {
                    rows: [],
                    total: 0,
                    current: 1,
                    keyword: "",
                    loading: false,
                    downloading: false,
                    datasources: [],
                    selected: [],
                    batch: null,
                    downloadingId: "",
                    fetchVersion: 0
                };
            },
            created: function () {
                this.fetch();
                loadSources(this).catch(function () {
                });
            },
            watch: {
                "$route.query.batchId": function () {
                    this.current = 1;
                    this.keyword = "";
                    this.fetch();
                }
            },
            methods: {
                fetch: function () {
                    var vm = this, version = ++vm.fetchVersion;
                    vm.loading = true;
                    vm.rows = [];
                    vm.batch = null;
                    vm.selected = [];
                    var batchId = vm.$route.query.batchId;
                    return request({
                        url: batchId ? base : base + "/batches",
                        params: {keyword: vm.keyword, current: vm.current, size: 10, batchId: batchId}
                    })
                        .then(function (data) {
                            if (version !== vm.fetchVersion) return;
                            vm.rows = data.records;
                            vm.total = data.total;
                            vm.selected = [];
                            vm.batch = data.batch || null;
                        })
                        .catch(function () {
                        }).finally(function () {
                            if (version === vm.fetchVersion) vm.loading = false;
                        });
                },
                newTemplate: function () {
                    this.$router.push({path: "/datax/job/configTemplateEdit/new-" + Date.now()});
                },
                open: function (row) {
                    this.$router.push({
                        path: "/datax/job/configTemplateEdit/" + row.id,
                        query: {id: row.id, batchId: this.$route.query.batchId}
                    });
                },
                openBatch: function (row) {
                    this.$router.push({path: "/datax/job/configTemplate", query: {batchId: row.id}});
                },
                back: function () {
                    this.$router.push({path: "/datax/job/configTemplate"});
                },
                downloadGroup: async function (row) {
                    this.downloadingId = row.id;
                    try {
                        await downloadArchive(base + "/batches/" + encodeURIComponent(row.id) + "/download", "GET", null, row.batchCode + ".zip");
                    } catch (error) {
                        this.$message.error(error.message);
                    } finally {
                        this.downloadingId = "";
                    }
                },
                remove: function (row) {
                    var vm = this;
                    return vm.$confirm("删除配置记录“" + row.name + "”？", "删除模板", {type: "warning"})
                        .then(function () {
                            return api(base + "/" + row.id, "delete");
                        }).then(function () {
                            vm.$message.success("已删除");
                            if (vm.rows.length === 1 && vm.current > 1) vm.current--;
                            return vm.fetch();
                        }).catch(function () {
                        });
                },
                download: function (row) {
                    return api(base + "/" + row.id).then(download).catch(function () {
                    });
                },
                downloadSelected: function () {
                    var vm = this;
                    vm.downloading = true;
                    return downloadZip(vm.selected.map(function (row) {
                        return row.id;
                    }), vm)
                        .catch(function (e) {
                            vm.$message.error(e.message);
                        }).finally(function () {
                            vm.downloading = false;
                        });
                },
                sourceName: function (id) {
                    var ds = this.datasources.find(function (item) {
                        return item.id === id;
                    });
                    return ds ? ds.datasourceName : "ID: " + id;
                }
            },
            render: function (h) {
                var vm = this, detail = !!vm.$route.query.batchId;

                function col(label, prop, width, render) {
                    return h("el-table-column", {
                        props: {label: label, prop: prop, width: width, showOverflowTooltip: true},
                        scopedSlots: render ? {
                            default: function (scope) {
                                return render(scope.row);
                            }
                        } : undefined
                    });
                }

                return h("div", {class: "app-container datax-config-page"}, [
                    h("div", {class: "datax-batch-heading"}, [detail ? button(h, "返回批次列表", vm.back) : null,
                        h("h2", [detail ? (vm.batch ? vm.batch.batchCode : "批次") + " / 模板" : "JSON 配置批次"])]),
                    h("p", {class: "datax-config-muted"}, [detail ? "本批共 " + vm.total + " 份模板，点击文件预览或直接下载整个批次。" : "批次编码自动生成。点击批次查看模板，也可以直接下载整批 ZIP。"]),
                    h("div", {class: "datax-config-toolbar"}, [
                        input(h, vm.keyword, function (v) {
                            vm.keyword = v;
                        }, {
                            placeholder: detail ? "表名 / JSON 文件名" : "批次编码 / 批次说明",
                            clearable: true,
                            size: "small"
                        }),
                        button(h, "查询", function () {
                            vm.current = 1;
                            vm.fetch();
                        }, {loading: vm.loading}),
                        button(h, "批量生成模板", vm.newTemplate, {type: "primary"}),
                        detail && vm.batch ? button(h, "下载整个批次", function () {
                            vm.downloadGroup(vm.batch);
                        }, {loading: vm.downloadingId === vm.batch.id}) : null,
                        detail ? button(h, "下载所选（" + vm.selected.length + "）", vm.downloadSelected, {
                            disabled: !vm.selected.length,
                            loading: vm.downloading
                        }) : null
                    ]),
                    h("el-table", {
                        props: {
                            data: vm.rows,
                            border: true,
                            rowKey: "id",
                            emptyText: vm.loading ? "正在加载…" : "暂无生成记录"
                        },
                        on: {
                            "selection-change": function (rows) {
                                vm.selected = rows;
                            }
                        }
                    }, [].concat(detail ? [h("el-table-column", {
                        props: {
                            type: "selection",
                            width: 45
                        }
                    }), col("JSON 文件名", "fileName", 450),
                        col("实际源库 → 目标库", null, 220, function (r) {
                            return h("span", [vm.sourceName(r.readerDatasourceId) + " → " + vm.sourceName(r.writerDatasourceId)]);
                        }),
                        col("源表 → 目标表", null, 220, function (r) {
                            return h("span", [r.readerTable + " → " + r.writerTable]);
                        }),
                        col("更新时间", "updateTime", 170), col("操作", null, 230, function (r) {
                            return [button(h, "预览 / 编辑", function () {
                                vm.open(r);
                            }, {type: "text"}),
                                button(h, "下载", function () {
                                    vm.download(r);
                                }, {type: "text"}), button(h, "删除", function () {
                                    vm.remove(r);
                                }, {type: "text"})];
                        })
                    ] : [col("批次编码", "batchCode", 235, function (r) {
                        return button(h, r.batchCode, function () {
                            vm.openBatch(r);
                        }, {type: "text"});
                    }),
                        col("批次说明", "name"), col("模板数量", "templateCount", 120), col("生成时间", "createTime", 190),
                        col("操作", null, 240, function (r) {
                            return [button(h, "查看模板", function () {
                                vm.openBatch(r);
                            }, {type: "text"}),
                                button(h, "下载批次 ZIP", function () {
                                    vm.downloadGroup(r);
                                }, {type: "primary", loading: vm.downloadingId === r.id})];
                        })])),
                    h("el-pagination", {
                        style: {marginTop: "20px"},
                        props: {
                            currentPage: vm.current,
                            pageSize: 10,
                            total: vm.total,
                            layout: "total, prev, pager, next"
                        },
                        on: {
                            "current-change": function (page) {
                                vm.current = page;
                                vm.fetch();
                            }
                        }
                    })
                ]);
            }
        };
        var Editor = {
            name: "DataxConfigTemplateEditor",
            data: function () {
                return {
                    id: null,
                    version: null,
                    name: "",
                    description: "",
                    datasources: [],
                    pairs: [],
                    projects: [],
                    projectsLoaded: false,
                    projectId: null,
                    projectDatasourceIds: null,
                    projectLoading: false,
                    projectError: "",
                    projectRequest: 0,
                    readerDatasourceId: null,
                    writerDatasourceId: null,
                    readerMetadataDatasourceId: null,
                    writerMetadataDatasourceId: null,
                    readerTables: [],
                    writerTables: [],
                    readerSchemas: [],
                    writerSchemas: [],
                    readerSchema: "",
                    writerSchema: "",
                    readerFilter: "",
                    writerFilter: "",
                    activeReader: "",
                    activeWriter: "",
                    results: [],
                    savedJson: [],
                    previewIndex: 0,
                    loading: true,
                    generating: false,
                    saving: false,
                    downloading: false,
                    progress: "",
                    error: "",
                    initialized: false,
                    baseline: "",
                    generatedFingerprint: "",
                    metaSequence: {reader: 0, writer: 0},
                    buildVisible: true,
                    configurationOpen: false,
                    filePickerOpen: false,
                    jsonFullscreen: false,
                    jsonError: "",
                    batchId: "",
                    batchCode: "",
                    resultFilter: "",
                    columnCache: {},
                    options: {readerSplitPk: "", whereParams: "", querySql: "", preSql: "", postSql: ""}
                };
            },
            computed: {
                busy: function () {
                    return this.loading || this.generating || this.saving || this.projectLoading;
                },
                needsGenerate: function () {
                    return this.fingerprint() !== this.generatedFingerprint;
                },
                dirty: function () {
                    return this.initialized && this.snapshot() !== this.baseline;
                },
                runtimeSources: function () {
                    var vm = this;
                    return vm.projectId ? vm.datasources.filter(function (source) {
                        return (vm.projectDatasourceIds || []).indexOf(source.id) >= 0;
                    }) : vm.datasources;
                }
            },
            created: function () {
                this.init();
            },
            mounted: function () {
                var vm = this;
                this.unloadHandler = function (event) {
                    if (vm.dirty) {
                        event.preventDefault();
                        event.returnValue = "";
                    }
                };
                window.addEventListener("beforeunload", this.unloadHandler);
            },
            beforeDestroy: function () {
                window.removeEventListener("beforeunload", this.unloadHandler);
            },
            beforeRouteLeave: function (to, from, next) {
                this.confirmLeave(next);
            },
            beforeRouteUpdate: function (to, from, next) {
                var vm = this;
                this.confirmLeave(function (proceed) {
                    if (proceed === false) next(false); else {
                        next();
                        if (to.path === from.path) vm.init();
                    }
                });
            },
            methods: {
                confirmLeave: function (next) {
                    if (!this.dirty) return next();
                    return this.$confirm("当前配置有未保存的修改，是否离开？", "未保存的配置", {
                        type: "warning",
                        confirmButtonText: "离开",
                        cancelButtonText: "继续编辑"
                    })
                        .then(function () {
                            next();
                        }).catch(function () {
                            next(false);
                        });
                },
                configurations: function () {
                    var vm = this;
                    return vm.pairs.map(function (pair, index) {
                        return {
                            readerDatasourceId: vm.readerDatasourceId,
                            writerDatasourceId: vm.writerDatasourceId,
                            readerMetadataDatasourceId: vm.readerMetadataDatasourceId,
                            writerMetadataDatasourceId: vm.writerMetadataDatasourceId,
                            readerMetadataTable: pair.reader ? pair.reader.metadataTable : null,
                            writerMetadataTable: pair.writer ? pair.writer.metadataTable : null,
                            readerTables: pair.reader ? [pair.reader.actualTable] : [],
                            writerTables: pair.writer ? [pair.writer.actualTable] : [],
                            readerColumns: pair.reader ? pair.reader.columns.slice() : [],
                            writerColumns: pair.writer ? pair.writer.columns.slice() : [],
                            rdbmsReader: {
                                readerSplitPk: vm.options.readerSplitPk,
                                whereParams: vm.options.whereParams,
                                querySql: vm.options.querySql
                            },
                            rdbmsWriter: {preSql: vm.options.preSql, postSql: vm.options.postSql},
                            sequence: pair.original && vm.id ? pair.original.sequence : index + 1,
                            batchId: pair.original && vm.id ? pair.original.batchId : null,
                            batchName: pair.original && vm.id ? pair.original.batchName : null
                        };
                    });
                },
                fingerprint: function () {
                    return JSON.stringify(this.configurations());
                },
                snapshot: function () {
                    return JSON.stringify([this.name, this.description, this.fingerprint(), this.results.map(function (r) {
                        return r.jobJson;
                    })]);
                },
                init: async function () {
                    var vm = this;
                    vm.loading = true;
                    vm.initialized = false;
                    vm.error = "";
                    vm.results = [];
                    vm.savedJson = [];
                    vm.pairs = [];
                    vm.previewIndex = 0;
                    vm.columnCache = {};
                    vm.id = null;
                    vm.version = null;
                    vm.name = "";
                    vm.description = "";
                    vm.buildVisible = !vm.$route.query.id;
                    vm.configurationOpen = false;
                    vm.batchId = "";
                    vm.batchCode = "";
                    vm.jsonError = "";
                    ++vm.projectRequest;
                    vm.projectId = null;
                    vm.projectDatasourceIds = null;
                    vm.projectError = "";
                    vm.projectLoading = false;
                    try {
                        await loadSources(vm);
                        if (vm.$route.query.id) {
                            var dto = await api(base + "/" + vm.$route.query.id), spec = dto.buildConfig;
                            vm.id = dto.id;
                            vm.version = dto.version;
                            vm.name = dto.name;
                            vm.description = dto.description || "";
                            vm.batchId = dto.batchId || spec.batchId || "";
                            vm.batchCode = dto.batchCode || "";
                            vm.readerDatasourceId = spec.readerDatasourceId;
                            vm.writerDatasourceId = spec.writerDatasourceId;
                            vm.readerMetadataDatasourceId = spec.readerMetadataDatasourceId || null;
                            vm.writerMetadataDatasourceId = spec.writerMetadataDatasourceId || null;
                            Object.assign(vm.options, spec.rdbmsReader || {}, spec.rdbmsWriter || {});
                            var pair = newPair();
                            pair.original = spec;
                            pair.reader = newSelection(spec.readerMetadataTable || spec.readerTables[0], spec.readerTables[0], spec.readerColumns);
                            pair.writer = newSelection(spec.writerMetadataTable || spec.writerTables[0], spec.writerTables[0], spec.writerColumns);
                            vm.pairs = [pair];
                            vm.activeReader = pair.key;
                            vm.activeWriter = pair.key;
                            vm.results = [dto];
                        } else {
                            vm.readerDatasourceId = Number(vm.$route.query.reader) || null;
                            vm.writerDatasourceId = Number(vm.$route.query.writer) || null;
                            vm.readerMetadataDatasourceId = null;
                            vm.writerMetadataDatasourceId = null;
                            vm.name = vm.$route.query.name || "";
                            await vm.loadProjects();
                            if (vm.$route.query.projectId) await vm.changeProject(Number(vm.$route.query.projectId));
                        }
                        if (!vm.id) await Promise.all([vm.loadTables("reader", true), vm.loadTables("writer", true)]);
                        vm.savedJson = vm.results.map(function (r) {
                            return r.jobJson;
                        });
                        vm.generatedFingerprint = vm.results.length ? vm.fingerprint() : "";
                        vm.baseline = vm.snapshot();
                        vm.initialized = true;
                    } catch (e) {
                        vm.error = e.message || "配置加载失败";
                    } finally {
                        vm.loading = false;
                    }
                },
                datasource: function (id) {
                    return this.datasources.find(function (ds) {
                        return ds.id === id;
                    });
                },
                loadProjects: async function () {
                    if (this.projectsLoaded) return;
                    try {
                        this.projects = await api("/api/jobProject/list");
                        this.projectsLoaded = true;
                        if (!this.projectId) this.projectError = "";
                    } catch (error) {
                        this.projectError = error.message || "项目列表加载失败，请重试";
                    }
                },
                changeProject: async function (id) {
                    var vm = this, version = ++vm.projectRequest;
                    vm.projectId = id || null;
                    vm.projectDatasourceIds = id ? [] : null;
                    vm.projectError = "";
                    vm.projectLoading = !!id;
                    if (!id) return;
                    try {
                        var rows = await api("/api/jobProject/" + id + "/datasources");
                        if (version !== vm.projectRequest) return;
                        vm.projectDatasourceIds = rows.filter(function (row) {
                            return row.status === 1;
                        }).map(function (row) {
                            return row.id;
                        });
                        ["reader", "writer"].forEach(function (side) {
                            if (vm.projectDatasourceIds.indexOf(vm[side + "DatasourceId"]) < 0) vm.changeRuntimeSource(side, null);
                        });
                    } catch (error) {
                        if (version === vm.projectRequest) vm.projectError = error.message || "项目数据源加载失败，请重试";
                    } finally {
                        if (version === vm.projectRequest) vm.projectLoading = false;
                    }
                },
                sourceName: function (id) {
                    var source = this.datasource(id);
                    return source ? source.datasourceName : "ID: " + id;
                },
                showBatch: function () {
                    this.$router.push({
                        path: "/datax/job/configTemplate",
                        query: this.batchId ? {batchId: this.batchId} : {}
                    });
                },
                openConfiguration: async function () {
                    if (!this.id) {
                        this.buildVisible = true;
                        return;
                    }
                    this.configurationOpen = true;
                    await this.loadProjects();
                    await Promise.all([this.loadTables("reader", true), this.loadTables("writer", true)]);
                    var pair = this.pairs[0];
                    if (pair && pair.reader) await this.openFields("reader", pair.reader.metadataTable);
                    if (pair && pair.writer) await this.openFields("writer", pair.writer.metadataTable);
                },
                toggleFullscreen: function () {
                    this.jsonFullscreen = !this.jsonFullscreen;
                    var vm = this;
                    this.$nextTick(function () {
                        if (vm.$refs.jsonEditor) vm.$refs.jsonEditor.refresh();
                    });
                },
                changeRuntimeSource: function (side, id) {
                    // Deliberately does not query metadata or clear table/field choices.
                    this[side + "DatasourceId"] = id;
                },
                changeMetadataSource: function (side, id) {
                    this[side + "MetadataDatasourceId"] = id;
                    this[side + "Schema"] = "";
                    this.pairs.forEach(function (pair) {
                        pair[side] = null;
                    });
                    this.pairs = this.pairs.filter(function (pair) {
                        return pair.reader || pair.writer;
                    });
                    this[side === "reader" ? "activeReader" : "activeWriter"] = "";
                    return this.loadTables(side, false);
                },
                loadTables: async function (side, preserve) {
                    var vm = this, id = vm[side + "MetadataDatasourceId"], sequence = ++vm.metaSequence[side];
                    vm[side + "Tables"] = [];
                    vm[side + "Schemas"] = [];
                    if (!id) return;
                    try {
                        var ds = vm.datasource(id);
                        if (ds && ds.datasource === "postgresql") {
                            var schemas = await request({url: "/api/metadata/getDBSchema", params: {datasourceId: id}});
                            if (sequence !== vm.metaSequence[side]) return;
                            vm[side + "Schemas"] = schemas;
                            if (!vm[side + "Schema"]) {
                                var saved = preserve && vm.pairs[0] && vm.pairs[0][side] && vm.pairs[0][side].metadataTable;
                                vm[side + "Schema"] = saved && saved.indexOf(".") >= 0 ? saved.split(".")[0] : schemas.indexOf("public") >= 0 ? "public" : schemas[0];
                            }
                        }
                        var tables = await request({
                            url: "/api/metadata/getTables",
                            params: {datasourceId: id, tableSchema: vm[side + "Schema"] || undefined}
                        });
                        if (sequence !== vm.metaSequence[side]) return;
                        vm[side + "Tables"] = tables.map(function (table) {
                            return ds && ds.datasource === "postgresql" && vm[side + "Schema"] && table.indexOf(".") < 0 ? vm[side + "Schema"] + "." + table : table;
                        });
                        if (!preserve && side === "writer") vm.matchTables();
                    } catch (e) {
                        if (sequence === vm.metaSequence[side]) vm.$message.warning("模拟库表结构加载失败，请选择可连接的本地数据源");
                    }
                },
                changeSchema: function (side, schema) {
                    this[side + "Schema"] = schema;
                    this.pairs.forEach(function (pair) {
                        pair[side] = null;
                    });
                    this.pairs = this.pairs.filter(function (pair) {
                        return pair.reader || pair.writer;
                    });
                    return this.loadTables(side, false);
                },
                visibleTables: function (side) {
                    var filter = this[side + "Filter"].toLowerCase();
                    return this[side + "Tables"].filter(function (t) {
                        return t.toLowerCase().indexOf(filter) >= 0;
                    });
                },
                selectedPair: function (side, table) {
                    return this.pairs.find(function (pair) {
                        return pair[side] && pair[side].metadataTable === table;
                    });
                },
                selectTable: function (side, table, checked) {
                    var vm = this, other = side === "reader" ? "writer" : "reader",
                        found = vm.selectedPair(side, table);
                    if (!checked) {
                        if (found) vm.$set(found, side, null);
                        vm.pairs = vm.pairs.filter(function (pair) {
                            return pair.reader || pair.writer;
                        });
                        return;
                    }
                    if (found) return found;
                    var pair = vm.pairs.find(function (p) {
                            return !p[side] && p[other] && normalize(p[other].metadataTable) === normalize(table);
                        }) ||
                        vm.pairs.find(function (p) {
                            return !p[side];
                        });
                    if (!pair) {
                        if (vm.id && vm.pairs.length) {
                            vm.$message.warning("编辑单份记录时请先取消原表，再选择新表");
                            return;
                        }
                        pair = newPair();
                        vm.pairs.push(pair);
                    }
                    vm.$set(pair, side, newSelection(table));
                    if (!pair[other]) {
                        var match = vm[other + "Tables"].find(function (name) {
                            return normalize(name) === normalize(table) && !vm.selectedPair(other, name);
                        });
                        if (match) vm.$set(pair, other, newSelection(match));
                    }
                    return pair;
                },
                selectAll: function (side, checked) {
                    if (this.id) return;
                    var vm = this;
                    vm.visibleTables(side).forEach(function (table) {
                        vm.selectTable(side, table, checked);
                    });
                },
                matchTables: function () {
                    var vm = this;
                    // Keep unmatched slots empty instead of shifting later rows into the wrong pairing.
                    vm.pairs.forEach(function (pair) {
                        if (!pair.reader || pair.writer) return;
                        var match = vm.writerTables.find(function (table) {
                            return normalize(table) === normalize(pair.reader.metadataTable) && !vm.selectedPair("writer", table);
                        });
                        if (match) vm.$set(pair, "writer", newSelection(match));
                    });
                },
                moveTable: function (side, pair, offset) {
                    var index = this.pairs.indexOf(pair), target = this.pairs[index + offset];
                    if (!target) return;
                    var current = pair[side];
                    this.$set(pair, side, target[side]);
                    this.$set(target, side, current);
                    this.pairs = this.pairs.filter(function (p) {
                        return p.reader || p.writer;
                    });
                },
                openFields: async function (side, table) {
                    var pair = this.selectedPair(side, table) || this.selectTable(side, table, true);
                    if (!pair) return;
                    this[side === "reader" ? "activeReader" : "activeWriter"] = pair.key;
                    try {
                        await this.loadColumns(pair, side);
                    } catch (e) {
                        this.$message.warning(e.message);
                    }
                },
                columnKey: function (id, table) {
                    return JSON.stringify([id, table]);
                },
                cachedColumns: function (id, table) {
                    var vm = this, cache = vm.columnCache, key = vm.columnKey(id, table);
                    if (!cache[key]) {
                        var pending = request({
                            url: "/api/metadata/getColumns",
                            params: {datasourceId: id, tableName: table}
                        }).catch(function (error) {
                            if (cache[key] === pending) delete cache[key];
                            throw error;
                        });
                        cache[key] = pending;
                    }
                    return cache[key];
                },
                applyColumns: function (pair, side, selection, version, columns) {
                    if (version !== this.metaSequence[side] || pair[side] !== selection || this.pairs.indexOf(pair) < 0) throw new Error("表结构来源已变化，请重新选择");
                    if (!columns.length) throw new Error("模拟表 " + selection.metadataTable + " 没有可用字段");
                    selection.availableColumns = columns.slice();
                    selection.loaded = true;
                    if (!selection.custom) selection.columns = columns.slice();
                    if (pair.reader && pair.writer && pair.reader.loaded && pair.writer.loaded && !pair.writer.custom) this.alignFields(pair, false);
                },
                prefetchColumns: async function () {
                    var vm = this, cache = vm.columnCache, targets = [], groups = {}, missing = {}, completed = 0;
                    vm.pairs.forEach(function (pair) {
                        ["reader", "writer"].forEach(function (side) {
                            var selection = pair[side];
                            if (!selection || selection.loaded) return;
                            var id = vm[side + "MetadataDatasourceId"], key = vm.columnKey(id, selection.metadataTable);
                            targets.push({
                                pair: pair,
                                side: side,
                                selection: selection,
                                version: vm.metaSequence[side],
                                key: key
                            });
                            if (!cache[key] && !missing[key]) {
                                missing[key] = true;
                                if (!groups[id]) groups[id] = [];
                                groups[id].push(selection.metadataTable);
                            }
                        });
                    });
                    var total = Object.keys(missing).length;
                    // At most two datasource groups for this editor; chunks within each datasource run sequentially.
                    await Promise.all(Object.keys(groups).map(async function (id) {
                        var tables = groups[id];
                        for (var start = 0; start < tables.length; start += 200) {
                            var chunk = tables.slice(start, start + 200);
                            var query = request({
                                url: "/api/metadata/getColumnsBatch",
                                method: "post",
                                timeout: 90000,
                                data: {datasourceId: Number(id), tables: chunk}
                            });
                            var pending = chunk.map(function (table) {
                                var key = vm.columnKey(Number(id), table);
                                var value = query.then(function (data) {
                                    return data[table] || [];
                                }).catch(function (error) {
                                    if (cache[key] === value) delete cache[key];
                                    throw error;
                                });
                                cache[key] = value;
                                return value;
                            });
                            await Promise.all(pending);
                            completed += chunk.length;
                            vm.progress = "批量读取模拟表结构 " + completed + " / " + total;
                        }
                    }));
                    var values = await Promise.all(targets.map(function (target) {
                        return cache[target.key];
                    }));
                    // Apply together so a large batch does not re-render the table list after every field request.
                    targets.forEach(function (target, index) {
                        vm.applyColumns(target.pair, target.side, target.selection, target.version, values[index]);
                    });
                },
                loadColumns: async function (pair, side) {
                    var vm = this, selection = pair[side];
                    if (!selection) throw new Error("存在未配对的表，请补齐左右同序号的表");
                    if (selection.loaded) return;
                    var id = vm[side + "MetadataDatasourceId"], version = vm.metaSequence[side];
                    if (!id) throw new Error("请选择可连接的模拟库作为表结构来源");
                    selection.loading = true;
                    selection.error = "";
                    try {
                        var columns = await vm.cachedColumns(id, selection.metadataTable);
                        vm.applyColumns(pair, side, selection, version, columns);
                    } catch (e) {
                        selection.error = e.message || "读取字段失败";
                        throw e;
                    } finally {
                        selection.loading = false;
                    }
                },
                alignFields: function (pair, strict) {
                    if (!pair.reader || !pair.writer || !pair.reader.loaded || !pair.writer.loaded) return;
                    var target = pair.writer.availableColumns, ordered = [];
                    pair.reader.columns.forEach(function (column) {
                        var name = target.find(function (value) {
                            return value.toLowerCase() === column.toLowerCase();
                        });
                        if (name) ordered.push(name);
                    });
                    if (!strict) target.forEach(function (column) {
                        if (ordered.indexOf(column) < 0) ordered.push(column);
                    });
                    pair.writer.columns = ordered;
                    if (strict) pair.writer.custom = true;
                },
                moveColumn: function (selection, index, offset) {
                    var target = index + offset;
                    if (target < 0 || target >= selection.columns.length) return;
                    var columns = selection.columns.slice(), name = columns[index];
                    columns[index] = columns[target];
                    columns[target] = name;
                    selection.columns = columns;
                    selection.custom = true;
                },
                validatePairs: function () {
                    if (this.projectId && (this.projectLoading || this.projectError)) throw new Error(this.projectError || "正在加载项目数据源，请稍候");
                    if (this.projectId && [this.readerDatasourceId, this.writerDatasourceId].some(id => (this.projectDatasourceIds || []).indexOf(id) < 0)) {
                        throw new Error("请从当前项目绑定的数据源中选择实际源库和目标库");
                    }
                    if (!this.readerDatasourceId || !this.writerDatasourceId) throw new Error("请选择写入 JSON 的实际源库和目标库");
                    if (!this.readerMetadataDatasourceId || !this.writerMetadataDatasourceId) throw new Error("请选择两侧的模拟表结构库");
                    if (!this.pairs.length || this.pairs.length > 500) throw new Error("每批请选择1至500组表");
                    this.pairs.forEach(function (pair, index) {
                        if (!pair.reader || !pair.writer) throw new Error("第" + (index + 1) + "组未配对，请选择左右同序号的表");
                        if (!pair.reader.actualTable.trim() || !pair.writer.actualTable.trim()) throw new Error("第" + (index + 1) + "组实际表名不能为空");
                    });
                },
                generate: async function () {
                    var vm = this;
                    try {
                        if (vm.id && !vm.name.trim()) throw new Error("请输入模板名称");
                        vm.validatePairs();
                        if (vm.id && vm.results.length) {
                            try {
                                await vm.$confirm("重新生成会覆盖当前 JSON 的手工修改，是否继续？", "重新生成", {type: "warning"});
                            } catch (cancel) {
                                return;
                            }
                        }
                        vm.generating = true;
                        vm.progress = "正在批量读取模拟表结构";
                        await vm.prefetchColumns();
                        for (var index = 0; index < vm.pairs.length; index++) {
                            var pair = vm.pairs[index];
                            if (!pair.reader.columns.length || pair.reader.columns.length !== pair.writer.columns.length) throw new Error("第" + (index + 1) + "组左右字段数量不一致或为空，请点击表名调整字段");
                            [pair.reader, pair.writer].forEach(function (selection) {
                                if (selection.columns.some(function (column) {
                                    return selection.availableColumns.indexOf(column) < 0;
                                })) throw new Error("模拟表字段已变化，请重新选择 " + selection.metadataTable + " 的字段");
                            });
                        }
                        var configurations = vm.configurations();
                        vm.progress = vm.id ? "正在生成 JSON" : "正在生成并保存记录";
                        if (vm.id) {
                            var json = await api(base + "/generate", "post", configurations[0]);
                            vm.results = [{
                                id: vm.id,
                                name: vm.name,
                                batchId: vm.batchId,
                                batchCode: vm.batchCode,
                                jobJson: JSON.stringify(JSON.parse(json), null, 2),
                                buildConfig: configurations[0],
                                fileName: vm.previewName(configurations[0])
                            }];
                            vm.$message.success("JSON 已重新生成，点击“保存修改”更新记录");
                        } else {
                            vm.results = await request({
                                url: base + "/batchGenerate", method: "post", timeout: 120000,
                                data: {name: vm.name.trim(), configurations: configurations}
                            });
                            vm.savedJson = vm.results.map(function (r) {
                                return r.jobJson;
                            });
                            vm.batchId = vm.results[0].batchId || vm.results[0].buildConfig.batchId;
                            vm.batchCode = vm.results[0].batchCode || vm.batchId;
                            vm.$message.success("已生成并保存 " + vm.results.length + " 份 JSON，可在生成记录中查询");
                        }
                        vm.previewIndex = 0;
                        vm.generatedFingerprint = vm.fingerprint();
                        vm.buildVisible = false;
                        vm.configurationOpen = false;
                        if (!vm.id) vm.baseline = vm.snapshot();
                    } catch (e) {
                        vm.$message.warning(e.message || "生成失败，请检查配置");
                    } finally {
                        vm.generating = false;
                        vm.progress = "";
                    }
                },
                previewName: function (spec) {
                    var reader = this.datasource(spec.readerDatasourceId),
                        writer = this.datasource(spec.writerDatasourceId);
                    return String(spec.sequence || 1).padStart(3, "0") + "_" + (reader ? reader.datasource : "") + "reader2" + (writer ? writer.datasource : "") + "writer_" +
                        spec.readerTables[0] + "%2%" + spec.writerTables[0] + ".json";
                },
                validateJson: function (result) {
                    if (this.needsGenerate) throw new Error("实际数据源、表或字段已变化，请重新生成 JSON");
                    try {
                        var doc = JSON.parse(result.jobJson);
                        if (!doc.job || !doc.job.content || !doc.job.content.length) throw new Error();
                    } catch (e) {
                        throw new Error("请输入有效的 DataX JSON");
                    }
                },
                saveSingle: async function () {
                    var vm = this;
                    try {
                        var result = vm.results[vm.previewIndex];
                        if (!result || (vm.id && !vm.name.trim())) throw new Error("请先生成 JSON 并填写模板名称");
                        vm.validateJson(result);
                        vm.saving = true;
                        var spec = vm.configurations()[vm.previewIndex];
                        spec.batchId = result.buildConfig.batchId;
                        spec.batchName = result.buildConfig.batchName;
                        if (result.buildConfig.sequence != null) spec.sequence = result.buildConfig.sequence;
                        var dto = await api(base, "post", {
                            id: result.id,
                            version: vm.id ? vm.version : result.version,
                            name: vm.id ? vm.name.trim() : result.name,
                            description: vm.description,
                            buildConfig: spec,
                            jobJson: result.jobJson
                        });
                        vm.$set(vm.results, vm.previewIndex, dto);
                        if (vm.id) vm.version = dto.version;
                        vm.$set(vm.savedJson, vm.previewIndex, dto.jobJson);
                        vm.generatedFingerprint = vm.fingerprint();
                        if (vm.results.every(function (r, i) {
                            return r.jobJson === vm.savedJson[i];
                        })) vm.baseline = vm.snapshot();
                        vm.$message.success("记录已保存");
                    } catch (e) {
                        vm.$message.warning(e.message || "保存失败");
                    } finally {
                        vm.saving = false;
                    }
                },
                downloadOne: function () {
                    try {
                        var result = this.results[this.previewIndex];
                        this.validateJson(result);
                        download(result);
                    } catch (e) {
                        this.$message.warning(e.message);
                    }
                },
                downloadAll: async function () {
                    var vm = this;
                    try {
                        if (vm.needsGenerate || vm.snapshot() !== vm.baseline) throw new Error("请先生成并保存当前修改，再打包下载");
                        vm.downloading = true;
                        if (vm.batchId) await downloadArchive(base + "/batches/" + encodeURIComponent(vm.batchId) + "/download", "GET", null, (vm.batchCode || vm.batchId) + ".zip");
                        else await downloadZip(vm.results.map(function (r) {
                            return r.id;
                        }), vm);
                    } catch (e) {
                        vm.$message.warning(e.message);
                    } finally {
                        vm.downloading = false;
                    }
                },
                format: function () {
                    try {
                        var result = this.results[this.previewIndex];
                        result.jobJson = JSON.stringify(JSON.parse(result.jobJson), null, 2);
                    } catch (e) {
                        this.$message.warning("JSON 格式错误");
                    }
                },
                refreshMetadata: async function () {
                    this.columnCache = {};
                    this.pairs.forEach(function (pair) {
                        ["reader", "writer"].forEach(function (side) {
                            if (pair[side]) {
                                pair[side].loaded = false;
                                pair[side].availableColumns = [];
                            }
                        });
                    });
                    await Promise.all([this.loadTables("reader", true), this.loadTables("writer", true)]);
                },
                refreshSources: async function () {
                    try {
                        await loadSources(this);
                        this.projectsLoaded = false;
                        await this.loadProjects();
                        if (this.projectId) await this.changeProject(this.projectId);
                        await this.refreshMetadata();
                    } catch (error) {
                        this.$message.warning(error.message);
                    }
                }
            },
            render: function (h) {
                var vm = this;

                function sidePanel(side, title) {
                    var visible = vm.visibleTables(side), selected = visible.filter(function (table) {
                        return !!vm.selectedPair(side, table);
                    }).length;
                    var active = vm.pairs.find(function (p) {
                        return p.key === vm[side === "reader" ? "activeReader" : "activeWriter"];
                    });
                    var selection = active && active[side];
                    return h("el-card", {class: "datax-config-side", props: {shadow: "never"}}, [
                        h("strong", {slot: "header"}, [title]),
                        field(h, "实际数据源（写入 JSON，不连接）", select(h, vm[side + "DatasourceId"], function (id) {
                            vm.changeRuntimeSource(side, id);
                        }, sources(vm, vm.runtimeSources), {
                            loading: vm.projectLoading,
                            disabled: vm.projectLoading || !!(vm.projectId && vm.projectError)
                        })),
                        field(h, "模拟表结构库（连接本地库选表和字段）", select(h, vm[side + "MetadataDatasourceId"], function (id) {
                            vm.changeMetadataSource(side, id);
                        }, sources(vm))),
                        vm[side + "Schemas"].length ? field(h, "模拟库 Schema", select(h, vm[side + "Schema"], function (s) {
                                vm.changeSchema(side, s);
                            },
                            vm[side + "Schemas"].map(function (s) {
                                return {value: s, label: s};
                            }))) : null,
                        vm.id ? field(h, "当前模拟表", select(h, selection ? selection.metadataTable : null, function (table) {
                            var old = vm.pairs[0];
                            if (old) vm.$set(old, side, null);
                            vm.selectTable(side, table, true);
                            vm.openFields(side, table);
                        }, vm[side + "Tables"].map(function (table) {
                            return {value: table, label: table};
                        }))) : input(h, vm[side + "Filter"], function (value) {
                            vm[side + "Filter"] = value;
                        }, {placeholder: "筛选模拟表", clearable: true, size: "small"}),
                        vm.id ? null : h("div", {class: "datax-config-table-header"}, [h("el-checkbox", {
                            props: {
                                value: visible.length > 0 && selected === visible.length,
                                indeterminate: selected > 0 && selected < visible.length,
                                disabled: !!vm.id
                            },
                            on: {
                                change: function (checked) {
                                    vm.selectAll(side, checked);
                                }
                            }
                        }, ["全选当前列表"]), h("span", [selected + " / " + visible.length])]),
                        vm.id ? null : h("div", {class: "datax-config-tables"}, visible.length ? visible.map(function (table) {
                            var pair = vm.selectedPair(side, table), ordinal = pair ? vm.pairs.indexOf(pair) + 1 : null;
                            return h("div", {
                                key: table,
                                class: {"datax-config-table-row": true, "is-active": !!pair && active === pair}
                            }, [
                                h("el-checkbox", {
                                    props: {value: !!pair}, on: {
                                        change: function (checked) {
                                            vm.selectTable(side, table, checked);
                                        }
                                    }
                                }),
                                button(h, table, function () {
                                    vm.openFields(side, table);
                                }, {type: "text"}),
                                pair ? h("el-tag", {props: {size: "mini"}}, ["序号 " + ordinal]) : null,
                                pair ? button(h, "↑", function () {
                                    vm.moveTable(side, pair, -1);
                                }, {type: "text", disabled: ordinal === 1}) : null,
                                pair ? button(h, "↓", function () {
                                    vm.moveTable(side, pair, 1);
                                }, {type: "text", disabled: ordinal === vm.pairs.length}) : null
                            ]);
                        }) : [h("p", {class: "datax-config-muted"}, ["选择可连接的模拟库后加载表；实际数据源无需连通。"])]),
                        selection ? h("div", {class: "datax-config-fields"}, [
                            h("strong", ["序号 " + (vm.pairs.indexOf(active) + 1) + " · " + selection.metadataTable]),
                            field(h, "实际表名（写入 JSON，可修改）", input(h, selection.actualTable, function (value) {
                                selection.actualTable = value;
                            })),
                            selection.loading ? h("p", ["正在读取模拟字段…"]) : null,
                            selection.error ? h("el-alert", {
                                props: {
                                    title: selection.error,
                                    type: "warning",
                                    closable: false
                                }
                            }) : null,
                            h("el-checkbox", {
                                props: {
                                    value: selection.loaded && selection.columns.length === selection.availableColumns.length,
                                    indeterminate: selection.columns.length > 0 && selection.columns.length < selection.availableColumns.length
                                },
                                on: {
                                    change: function (checked) {
                                        selection.columns = checked ? selection.availableColumns.slice() : [];
                                        selection.custom = true;
                                    }
                                }
                            }, ["全选字段"]),
                            h("el-checkbox-group", {
                                    class: "datax-config-field-choices",
                                    props: {value: selection.columns},
                                    on: {
                                        input: function (columns) {
                                            selection.columns = columns;
                                            selection.custom = true;
                                        }
                                    }
                                },
                                selection.availableColumns.map(function (column) {
                                    return h("el-checkbox", {key: column, props: {label: column}}, [column]);
                                })),
                            h("div", {class: "datax-config-columns"}, selection.columns.map(function (column, index) {
                                return h("div", {key: column}, [h("span", [(index + 1) + ". " + column]),
                                    button(h, "↑", function () {
                                        vm.moveColumn(selection, index, -1);
                                    }, {type: "text", disabled: index === 0}),
                                    button(h, "↓", function () {
                                        vm.moveColumn(selection, index, 1);
                                    }, {type: "text", disabled: index === selection.columns.length - 1})]);
                            }))
                        ]) : h("p", {class: "datax-config-muted"}, ["点击表名展开字段；未展开的表默认使用全部字段。"])
                    ]);
                }

                var result = vm.results[vm.previewIndex];

                function configurationContent() {
                    return [
                        field(h, vm.id ? "模板名称" : "批次说明（可选，编码自动分配）", input(h, vm.name, function (value) {
                            vm.name = value;
                        }, {maxlength: 100, placeholder: "例如：生产库迁移；保存时自动分配 BST年月日001"})),
                        field(h, "按项目筛选实际数据源（可选）", select(h, vm.projectId, vm.changeProject,
                            vm.projects.map(function (project) {
                                return {value: project.id, label: project.name};
                            }), {clearable: true, placeholder: "全部数据源，或选择项目"})),
                        vm.projectError ? h("el-alert", {
                            props: {
                                title: vm.projectError,
                                type: "warning",
                                closable: false
                            }
                        }) : null,
                        vm.projectId && !vm.projectLoading && !vm.projectError && !vm.runtimeSources.length ? h("el-alert", {
                            props: {
                                title: "该项目暂无可用的关系型数据源，请到项目管理绑定后刷新。",
                                type: "warning",
                                closable: false
                            }
                        }) : null,
                        h("div", {class: "datax-config-toolbar"}, [button(h, "添加数据源", function () {
                            vm.$router.push("/datax/datasource/jdbcDatasource");
                        }),
                            button(h, "刷新数据源", vm.refreshSources), button(h, "刷新模拟表结构", vm.refreshMetadata), button(h, "补齐同名表配对", vm.matchTables)]),
                        h("div", {class: "datax-config-sides"}, [sidePanel("reader", "左侧 · 源库 Reader"), sidePanel("writer", "右侧 · 目标库 Writer")]),
                        h("h3", ["表配对（" + vm.pairs.length + " 组）"]),
                        h("div", {class: "datax-config-pairs"}, vm.pairs.map(function (pair, index) {
                            return h("div", {
                                key: pair.key,
                                class: "datax-config-pair"
                            }, [h("el-tag", [String(index + 1).padStart(3, "0")]),
                                h("div", [pair.reader ? input(h, pair.reader.actualTable, function (v) {
                                    pair.reader.actualTable = v;
                                }, {size: "small"}) : h("span", {class: "datax-config-missing"}, ["未选择源表"]),
                                    h("small", [pair.reader ? "模拟：" + pair.reader.metadataTable + " · " + (pair.reader.loaded ? pair.reader.columns.length + " 字段" : "全部字段") : ""])]),
                                h("span", ["→"]), h("div", [pair.writer ? input(h, pair.writer.actualTable, function (v) {
                                    pair.writer.actualTable = v;
                                }, {size: "small"}) : h("span", {class: "datax-config-missing"}, ["未选择目标表"]),
                                    h("small", [pair.writer ? "模拟：" + pair.writer.metadataTable + " · " + (pair.writer.loaded ? pair.writer.columns.length + " 字段" : "全部字段") : ""])]),
                                button(h, "字段配对", async function () {
                                    if (!pair.reader || !pair.writer) return;
                                    await vm.openFields("reader", pair.reader.metadataTable);
                                    await vm.openFields("writer", pair.writer.metadataTable);
                                }, {type: "text"}),
                                button(h, "同名字段对齐", async function () {
                                    try {
                                        await vm.loadColumns(pair, "reader");
                                        await vm.loadColumns(pair, "writer");
                                        vm.alignFields(pair, true);
                                    } catch (e) {
                                        vm.$message.warning(e.message);
                                    }
                                }, {type: "text", disabled: !pair.reader || !pair.writer}),
                                button(h, "移除", function () {
                                    vm.pairs.splice(index, 1);
                                }, {type: "text"})
                            ]);
                        })),
                        h("el-collapse", [h("el-collapse-item", {
                            props: {
                                title: "可选生成参数（应用到本次所选表）",
                                name: "options"
                            }
                        }, [
                            field(h, "WHERE 条件", input(h, vm.options.whereParams, function (v) {
                                vm.options.whereParams = v;
                            })),
                            field(h, "切分主键", input(h, vm.options.readerSplitPk, function (v) {
                                vm.options.readerSplitPk = v;
                            })),
                            field(h, "自定义读取 SQL（可选，优先于选表）", input(h, vm.options.querySql, function (v) {
                                vm.options.querySql = v;
                            }, {type: "textarea", rows: 2, placeholder: "留空时读取所选表；填写后按 SQL 读取"})),
                            field(h, "前置 SQL", input(h, vm.options.preSql, function (v) {
                                vm.options.preSql = v;
                            }, {type: "textarea", rows: 2})),
                            field(h, "后置 SQL", input(h, vm.options.postSql, function (v) {
                                vm.options.postSql = v;
                            }, {type: "textarea", rows: 2}))
                        ])]),
                        h("p", {class: "datax-config-muted"}, ["文件名：序号_读取插件2写入插件_源表%2%目标表.json，例如 001_mysqlreader2mysqlwriter_sys_global_sequence%2%sys_global_sequence.json"]),
                        h("div", {class: "datax-config-toolbar"}, [
                            button(h, vm.id ? "重新生成 JSON" : "批量生成并保存记录", vm.generate, {
                                type: "primary",
                                loading: vm.generating,
                                disabled: !!vm.error
                            }),
                            button(h, "打包下载本批", vm.downloadAll, {
                                disabled: !vm.results.length || vm.needsGenerate,
                                loading: vm.downloading
                            }),
                            button(h, "查看批次", vm.showBatch),
                            h("span", {class: "datax-config-muted"}, [vm.progress || (vm.needsGenerate && vm.results.length ? "配置已变化，请重新生成" : vm.dirty ? "有未保存的修改" : "")])
                        ]),

                    ];
                }

                if (!vm.buildVisible) {
                    return h("div", {
                        class: {
                            "app-container": true,
                            "datax-config-page": true,
                            "datax-json-focus": true,
                            "is-fullscreen": vm.jsonFullscreen
                        }
                    }, [
                        h("div", {class: "datax-json-heading"}, [
                            h("div", [h("div", {class: "datax-config-muted"}, [vm.batchCode || "DataX 任务模板"]),
                                h("h2", [result ? result.fileName : "正在加载当前模板…"])]),
                            h("div", [button(h, "查看所属批次", vm.showBatch), button(h, "调整配置", vm.openConfiguration, {disabled: vm.busy || !result})])
                        ]),
                        vm.error ? h("el-alert", {props: {title: vm.error, type: "error", closable: false}}) : null,
                        result ? h("div", {class: "datax-json-summary"}, [
                            h("span", [vm.sourceName(vm.readerDatasourceId) + " / " + vm.pairs[vm.previewIndex].reader.actualTable]),
                            h("span", ["→"]), h("span", [vm.sourceName(vm.writerDatasourceId) + " / " + vm.pairs[vm.previewIndex].writer.actualTable]),
                            h("span", {class: "datax-config-muted"}, [vm.needsGenerate ? "配置已变化，需要重新生成" : result.jobJson !== vm.savedJson[vm.previewIndex] ? "当前 JSON 有未保存的修改" : "已保存"])
                        ]) : null,
                        h("div", {class: "datax-config-toolbar datax-json-actions"}, [
                            button(h, "保存当前 JSON", vm.saveSingle, {
                                type: "primary",
                                loading: vm.saving,
                                disabled: vm.busy || !result || !!vm.jsonError
                            }),
                            button(h, "格式化", vm.format, {disabled: vm.busy || !result}), button(h, "下载当前文件", vm.downloadOne, {disabled: vm.busy || !result || !!vm.jsonError}),
                            button(h, "下载整个批次", vm.downloadAll, {
                                loading: vm.downloading,
                                disabled: !result || vm.busy
                            }),
                            vm.results.length > 1 ? button(h, "本批模板（" + vm.results.length + "）", function () {
                                vm.filePickerOpen = true;
                            }) : null,
                            h("span", {class: "datax-json-action-spacer"}),
                            vm.results.length > 1 ? button(h, "上一份", function () {
                                vm.previewIndex--;
                            }, {disabled: vm.previewIndex === 0}) : null,
                            vm.results.length > 1 ? h("span", {class: "datax-config-muted"}, [(vm.previewIndex + 1) + " / " + vm.results.length]) : null,
                            vm.results.length > 1 ? button(h, "下一份", function () {
                                vm.previewIndex++;
                            }, {disabled: vm.previewIndex === vm.results.length - 1}) : null,
                            button(h, vm.jsonFullscreen ? "退出全屏" : "全屏编辑", vm.toggleFullscreen, {disabled: !result})
                        ]),
                        result ? h(JsonCodeEditor, {
                            key: result.id || vm.previewIndex,
                            ref: "jsonEditor",
                            props: {value: result.jobJson, readOnly: vm.busy},
                            on: {
                                input: function (text) {
                                    result.jobJson = text;
                                }, validation: function (error) {
                                    vm.jsonError = error;
                                }, save: vm.saveSingle, format: vm.format
                            }
                        }) : null,
                        h("el-drawer", {
                            props: {
                                title: "调整当前模板配置",
                                visible: vm.configurationOpen,
                                size: "86%",
                                appendToBody: true
                            },
                            on: {
                                "update:visible": function (value) {
                                    vm.configurationOpen = value;
                                }
                            }
                        }, [vm.configurationOpen ? h("div", {class: "datax-config-drawer"}, [
                            h("el-form", {
                                props: {
                                    labelPosition: "top",
                                    disabled: vm.busy
                                }
                            }, configurationContent())]) : null]),
                        h("el-drawer", {
                            props: {title: "本批模板", visible: vm.filePickerOpen, size: "560px", appendToBody: true},
                            on: {
                                "update:visible": function (value) {
                                    vm.filePickerOpen = value;
                                }
                            }
                        }, [vm.filePickerOpen ? h("div", {class: "datax-config-drawer"}, [
                            input(h, vm.resultFilter, function (value) {
                                vm.resultFilter = value;
                            }, {placeholder: "搜索当前批次文件名", clearable: true}),
                            h("div", {class: "datax-json-file-list"}, vm.results.map(function (file, index) {
                                return (file.fileName || "").toLowerCase().indexOf(vm.resultFilter.toLowerCase()) < 0 ? null :
                                    button(h, file.fileName, function () {
                                        vm.previewIndex = index;
                                        vm.filePickerOpen = false;
                                    }, {type: index === vm.previewIndex ? "primary" : "text"});
                            }))]) : null])
                    ]);
                }
                return h("div", {class: "app-container datax-config-page"}, [
                    h("div", {class: "datax-batch-heading"}, [h("h2", ["批量生成 DataX 任务模板"]),
                        vm.results.length ? button(h, "返回当前 JSON", function () {
                            vm.buildVisible = false;
                        }) : null]),
                    h("el-alert", {
                        props: {
                            type: "info",
                            closable: false,
                            title: "选择模拟库的表结构，生成时使用实际连接。批次编码自动按日期递增。"
                        }
                    }),
                    vm.error ? h("el-alert", {props: {title: vm.error, type: "error", closable: false}}) : null,
                    h("el-form", {
                        props: {labelPosition: "top", disabled: vm.busy}, on: {
                            submit: function (event) {
                                event.preventDefault();
                            }
                        }
                    }, configurationContent())
                ]);
            }
        };
        exports.List = List;
        exports.Editor = Editor;
        exports.createJsonEditor = createJsonEditor;
exports.JsonCodeEditor = JsonCodeEditor;
    }
}]);
