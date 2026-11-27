/* Readable browser module. HTML templates live under ui/views/. */
DataxModules.define("datax-project", function(module, exports, require) {
  "use strict";
  var request = require("utils/request").default;

  function api(url, method, data, params) {
    return request({
      url: url,
      method: method || "get",
      data: data,
      params: params
    });
  }

  function availability(source) {
    return source.status === 1 ? "" : source.status === 2 ? "已禁用" : source.status === 0 ? "已删除" : "不可用";
  }

  function label(source) {
    return (source.datasourceName || "数据源 #" + source.id) + "（" + (availability(source) || source.datasource || "未知类型") + "）";
  }

  module.exports = {
    name: "jobProject",
    data: function() {
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
        form: {
          id: null,
          name: "",
          description: "",
          datasourceIds: [],
          datasources: []
        }
      };
    },
    computed: {
      sourceOptions: function() {
        var options = this.availableSources.slice();
        this.form.datasources.forEach(function(source) {
          if (!options.some(function(option) {
              return option.id === source.id;
            })) options.push(source);
        });
        return options;
      },
      selectedSources: function() {
        var options = this.sourceOptions;
        return this.form.datasourceIds.map(function(id) {
          return options.find(function(source) {
            return source.id === id;
          }) || {
            id: id
          };
        });
      }
    },
    created: function() {
      this.fetch();
    },
    activated: function() {
      if (this.hasActivated) this.fetch();
      else this.hasActivated = true;
    },
    methods: {
      fetch: async function() {
        var vm = this,
          version = ++vm.fetchVersion;
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
      search: function() {
        this.current = 1;
        return this.fetch();
      },
      open: async function(mode, row) {
        var vm = this,
          version = ++vm.dialogVersion;
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
          vm.availableSources = result[0].filter(function(source) {
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
      close: function() {
        if (!this.saving) {
          ++this.dialogVersion;
          this.dialogVisible = false;
        }
      },
      save: async function() {
        var vm = this;
        if (vm.saving || vm.dialogLoading || vm.dialogError) return;
        if (!vm.form.name.trim()) {
          vm.$message.warning("请填写项目名称");
          return;
        }
        vm.saving = true;
        try {
          var bindingOnly = vm.mode === "bindings";
          var body = bindingOnly ? {
            datasourceIds: vm.form.datasourceIds.slice()
          } : {
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
      remove: async function(row) {
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
          var ok = await api("/api/jobProject", "delete", null, {
            idList: row.id
          });
          if (!ok) throw new Error("删除失败，请刷新后重试");
          if (this.rows.length === 1 && this.current > 1) --this.current;
          this.$message.success("项目已删除");
          await this.fetch();
        } catch (error) {
          this.$message.error(error.message || "删除失败，请重试");
        }
      },
      generate: function(row) {
        this.$router.push({
          path: "/datax/job/configTemplateEdit/new-" + Date.now(),
          query: {
            projectId: row.id,
            name: row.name
          }
        });
      }
    }
  };

});
