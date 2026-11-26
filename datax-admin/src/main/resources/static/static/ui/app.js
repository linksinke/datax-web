/* Browser-only Vue 2 UI. Templates are ordinary HTML files; no build step. */
(function (global) {
    "use strict";
    var templates = {}, compiled = {}, pages = {}, Vue, router, store, request, navigation;

    function compile(name) {
        if (!compiled[name]) {
            if (!templates[name]) throw new Error("Missing view: " + name);
            compiled[name] = global.DataxCompile(templates[name]);
        }
        return compiled[name];
    }

    function apply(options, name) {
        options = options.default || options;
        return Object.assign({}, options, compile(name));
    }

    function appendHook(options, key, callback) {
        var existing = options[key];
        options[key] = (existing ? (Array.isArray(existing) ? existing : [existing]) : []).concat(callback);
    }

    function setReadState(vm, state) {
        vm.uiRead = state;
        if (vm.listLoading !== undefined) vm.listLoading = state.loading;
    }

    function content(value) {
        return value && value.content !== undefined ? value.content : value;
    }

    function api(url, method, data, params) {
        return request({url: url, method: method || "get", data: data, params: params}).then(content);
    }

    function read(vm, work, accept) {
        var sequence = ++vm.uiReadSequence;
        setReadState(vm, Object.assign({}, vm.uiRead, {loading: true, error: ""}));
        return Promise.resolve().then(work).then(function (value) {
            if (sequence !== vm.uiReadSequence || vm._isDestroyed) return;
            accept(value);
            setReadState(vm, {
                loading: false,
                error: "",
                updatedAt: new Date().toLocaleTimeString("zh-CN", {hour12: false})
            });
        }).catch(function (error) {
            if (sequence === vm.uiReadSequence && !vm._isDestroyed) setReadState(vm, Object.assign({}, vm.uiRead, {
                loading: false,
                error: error.message || "数据加载失败，请重试"
            }));
        });
    }

    function validate(vm, ref) {
        return new Promise(function (resolve) {
            var form = vm.$refs[ref || "dataForm"];
            if (!form) return resolve(false);
            form.validate(function (valid) {
                resolve(!!valid);
            });
        });
    }

    function commit(vm, key, work, success) {
        if (vm.uiPending[key]) return Promise.resolve(false);
        vm.$set(vm.uiPending, key, true);
        return Promise.resolve().then(work).then(function (value) {
            if (value === false || (value && value.code && value.code !== 200 && value.code !== 0)) throw new Error(value.msg || "操作未完成，请重试");
            if (success) return success(value);
            return true;
        }).catch(function (error) {
            if (error !== "cancel" && error !== "close") vm.$message.error(error.message || "操作未完成，请重试");
            return false;
        }).finally(function () {
            vm.$set(vm.uiPending, key, false);
        });
    }

    function basicData(original) {
        return function () {
            var value = typeof original === "function" ? original.call(this) : Object.assign({}, original);
            return Object.assign(value, {
                uiRead: {loading: false, error: "", updatedAt: ""},
                uiReadSequence: 0,
                uiPending: {},
                uiDefaultQuery: JSON.parse(JSON.stringify(value.listQuery || {})),
                uiTab: "basic",
                uiRowSelection: [],
                uiFormError: "",
                uiOptionErrors: {},
                uiOptionLoading: {},
                uiOptionSequence: {}
            });
        };
    }

    function page(base, name) {
        if (pages[name]) return pages[name];
        var options = apply(base, name), definition = global.DataxPages[name] || {};
        options.data = basicData(options.data);
        options.methods = Object.assign({}, options.methods, {
            uiReset: function () {
                this.listQuery = JSON.parse(JSON.stringify(this.uiDefaultQuery));
                if (this.projectIds !== undefined) this.projectIds = [];
                return this.uiSearch();
            },
            uiSearch: function () {
                if (this.listQuery) this.listQuery.current = 1;
                return this.fetchData ? this.fetchData() : this.fetch();
            },
            uiRefresh: function () {
                return this.fetchData ? this.fetchData() : this.fetch();
            },
            uiDialogClose: function (done) {
                if (!this.uiPending.save) {
                    this.dialogFormVisible = false;
                    if (typeof done === "function") done();
                }
            },
            uiStatus: function (code) {
                return code === 200 ? "成功" : code === 0 || code == null ? "未执行" : "失败";
            },
            uiStatusType: function (code) {
                return code === 200 ? "success" : code === 0 || code == null ? "info" : "danger";
            },
            uiBusy: function (key) {
                return !!this.uiPending[key];
            }
        }, definition.methods || {});
        if (definition.data) {
            var oldData = options.data;
            options.data = function () {
                return Object.assign(oldData.call(this), definition.data());
            };
        }
        options.computed = Object.assign({}, options.computed, {
            uiPageState: function () {
                return Object.assign({}, this.uiRead, {
                    error: this.uiRead.error || Object.keys(this.uiOptionErrors).map(function (key) {
                        return this.uiOptionErrors[key];
                    }, this).filter(Boolean).join("；")
                });
            },
            uiOptionsBusy: function () {
                return Object.keys(this.uiOptionLoading).some(function (key) {
                    return this.uiOptionLoading[key];
                }, this);
            }
        }, definition.computed || {});
        if (definition.created) appendHook(options, "created", definition.created);
        appendHook(options, "beforeDestroy", function () {
            ++this.uiReadSequence;
        });
        // Keep options compatible with existing Vue children such as Reader, Writer and CodeMirror.
        pages[name] = options;
        return options;
    }

    function part(base, name) {
        var options = apply(base, name);
        if (name === "navbar") {
            var oldData = options.data;
            options.data = function () {
                return Object.assign(oldData ? oldData.call(this) : {}, {
                    uiSearchVisible: false,
                    uiSearchQuery: "",
                    uiSearchIndex: 0
                });
            };
            options.computed = Object.assign({}, options.computed, {
                uiUsername: function () {
                    return this.$store.getters.name || "当前账号";
                },
                uiSearchResults: function () {
                    var found = [], query = this.uiSearchQuery.trim().toLowerCase();

                    function visit(items, group) {
                        items.forEach(function (item) {
                            if (item.hidden) return;
                            if (item.children) visit(item.children, item.meta && item.meta.title || group);
                            else if (!query || ((item.meta && item.meta.title || "") + group + item.path).toLowerCase().indexOf(query) >= 0) found.push({
                                path: item.path,
                                title: item.meta.title,
                                group: group
                            });
                        });
                    }

                    visit(navigation.buildMenu(this.$store.state.permission.routes), "");
                    return found;
                }
            });
            options.methods = Object.assign({}, options.methods, {
                uiOpenSearch: function () {
                    var vm = this;
                    vm.uiSearchQuery = "";
                    vm.uiSearchIndex = 0;
                    vm.uiSearchVisible = true;
                    vm.$nextTick(function () {
                        if (vm.$refs.uiSearchInput) vm.$refs.uiSearchInput.focus();
                    });
                },
                uiMoveSearch: function (step) {
                    this.uiSearchIndex = Math.max(0, Math.min(this.uiSearchResults.length - 1, this.uiSearchIndex + step));
                },
                uiChooseSearch: function (item) {
                    if (!item) return;
                    this.uiSearchVisible = false;
                    if (this.$route.path !== item.path) this.$router.push(item.path);
                }
            });
            appendHook(options, "mounted", function () {
                var vm = this;
                vm.uiSearchShortcut = function (event) {
                    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                        event.preventDefault();
                        vm.uiOpenSearch();
                    }
                };
                document.addEventListener("keydown", vm.uiSearchShortcut);
            });
            appendHook(options, "beforeDestroy", function () {
                document.removeEventListener("keydown", this.uiSearchShortcut);
            });
        }
        return options;
    }

    function install(vue, route, storage, dependencies) {
        Vue = vue;
        router = route;
        store = storage;
        request = dependencies.request;
        navigation = dependencies.navigation;
        Vue.component("ui-data-state", apply({props: {state: {type: Object, required: true}}}, "data-state"));
        Vue.component("ui-pagination", apply({
            props: ["total", "current", "size", "updatedAt"], methods: {
                changePage: function (value) {
                    this.$emit("update:current", value);
                    this.$emit("change");
                },
                changeSize: function (value) {
                    this.$emit("update:size", value);
                    this.$emit("update:current", 1);
                    this.$emit("change");
                }
            }
        }, "pagination"));
        Vue.component("datax-template-fields", apply({props: ["editor"]}, "template-fields"));
    }

    global.DataxUI = {
        templates: templates, page: page, part: part, apply: apply, install: install, api: api, read: read,
        commit: commit, validate: validate, content: content, render: function (name, context) {
            var compiledTemplate = compile(name);
            context.$options.staticRenderFns = compiledTemplate.staticRenderFns;
            return compiledTemplate.render.call(context);
        }
    };
})(window);
