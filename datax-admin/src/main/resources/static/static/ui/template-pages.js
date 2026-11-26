/* Views for the existing offline JSON workflow; generation, credentials and persistence stay in its service. */
(function () {
    "use strict";
    var UI = window.DataxUI;
    window.DataxPages.batches = {
        data: function () {
            return {uiBatchError: ""};
        },
        methods: {
            fetch: function () {
                var vm = this, version = ++vm.fetchVersion, batchId = vm.$route.query.batchId;
                vm.loading = true;
                vm.uiBatchError = "";
                vm.selected = [];
                return UI.api(batchId ? "/api/dataxConfigTemplate" : "/api/dataxConfigTemplate/batches", "get", null, {
                    keyword: vm.keyword,
                    current: vm.current,
                    size: 10,
                    batchId: batchId
                })
                    .then(function (data) {
                        if (version === vm.fetchVersion) {
                            vm.rows = data.records;
                            vm.total = data.total;
                            vm.batch = data.batch || null;
                        }
                    })
                    .catch(function (error) {
                        if (version === vm.fetchVersion) vm.uiBatchError = error.message || "批次加载失败，请重试";
                    })
                    .finally(function () {
                        if (version === vm.fetchVersion) vm.loading = false;
                    });
            }
        }
    };
    window.DataxPages.templateEditor = {
        computed: {
            uiCurrentResult: function () {
                return this.results[this.previewIndex];
            }, uiEditor: function () {
                return this;
            }
        },
        methods: {
            uiActivePair: function (side) {
                return this.pairs.find(function (pair) {
                    return pair.key === this[side === "reader" ? "activeReader" : "activeWriter"];
                }, this);
            },
            uiSelection: function (side) {
                var pair = this.uiActivePair(side);
                return pair && pair[side];
            },
            uiSelectedCount: function (side) {
                var vm = this;
                return vm.visibleTables(side).filter(function (table) {
                    return !!vm.selectedPair(side, table);
                }).length;
            },
            uiSetAllColumns: function (side, checked) {
                var selection = this.uiSelection(side);
                if (selection) {
                    selection.columns = checked ? selection.availableColumns.slice() : [];
                    selection.custom = true;
                }
            },
            uiSelectCurrentTable: function (side, table) {
                if (this.pairs[0]) this.$set(this.pairs[0], side, null);
                this.selectTable(side, table, true);
                return this.openFields(side, table);
            },
            uiOpenPair: async function (pair) {
                if (pair.reader && pair.writer) {
                    await this.openFields("reader", pair.reader.metadataTable);
                    await this.openFields("writer", pair.writer.metadataTable);
                }
            },
            uiAlignPair: async function (pair) {
                try {
                    await this.loadColumns(pair, "reader");
                    await this.loadColumns(pair, "writer");
                    this.alignFields(pair, true);
                } catch (error) {
                    this.$message.warning(error.message);
                }
            }
        },
        enhance: function (options, original) {
            var oldBusy = original.computed.busy;
            options.computed.busy = function () {
                return oldBusy.call(this) || !!this.uiPending.generate || !!this.uiPending.save;
            };
            [["generate", "generate"], ["saveSingle", "save"]].forEach(function (entry) {
                var method = original.methods[entry[0]];
                options.methods[entry[0]] = function () {
                    var vm = this, args = arguments;
                    if (vm.uiPending.generate || vm.uiPending.save) return Promise.resolve(false);
                    return UI.commit(vm, entry[1], function () {
                        return method.apply(vm, args);
                    });
                };
            });
        }
    };
})();
