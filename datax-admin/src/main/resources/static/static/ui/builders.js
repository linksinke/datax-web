/* DataX wizard actions, running directly in the browser. */
(function () {
  "use strict";
  var UI = window.DataxUI;
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  var common = {
    fetchData: function () {
      var vm = this;
      return UI.read(vm, function () { return UI.api("/api/jobTemplate/pageList", "get", null, vm.listQuery); }, function (value) { vm.list = value.data || []; vm.total = Number(value.recordsTotal || 0); });
    },
    uiOpenTemplates: function () { this.jobTemplateSelectDrawer = true; return this.fetchData(); },
    uiChooseTemplate: function (row) {
      this.temp = clone(row); delete this.temp.id; this.temp.templateId = row.id;
      this.temp.jobDesc = this.$refs.reader.getData().tableName || row.jobDesc;
      this.jobTemplate = row.jobDesc; this.jobTemplateSelectDrawer = false;
    },
    uiNext: function () {
      try {
        var side = this.active === 1 ? "reader" : "writer";
        if (this.active < 3 && !this.$refs[side].getData().datasourceId) throw new Error("请先选择" + (side === "reader" ? "源库" : "目标库") + "数据源");
        if (this.active === 3 && this.$options.uiBuilderKind === "single") {
          var vm = this; return this.uiGenerate().then(function (done) { if (done) vm.active = 4; });
        }
        this.next();
      } catch (error) { this.$message.warning(error.message || "请完善当前步骤配置"); }
    },
    uiCopyJson: function () {
      var value = typeof this.configJson === "string" ? this.configJson : JSON.stringify(this.configJson, null, 2);
      var vm = this;
      if (!navigator.clipboard) return vm.$message.info("当前浏览器不支持直接复制，可在编辑器中选择复制");
      navigator.clipboard.writeText(value).then(function () { vm.$message.success("JSON 已复制"); }).catch(function () { vm.$message.error("复制失败，请在编辑器中选择复制"); });
    }
  };
  var single = {
    uiGenerate: function () {
      var vm = this;
      return UI.commit(vm, "build", function () {
        var permission = vm.configJson ? vm.$confirm("重新生成将替换当前 JSON，是否继续？", "重新生成", { confirmButtonText: "重新生成", cancelButtonText: "保留当前配置", type: "warning" }) : Promise.resolve();
        return permission.then(function () {
          var reader = vm.$refs.reader.getData(), writer = vm.$refs.writer.getData();
          var config = {
            readerDatasourceId: reader.datasourceId, readerTables: [reader.tableName], readerColumns: vm.$refs.mapper.getLColumns(),
            writerDatasourceId: writer.datasourceId, writerTables: [writer.tableName], writerColumns: vm.$refs.mapper.getRColumns(),
            hiveReader: { readerPath: reader.path, readerDefaultFS: reader.defaultFS, readerFileType: reader.fileType, readerFieldDelimiter: reader.fieldDelimiter, readerSkipHeader: reader.skipHeader },
            hiveWriter: { writerDefaultFS: writer.defaultFS, writerFileType: writer.fileType, writerPath: writer.path, writerFileName: writer.fileName, writeMode: writer.writeMode, writeFieldDelimiter: writer.fieldDelimiter },
            rdbmsReader: { readerSplitPk: reader.splitPk, whereParams: reader.where, querySql: reader.querySql }, rdbmsWriter: { preSql: writer.preSql, postSql: writer.postSql },
            hbaseReader: { readerMode: reader.mode, readerMaxVersion: reader.maxVersion, readerRange: reader.range },
            hbaseWriter: { writerMode: writer.mode, writerRowkeyColumn: writer.rowkeyColumn, writerVersionColumn: writer.versionColumn, writeNullMode: writer.nullMode },
            mongoDBReader: {}, mongoDBWriter: { upsertInfo: writer.upsertInfo }
          };
          return UI.api("/api/dataxJson/buildJson", "post", config);
        });
      }, function (json) { vm.configJson = JSON.stringify(typeof json === "string" ? JSON.parse(json) : json, null, 2); return true; });
    },
    uiSaveBuiltTask: function () {
      var vm = this;
      return UI.commit(vm, "save", function () {
        if (!vm.temp.projectId) throw new Error("请先选择调度模板，以确定任务所属项目和执行器");
        if (!vm.temp.jobDesc || !vm.temp.jobCron) throw new Error("请填写任务名称与 Cron 表达式");
        var value = clone(vm.temp); value.jobJson = typeof vm.configJson === "string" ? vm.configJson : JSON.stringify(vm.configJson);
        JSON.parse(value.jobJson); return UI.api("/api/job/add", "post", value);
      }, function () { vm.$message.success("任务已创建"); vm.$router.push("/datax/job/jobInfo"); });
    }
  };
  var batch = {
    uiSaveBuiltTask: function () {
      var vm = this;
      return UI.commit(vm, "save", function () {
        var reader = vm.$refs.reader.getData(), writer = vm.$refs.writer.getData();
        var sourceTables = vm.$refs.mapper.getLTables(), targetTables = vm.$refs.mapper.getRTables();
        if (!vm.temp.templateId) throw new Error("请选择调度模板");
        if (!sourceTables.length || sourceTables.length !== targetTables.length) throw new Error("请完整配对源表与目标表");
        return UI.api("/api/job/batchAdd", "post", { readerDatasourceId: reader.datasourceId, readerTables: sourceTables,
          writerDatasourceId: writer.datasourceId, writerTables: targetTables, rdbmsReader: { readerSplitPk: reader.splitPk }, rdbmsWriter: {}, templateId: vm.temp.templateId });
      }, function () { vm.$message.success("任务已批量创建"); vm.$router.push("/datax/job/jobInfo"); });
    }
  };
  window.DataxPages.buildSingle = { data: function () { return { executorList: [] }; }, methods: Object.assign({}, common, single), enhance: function (options) { options.uiBuilderKind = "single"; } };
  window.DataxPages.buildBatch = { data: function () { return { executorList: [] }; }, methods: Object.assign({}, common, batch), enhance: function (options) { options.uiBuilderKind = "batch"; } };
})();
