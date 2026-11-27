/* Readable browser module. HTML templates live under ui/views/. */
DataxModules.define("datax-config-template", function(module, exports, require) {
  "use strict";
  var request = require("utils/request").default;
  var token = require("utils/auth").getToken;
  var base = "/api/dataxConfigTemplate";
  var types = ["mysql", "oracle", "sqlserver", "postgresql", "clickhouse"];
  var nextKey = 0;

  function api(url, method, data) {
    return request({
      url: url,
      method: method || "get",
      data: data
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalize(name) {
    return (name || "").split(".").pop().toLowerCase();
  }

  function input(h, value, change, props) {
    return h("el-input", {
      props: Object.assign({
        value: value
      }, props),
      on: {
        input: change
      }
    });
  }

  function loadSources(vm) {
    return api("/api/jobJdbcDatasource/all").then(function(rows) {
      vm.datasources = rows.filter(function(ds) {
        return types.indexOf(ds.datasource) >= 0 && ds.status === 1;
      });
    });
  }

  function saveBlob(blob, fileName) {
    var url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function() {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function download(dto) {
    saveBlob(new Blob([JSON.stringify(JSON.parse(dto.jobJson), null, 2)], {
      type: "application/json;charset=utf-8"
    }), dto.fileName || dto.name + ".json");
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
      headers: {
        "Content-Type": "application/json",
        Authorization: token()
      }
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
      name: "DataxJsonCodeEditor",
      props: {
        value: {
          type: String,
          default: ""
        },
        readOnly: Boolean
      },
      data: function() {
        return {
          error: "",
          errorLine: null
        };
      },
      mounted: function() {
        var vm = this;
        vm.cm = CodeMirror.fromTextArea(vm.$refs.textarea, {
          value: vm.value,
          lineNumbers: true,
          mode: "application/json",
          theme: "default",
          lineWrapping: false,
          tabSize: 2,
          indentUnit: 2,
          readOnly: vm.readOnly,
          viewportMargin: 15,
          extraKeys: {
            "Ctrl-S": function() {
              vm.$emit("save");
            },
            "Cmd-S": function() {
              vm.$emit("save");
            },
            "Ctrl-Shift-F": function() {
              vm.$emit("format");
            },
            "Cmd-Shift-F": function() {
              vm.$emit("format");
            }
          }
        });
        vm.cm.setValue(vm.value);
        vm.changeHandler = function() {
          vm.$emit("input", vm.cm.getValue());
          vm.validate();
        };
        vm.cm.on("change", vm.changeHandler);
        vm.validate();
        if (typeof ResizeObserver !== "undefined") {
          vm.resizeObserver = new ResizeObserver(function() {
            vm.cm.refresh();
          });
          vm.resizeObserver.observe(vm.$el);
        }
        vm.$nextTick(function() {
          vm.cm.refresh();
        });
      },
      watch: {
        value: function(value) {
          if (!this.cm || value === this.cm.getValue()) return;
          this.cm.off("change", this.changeHandler);
          this.cm.setValue(value);
          this.cm.on("change", this.changeHandler);
          this.validate();
        },
        readOnly: function(value) {
          if (this.cm) this.cm.setOption("readOnly", value);
        }
      },
      beforeDestroy: function() {
        if (this.resizeObserver) this.resizeObserver.disconnect();
        if (this.cm) {
          this.cm.off("change", this.changeHandler);
          this.cm.toTextArea();
        }
      },
      methods: {
        refresh: function() {
          if (this.cm) this.cm.refresh();
        },
        validate: function() {
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
      }
    };
  }

  function createJsonEditor(CodeMirror) {
    var options = createJsonEditorCore(CodeMirror);
    return window.DataxUI ? window.DataxUI.apply(options, "json-editor") : options;
  }

  var JsonCodeEditor = function() {
    return Promise.resolve(createJsonEditor(require("codemirror").default));
  };

  function newSelection(table, actual, columns) {
    return {
      metadataTable: table,
      actualTable: actual || table,
      columns: columns ? columns.slice() : [],
      availableColumns: [],
      loaded: false,
      custom: !!columns,
      loading: false,
      error: ""
    };
  }

  function newPair() {
    return {
      key: "pair-" + (++nextKey),
      reader: null,
      writer: null,
      original: null
    };
  }

  var List = {
    name: "DataxConfigTemplateList",
    data: function() {
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
    created: function() {
      this.fetch();
      loadSources(this).catch(function() {});
    },
    watch: {
      "$route.query.batchId": function() {
        this.current = 1;
        this.keyword = "";
        this.fetch();
      }
    },
    methods: {
      fetch: function() {
        var vm = this,
          version = ++vm.fetchVersion;
        vm.loading = true;
        vm.rows = [];
        vm.batch = null;
        vm.selected = [];
        var batchId = vm.$route.query.batchId;
        return request({
            url: batchId ? base : base + "/batches",
            params: {
              keyword: vm.keyword,
              current: vm.current,
              size: 10,
              batchId: batchId
            }
          })
          .then(function(data) {
            if (version !== vm.fetchVersion) return;
            vm.rows = data.records;
            vm.total = data.total;
            vm.selected = [];
            vm.batch = data.batch || null;
          })
          .catch(function() {}).finally(function() {
            if (version === vm.fetchVersion) vm.loading = false;
          });
      },
      newTemplate: function() {
        this.$router.push({
          path: "/datax/job/configTemplateEdit/new-" + Date.now()
        });
      },
      open: function(row) {
        this.$router.push({
          path: "/datax/job/configTemplateEdit/" + row.id,
          query: {
            id: row.id,
            batchId: this.$route.query.batchId
          }
        });
      },
      openBatch: function(row) {
        this.$router.push({
          path: "/datax/job/configTemplate",
          query: {
            batchId: row.id
          }
        });
      },
      back: function() {
        this.$router.push({
          path: "/datax/job/configTemplate"
        });
      },
      downloadGroup: async function(row) {
        this.downloadingId = row.id;
        try {
          await downloadArchive(base + "/batches/" + encodeURIComponent(row.id) + "/download", "GET", null, row.batchCode + ".zip");
        } catch (error) {
          this.$message.error(error.message);
        } finally {
          this.downloadingId = "";
        }
      },
      remove: function(row) {
        var vm = this;
        return vm.$confirm("删除配置记录“" + row.name + "”？", "删除模板", {
            type: "warning"
          })
          .then(function() {
            return api(base + "/" + row.id, "delete");
          }).then(function() {
            vm.$message.success("已删除");
            if (vm.rows.length === 1 && vm.current > 1) vm.current--;
            return vm.fetch();
          }).catch(function() {});
      },
      download: function(row) {
        return api(base + "/" + row.id).then(download).catch(function() {});
      },
      downloadSelected: function() {
        var vm = this;
        vm.downloading = true;
        return downloadZip(vm.selected.map(function(row) {
            return row.id;
          }), vm)
          .catch(function(e) {
            vm.$message.error(e.message);
          }).finally(function() {
            vm.downloading = false;
          });
      },
      sourceName: function(id) {
        var ds = this.datasources.find(function(item) {
          return item.id === id;
        });
        return ds ? ds.datasourceName : "ID: " + id;
      }
    }
  };
  var Editor = {
    name: "DataxConfigTemplateEditor",
    data: function() {
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
        metaSequence: {
          reader: 0,
          writer: 0
        },
        buildVisible: true,
        configurationOpen: false,
        filePickerOpen: false,
        jsonFullscreen: false,
        jsonError: "",
        batchId: "",
        batchCode: "",
        resultFilter: "",
        columnCache: {},
        options: {
          readerSplitPk: "",
          whereParams: "",
          querySql: "",
          preSql: "",
          postSql: ""
        }
      };
    },
    computed: {
      busy: function() {
        return this.loading || this.generating || this.saving || this.projectLoading;
      },
      needsGenerate: function() {
        return this.fingerprint() !== this.generatedFingerprint;
      },
      dirty: function() {
        return this.initialized && this.snapshot() !== this.baseline;
      },
      runtimeSources: function() {
        var vm = this;
        return vm.projectId ? vm.datasources.filter(function(source) {
          return (vm.projectDatasourceIds || []).indexOf(source.id) >= 0;
        }) : vm.datasources;
      }
    },
    created: function() {
      this.init();
    },
    mounted: function() {
      var vm = this;
      this.unloadHandler = function(event) {
        if (vm.dirty) {
          event.preventDefault();
          event.returnValue = "";
        }
      };
      window.addEventListener("beforeunload", this.unloadHandler);
    },
    beforeDestroy: function() {
      window.removeEventListener("beforeunload", this.unloadHandler);
    },
    beforeRouteLeave: function(to, from, next) {
      this.confirmLeave(next);
    },
    beforeRouteUpdate: function(to, from, next) {
      var vm = this;
      this.confirmLeave(function(proceed) {
        if (proceed === false) next(false);
        else {
          next();
          vm.$nextTick(function() { vm.init(); });
        }
      });
    },
    methods: {
      confirmLeave: function(next) {
        if (!this.dirty) return next();
        return this.$confirm("当前配置有未保存的修改，是否离开？", "未保存的配置", {
            type: "warning",
            confirmButtonText: "离开",
            cancelButtonText: "继续编辑"
          })
          .then(function() {
            next();
          }).catch(function() {
            next(false);
          });
      },
      configurations: function() {
        var vm = this;
        return vm.pairs.map(function(pair, index) {
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
            rdbmsWriter: {
              preSql: vm.options.preSql,
              postSql: vm.options.postSql
            },
            sequence: pair.original && vm.id ? pair.original.sequence : index + 1,
            batchId: pair.original && vm.id ? pair.original.batchId : null,
            batchName: pair.original && vm.id ? pair.original.batchName : null
          };
        });
      },
      fingerprint: function() {
        return JSON.stringify(this.configurations());
      },
      snapshot: function() {
        return JSON.stringify([this.name, this.description, this.fingerprint(), this.results.map(function(r) {
          return r.jobJson;
        })]);
      },
      init: async function() {
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
        var requestedId = vm.$route.query.id || (/^\d+$/.test(vm.$route.params.templateKey || "") ? vm.$route.params.templateKey : null);
        vm.buildVisible = !requestedId;
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
          if (requestedId) {
            var dto = await api(base + "/" + requestedId),
              spec = dto.buildConfig;
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
          vm.savedJson = vm.results.map(function(r) {
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
      datasource: function(id) {
        return this.datasources.find(function(ds) {
          return ds.id === id;
        });
      },
      loadProjects: async function() {
        if (this.projectsLoaded) return;
        try {
          this.projects = await api("/api/jobProject/list");
          this.projectsLoaded = true;
          if (!this.projectId) this.projectError = "";
        } catch (error) {
          this.projectError = error.message || "项目列表加载失败，请重试";
        }
      },
      changeProject: async function(id) {
        var vm = this,
          version = ++vm.projectRequest;
        vm.projectId = id || null;
        vm.projectDatasourceIds = id ? [] : null;
        vm.projectError = "";
        vm.projectLoading = !!id;
        if (!id) return;
        try {
          var rows = await api("/api/jobProject/" + id + "/datasources");
          if (version !== vm.projectRequest) return;
          vm.projectDatasourceIds = rows.filter(function(row) {
            return row.status === 1;
          }).map(function(row) {
            return row.id;
          });
          ["reader", "writer"].forEach(function(side) {
            if (vm.projectDatasourceIds.indexOf(vm[side + "DatasourceId"]) < 0) vm.changeRuntimeSource(side, null);
          });
        } catch (error) {
          if (version === vm.projectRequest) vm.projectError = error.message || "项目数据源加载失败，请重试";
        } finally {
          if (version === vm.projectRequest) vm.projectLoading = false;
        }
      },
      sourceName: function(id) {
        var source = this.datasource(id);
        return source ? source.datasourceName : "ID: " + id;
      },
      showBatch: function() {
        this.$router.push({
          path: "/datax/job/configTemplate",
          query: this.batchId ? {
            batchId: this.batchId
          } : {}
        });
      },
      openConfiguration: async function() {
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
      toggleFullscreen: function() {
        this.jsonFullscreen = !this.jsonFullscreen;
        var vm = this;
        this.$nextTick(function() {
          if (vm.$refs.jsonEditor) vm.$refs.jsonEditor.refresh();
        });
      },
      changeRuntimeSource: function(side, id) {
        // Deliberately does not query metadata or clear table/field choices.
        this[side + "DatasourceId"] = id;
      },
      changeMetadataSource: function(side, id) {
        this[side + "MetadataDatasourceId"] = id;
        this[side + "Schema"] = "";
        this.pairs.forEach(function(pair) {
          pair[side] = null;
        });
        this.pairs = this.pairs.filter(function(pair) {
          return pair.reader || pair.writer;
        });
        this[side === "reader" ? "activeReader" : "activeWriter"] = "";
        return this.loadTables(side, false);
      },
      loadTables: async function(side, preserve) {
        var vm = this,
          id = vm[side + "MetadataDatasourceId"],
          sequence = ++vm.metaSequence[side];
        vm[side + "Tables"] = [];
        vm[side + "Schemas"] = [];
        if (!id) return;
        try {
          var ds = vm.datasource(id);
          if (ds && ds.datasource === "postgresql") {
            var schemas = await request({
              url: "/api/metadata/getDBSchema",
              params: {
                datasourceId: id
              }
            });
            if (sequence !== vm.metaSequence[side]) return;
            vm[side + "Schemas"] = schemas;
            if (!vm[side + "Schema"]) {
              var saved = preserve && vm.pairs[0] && vm.pairs[0][side] && vm.pairs[0][side].metadataTable;
              vm[side + "Schema"] = saved && saved.indexOf(".") >= 0 ? saved.split(".")[0] : schemas.indexOf("public") >= 0 ? "public" : schemas[0];
            }
          }
          var tables = await request({
            url: "/api/metadata/getTables",
            params: {
              datasourceId: id,
              tableSchema: vm[side + "Schema"] || undefined
            }
          });
          if (sequence !== vm.metaSequence[side]) return;
          vm[side + "Tables"] = tables.map(function(table) {
            return ds && ds.datasource === "postgresql" && vm[side + "Schema"] && table.indexOf(".") < 0 ? vm[side + "Schema"] + "." + table : table;
          });
          if (!preserve && side === "writer") vm.matchTables();
        } catch (e) {
          if (sequence === vm.metaSequence[side]) vm.$message.warning("模拟库表结构加载失败，请选择可连接的本地数据源");
        }
      },
      changeSchema: function(side, schema) {
        this[side + "Schema"] = schema;
        this.pairs.forEach(function(pair) {
          pair[side] = null;
        });
        this.pairs = this.pairs.filter(function(pair) {
          return pair.reader || pair.writer;
        });
        return this.loadTables(side, false);
      },
      visibleTables: function(side) {
        var filter = this[side + "Filter"].toLowerCase();
        return this[side + "Tables"].filter(function(t) {
          return t.toLowerCase().indexOf(filter) >= 0;
        });
      },
      selectedPair: function(side, table) {
        return this.pairs.find(function(pair) {
          return pair[side] && pair[side].metadataTable === table;
        });
      },
      selectTable: function(side, table, checked) {
        var vm = this,
          other = side === "reader" ? "writer" : "reader",
          found = vm.selectedPair(side, table);
        if (!checked) {
          if (found) vm.$set(found, side, null);
          vm.pairs = vm.pairs.filter(function(pair) {
            return pair.reader || pair.writer;
          });
          return;
        }
        if (found) return found;
        var pair = vm.pairs.find(function(p) {
            return !p[side] && p[other] && normalize(p[other].metadataTable) === normalize(table);
          }) ||
          vm.pairs.find(function(p) {
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
          var match = vm[other + "Tables"].find(function(name) {
            return normalize(name) === normalize(table) && !vm.selectedPair(other, name);
          });
          if (match) vm.$set(pair, other, newSelection(match));
        }
        return pair;
      },
      selectAll: function(side, checked) {
        if (this.id) return;
        var vm = this;
        vm.visibleTables(side).forEach(function(table) {
          vm.selectTable(side, table, checked);
        });
      },
      matchTables: function() {
        var vm = this;
        // Keep unmatched slots empty instead of shifting later rows into the wrong pairing.
        vm.pairs.forEach(function(pair) {
          if (!pair.reader || pair.writer) return;
          var match = vm.writerTables.find(function(table) {
            return normalize(table) === normalize(pair.reader.metadataTable) && !vm.selectedPair("writer", table);
          });
          if (match) vm.$set(pair, "writer", newSelection(match));
        });
      },
      moveTable: function(side, pair, offset) {
        var index = this.pairs.indexOf(pair),
          target = this.pairs[index + offset];
        if (!target) return;
        var current = pair[side];
        this.$set(pair, side, target[side]);
        this.$set(target, side, current);
        this.pairs = this.pairs.filter(function(p) {
          return p.reader || p.writer;
        });
      },
      openFields: async function(side, table) {
        var pair = this.selectedPair(side, table) || this.selectTable(side, table, true);
        if (!pair) return;
        this[side === "reader" ? "activeReader" : "activeWriter"] = pair.key;
        try {
          await this.loadColumns(pair, side);
        } catch (e) {
          this.$message.warning(e.message);
        }
      },
      columnKey: function(id, table) {
        return JSON.stringify([id, table]);
      },
      cachedColumns: function(id, table) {
        var vm = this,
          cache = vm.columnCache,
          key = vm.columnKey(id, table);
        if (!cache[key]) {
          var pending = request({
            url: "/api/metadata/getColumns",
            params: {
              datasourceId: id,
              tableName: table
            }
          }).catch(function(error) {
            if (cache[key] === pending) delete cache[key];
            throw error;
          });
          cache[key] = pending;
        }
        return cache[key];
      },
      applyColumns: function(pair, side, selection, version, columns) {
        if (version !== this.metaSequence[side] || pair[side] !== selection || this.pairs.indexOf(pair) < 0) throw new Error("表结构来源已变化，请重新选择");
        if (!columns.length) throw new Error("模拟表 " + selection.metadataTable + " 没有可用字段");
        selection.availableColumns = columns.slice();
        selection.loaded = true;
        if (!selection.custom) selection.columns = columns.slice();
        if (pair.reader && pair.writer && pair.reader.loaded && pair.writer.loaded && !pair.writer.custom) this.alignFields(pair, false);
      },
      prefetchColumns: async function() {
        var vm = this,
          cache = vm.columnCache,
          targets = [],
          groups = {},
          missing = {},
          completed = 0;
        vm.pairs.forEach(function(pair) {
          ["reader", "writer"].forEach(function(side) {
            var selection = pair[side];
            if (!selection || selection.loaded) return;
            var id = vm[side + "MetadataDatasourceId"],
              key = vm.columnKey(id, selection.metadataTable);
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
        await Promise.all(Object.keys(groups).map(async function(id) {
          var tables = groups[id];
          for (var start = 0; start < tables.length; start += 200) {
            var chunk = tables.slice(start, start + 200);
            var query = request({
              url: "/api/metadata/getColumnsBatch",
              method: "post",
              timeout: 90000,
              data: {
                datasourceId: Number(id),
                tables: chunk
              }
            });
            var pending = chunk.map(function(table) {
              var key = vm.columnKey(Number(id), table);
              var value = query.then(function(data) {
                return data[table] || [];
              }).catch(function(error) {
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
        var values = await Promise.all(targets.map(function(target) {
          return cache[target.key];
        }));
        // Apply together so a large batch does not re-render the table list after every field request.
        targets.forEach(function(target, index) {
          vm.applyColumns(target.pair, target.side, target.selection, target.version, values[index]);
        });
      },
      loadColumns: async function(pair, side) {
        var vm = this,
          selection = pair[side];
        if (!selection) throw new Error("存在未配对的表，请补齐左右同序号的表");
        if (selection.loaded) return;
        var id = vm[side + "MetadataDatasourceId"],
          version = vm.metaSequence[side];
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
      alignFields: function(pair, strict) {
        if (!pair.reader || !pair.writer || !pair.reader.loaded || !pair.writer.loaded) return;
        var target = pair.writer.availableColumns,
          ordered = [];
        pair.reader.columns.forEach(function(column) {
          var name = target.find(function(value) {
            return value.toLowerCase() === column.toLowerCase();
          });
          if (name) ordered.push(name);
        });
        if (!strict) target.forEach(function(column) {
          if (ordered.indexOf(column) < 0) ordered.push(column);
        });
        pair.writer.columns = ordered;
        if (strict) pair.writer.custom = true;
      },
      moveColumn: function(selection, index, offset) {
        var target = index + offset;
        if (target < 0 || target >= selection.columns.length) return;
        var columns = selection.columns.slice(),
          name = columns[index];
        columns[index] = columns[target];
        columns[target] = name;
        selection.columns = columns;
        selection.custom = true;
      },
      validatePairs: function() {
        if (this.projectId && (this.projectLoading || this.projectError)) throw new Error(this.projectError || "正在加载项目数据源，请稍候");
        if (this.projectId && [this.readerDatasourceId, this.writerDatasourceId].some(id => (this.projectDatasourceIds || []).indexOf(id) < 0)) {
          throw new Error("请从当前项目绑定的数据源中选择实际源库和目标库");
        }
        if (!this.readerDatasourceId || !this.writerDatasourceId) throw new Error("请选择写入 JSON 的实际源库和目标库");
        if (!this.readerMetadataDatasourceId || !this.writerMetadataDatasourceId) throw new Error("请选择两侧的模拟表结构库");
        if (!this.pairs.length || this.pairs.length > 500) throw new Error("每批请选择1至500组表");
        this.pairs.forEach(function(pair, index) {
          if (!pair.reader || !pair.writer) throw new Error("第" + (index + 1) + "组未配对，请选择左右同序号的表");
          if (!pair.reader.actualTable.trim() || !pair.writer.actualTable.trim()) throw new Error("第" + (index + 1) + "组实际表名不能为空");
        });
      },
      generate: async function() {
        var vm = this;
        try {
          if (vm.id && !vm.name.trim()) throw new Error("请输入模板名称");
          vm.validatePairs();
          if (vm.id && vm.results.length) {
            try {
              await vm.$confirm("重新生成会覆盖当前 JSON 的手工修改，是否继续？", "重新生成", {
                type: "warning"
              });
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
            [pair.reader, pair.writer].forEach(function(selection) {
              if (selection.columns.some(function(column) {
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
            var operation = await DataxWorkbench.submit("BATCH_GENERATE", {
              name: vm.name.trim(), configurations: configurations
            }, vm.name.trim() || "生成 DataX 配置批次");
            vm.baseline = vm.snapshot();
            vm.$router.push({path:"/datax/operations/jobs", query:{operationId:operation.id}});
            return;
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
      previewName: function(spec) {
        var reader = this.datasource(spec.readerDatasourceId),
          writer = this.datasource(spec.writerDatasourceId);
        return String(spec.sequence || 1).padStart(3, "0") + "_" + (reader ? reader.datasource : "") + "reader2" + (writer ? writer.datasource : "") + "writer_" +
          spec.readerTables[0] + "%2%" + spec.writerTables[0] + ".json";
      },
      validateJson: function(result) {
        if (this.needsGenerate) throw new Error("实际数据源、表或字段已变化，请重新生成 JSON");
        try {
          var doc = JSON.parse(result.jobJson);
          if (!doc.job || !doc.job.content || !doc.job.content.length) throw new Error();
        } catch (e) {
          throw new Error("请输入有效的 DataX JSON");
        }
      },
      saveSingle: async function() {
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
          if (vm.results.every(function(r, i) {
              return r.jobJson === vm.savedJson[i];
            })) vm.baseline = vm.snapshot();
          vm.$message.success("记录已保存");
        } catch (e) {
          vm.$message.warning(e.message || "保存失败");
        } finally {
          vm.saving = false;
        }
      },
      downloadOne: function() {
        try {
          var result = this.results[this.previewIndex];
          this.validateJson(result);
          download(result);
        } catch (e) {
          this.$message.warning(e.message);
        }
      },
      downloadAll: async function() {
        var vm = this;
        try {
          if (vm.needsGenerate || vm.snapshot() !== vm.baseline) throw new Error("请先生成并保存当前修改，再打包下载");
          vm.downloading = true;
          if (vm.batchId) await downloadArchive(base + "/batches/" + encodeURIComponent(vm.batchId) + "/download", "GET", null, (vm.batchCode || vm.batchId) + ".zip");
          else await downloadZip(vm.results.map(function(r) {
            return r.id;
          }), vm);
        } catch (e) {
          vm.$message.warning(e.message);
        } finally {
          vm.downloading = false;
        }
      },
      format: function() {
        try {
          var result = this.results[this.previewIndex];
          result.jobJson = JSON.stringify(JSON.parse(result.jobJson), null, 2);
        } catch (e) {
          this.$message.warning("JSON 格式错误");
        }
      },
      refreshMetadata: async function() {
        this.columnCache = {};
        this.pairs.forEach(function(pair) {
          ["reader", "writer"].forEach(function(side) {
            if (pair[side]) {
              pair[side].loaded = false;
              pair[side].availableColumns = [];
            }
          });
        });
        await Promise.all([this.loadTables("reader", true), this.loadTables("writer", true)]);
      },
      refreshSources: async function() {
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
    }
  };
  exports.List = List;
  exports.Editor = Editor;
  exports.createJsonEditor = createJsonEditor;
  exports.JsonCodeEditor = JsonCodeEditor;

});
