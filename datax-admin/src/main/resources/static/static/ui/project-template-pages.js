/* 项目方案复用、查询映射和有记录的后台导出。直接由浏览器执行。 */
(function (global) {
  'use strict';
  const UI = global.DataxUI, page = global.DataxPages.templateEditor;
  function selection(table, actual, columns, query) {
    return { metadataTable: table, actualTable: actual || table, columns: (columns || []).slice(), availableColumns: [],
      loaded: false, custom: !!columns, loading: false, error: '', querySql: query || '' };
  }
  function copy(vm, row) {
    return UI.commit(vm, 'copy-' + row.id, async () => {
      const input = await vm.$prompt('请输入副本名称', '复制配置模板', { inputValue: (row.name || '配置').slice(0, 95) + ' 副本',
        inputValidator: value => !!value && value.trim().length <= 100 || '名称为1至100个字符' });
      return DataxWorkbench.submit('COPY_CONFIG_TEMPLATE', { id: row.id, name: input.value }, '复制配置模板：' + row.name);
    });
  }
  function exportJob(vm, kind, payload, name) {
    return UI.commit(vm, 'export', async () => {
      const result = await DataxWorkbench.submit(kind, payload, name);
      await vm.$router.push({ path: '/datax/operations/jobs', query: { operationId: result.id } });
    });
  }
  page.data = () => ({ uiReadMode: 'MAPPING', uiRecipeId: null, uiRecipeVersion: null, uiRecipeName: '', uiRecipes: [], uiRecipeError: '', uiStep: 0 });
  Object.assign(page.methods, {
    uiCopyCurrent() {
      if (this.dirty) return this.$message.warning('请先保存当前修改，再复制模板');
      return copy(this, this.results[this.previewIndex]);
    },
    async uiFetchRecipes() {
      this.uiRecipes = []; this.uiRecipeError = '';
      if (!this.projectId) return;
      const projectId = this.projectId;
      try {
        const page = await UI.api('/api/projectRecipes', 'get', null, { projectId, size: 100 });
        if (this.projectId === projectId) this.uiRecipes = page.records || [];
      } catch (error) { if (this.projectId === projectId) this.uiRecipeError = error.message; }
    },
    uiLoadRecipe(id, initial) {
      if (!id) return;
      return UI.commit(this, 'recipe-load', async () => {
        if (!initial && this.dirty) await this.$confirm('载入方案将替换当前表配对与连接选项，是否继续？', '载入项目方案', { confirmButtonText: '载入方案', cancelButtonText: '保留当前配置', type: 'warning' });
        const dto = await UI.api('/api/projectRecipes/' + id), specs = dto.configuration.configurations;
        if (!specs || !specs.length) throw new Error('方案没有表配对，请重新维护');
        await this.changeProject(dto.projectId);
        const first = specs[0]; this.name = dto.configuration.name || dto.name;
        this.uiRecipeId = dto.id; this.uiRecipeVersion = dto.version; this.uiRecipeName = dto.name; this.uiReadMode = dto.mode;
        ['reader', 'writer'].forEach(side => {
          this[side + 'DatasourceId'] = first[side + 'DatasourceId']; this[side + 'MetadataDatasourceId'] = first[side + 'MetadataDatasourceId'];
        });
        Object.assign(this.options, first.rdbmsReader || {}, first.rdbmsWriter || {});
        this.pairs = specs.map((spec, index) => ({ key: 'recipe-' + Date.now() + '-' + index, original: spec,
          reader: selection(spec.readerMetadataTable || spec.readerTables[0], spec.readerTables[0], spec.readerColumns, spec.rdbmsReader && spec.rdbmsReader.querySql),
          writer: Object.assign(selection(spec.writerMetadataTable || spec.writerTables[0], spec.writerTables[0], spec.writerColumns), spec.rdbmsWriter || {}) }));
        this.activeReader = this.activeWriter = this.pairs[0].key;
        this.readerSchema = this.writerSchema = "";
        // 只载入方案，不改变当前正在编辑的 JSON 记录归属。
        await Promise.all([this.loadTables('reader', true), this.loadTables('writer', true)]);
        this.uiStep = 1;
        if (initial) this.baseline = this.snapshot();
        this.$message.success('已载入方案，可调整连接、SQL 或表配对');
      });
    },
    uiSaveRecipe(asNew) {
      return UI.commit(this, 'recipe-save', async () => {
        if (!this.projectId) throw new Error('请先选择项目并绑定实际数据源');
        this.validatePairs(); await this.prefetchColumns(); this.uiValidateColumns();
        const input = await this.$prompt('保存后可直接复用连接、表配对、字段顺序与 SQL', asNew ? '另存为项目方案' : '保存项目方案', {
          inputValue: this.uiRecipeName || this.name,
          inputValidator: value => !!value && value.trim().length <= 100 || '名称为1至100个字符' });
        const dto = await UI.api('/api/projectRecipes', 'post', { id: asNew ? null : this.uiRecipeId,
          version: asNew ? null : this.uiRecipeVersion, projectId: this.projectId, name: input.value,
          mode: this.uiReadMode, configuration: { name: this.name, configurations: this.configurations() } });
        this.uiRecipeId = dto.id; this.uiRecipeVersion = dto.version; this.uiRecipeName = dto.name;
        await this.uiFetchRecipes(); this.$message.success('项目方案已保存');
      });
    },
    uiModeChanged() {
      this.pairs.forEach(pair => { if (pair.reader) { pair.reader.loaded = false; pair.reader.custom = false; pair.reader.availableColumns = []; } });
    },
    uiQueryChanged(pair) { if (pair && pair.reader) { pair.reader.loaded = false; pair.reader.availableColumns = []; } },
    async uiReadQueryColumns(pair) {
      const reader = pair && pair.reader;
      if (!reader) throw new Error('请先选择源表');
      if (!this.projectId) throw new Error('查询映射需要选择项目');
      const sql = reader.querySql || this.options.querySql;
      if (!sql || !sql.trim()) throw new Error('请填写读取 SQL');
      const datasourceId = this.readerMetadataDatasourceId, table = reader.metadataTable;
      const version = this.metaSequence.reader;
      reader.loading = true; reader.error = '';
      try {
        const columns = await UI.api('/api/projectRecipes/queryColumns', 'post', { projectId: this.projectId, metadataDatasourceId: datasourceId, table, sql });
        if (version !== this.metaSequence.reader || pair.reader !== reader || this.pairs.indexOf(pair) < 0 || sql !== (reader.querySql || this.options.querySql)) throw new Error('SQL 或模拟库已变化，请重新读取字段');
        this.applyColumns(pair, 'reader', reader, version, columns);
        return columns;
      } catch (error) { reader.error = error.message; throw error; }
      finally { reader.loading = false; }
    },
    uiReadActiveQuery() {
      return UI.commit(this, 'query-columns', () => this.uiReadQueryColumns(this.uiActivePair('reader')));
    },
    uiValidateColumns() {
      this.pairs.forEach((pair, index) => {
        if (!pair.reader.columns.length || pair.reader.columns.length !== pair.writer.columns.length) throw new Error('第' + (index + 1) + '组字段数量不一致或为空，请调整配对');
        [pair.reader, pair.writer].forEach(item => { if (item.columns.some(column => !item.availableColumns.includes(column))) throw new Error('表或查询输出字段已变化，请重新选择字段'); });
      });
    },
    uiNextStep() {
      if (this.uiStep === 0) {
        if (this.projectLoading || this.projectError) return this.$message.warning(this.projectError || '项目连接正在加载');
        this.uiStep = 1;
      } else {
        if (!this.readerDatasourceId || !this.writerDatasourceId || !this.readerMetadataDatasourceId || !this.writerMetadataDatasourceId) return this.$message.warning('请选择两侧实际数据源和模拟表结构库');
        this.uiStep = 2;
      }
    },
    downloadOne() {
      const current = this.results[this.previewIndex];
      if (!current || this.needsGenerate || current.jobJson !== this.savedJson[this.previewIndex]) return this.$message.warning('请先生成并保存当前 JSON，再导出');
      return exportJob(this, 'EXPORT_TEMPLATE', { id: current.id }, '导出配置：' + current.fileName);
    },
    downloadAll() {
      if (this.needsGenerate || this.dirty) return this.$message.warning('请先保存当前修改，再导出整个批次');
      return exportJob(this, this.batchId ? 'EXPORT_BATCH' : 'EXPORT_SELECTION', this.batchId ? { batchId: this.batchId } : { ids: this.results.map(row => row.id) }, '导出批次：' + (this.batchCode || this.name));
    }
  });
  const enhance = page.enhance;
  page.enhance = function (options, original) {
    enhance(options, original);
    const busy = options.computed.busy;
    options.computed.busy = function () { return busy.call(this) || !!this.uiPending['recipe-load'] || !!this.uiPending['recipe-save'] || !!this.uiPending.export; };
    const methods = options.methods, init = methods.init, configure = methods.configurations, change = methods.changeProject, columns = methods.loadColumns, prefetch = methods.prefetchColumns;
    methods.init = async function () {
      this.uiStep = 0; this.uiReadMode = 'MAPPING'; this.uiRecipeId = this.uiRecipeVersion = null; this.uiRecipeName = ''; this.uiRecipes = [];
      await init.call(this);
      if (this.error) return;
      if (this.id && this.pairs[0]) {
        const spec = this.pairs[0].original;
        this.uiReadMode = spec.rdbmsReader && spec.rdbmsReader.querySql ? 'QUERY' : 'MAPPING';
        this.$set(this.pairs[0].reader, 'querySql', spec.rdbmsReader && spec.rdbmsReader.querySql || '');
        Object.assign(this.pairs[0].writer, spec.rdbmsWriter || {});
        if (spec.projectId) { await this.loadProjects(); await this.changeProject(spec.projectId); }
        this.generatedFingerprint = this.fingerprint(); this.baseline = this.snapshot();
      }
      if (this.$route.query.recipeId) await this.uiLoadRecipe(this.$route.query.recipeId, true);
    };
    methods.configurations = function () {
      const specs = configure.call(this);
      specs.forEach((spec, index) => { spec.projectId = this.projectId; const writer = this.pairs[index].writer || {}; spec.rdbmsWriter.preSql = writer.preSql || this.options.preSql; spec.rdbmsWriter.postSql = writer.postSql || this.options.postSql; spec.rdbmsReader.querySql = this.uiReadMode === 'QUERY' ? (this.pairs[index].reader.querySql || this.options.querySql) : ''; });
      return specs;
    };
    methods.changeProject = async function (id) {
      const previous = this.projectId; await change.call(this, id);
      if (previous !== this.projectId) { this.uiRecipeId = this.uiRecipeVersion = null; this.uiRecipeName = ''; }
      return this.uiFetchRecipes();
    };
    methods.loadColumns = function (pair, side) {
      if (this.uiReadMode === 'QUERY' && side === 'reader' && pair.reader && !pair.reader.loaded) return this.uiReadQueryColumns(pair);
      return columns.call(this, pair, side);
    };
    methods.prefetchColumns = async function () {
      if (this.uiReadMode === 'QUERY') {
        const pending = this.pairs.filter(pair => pair.reader && !pair.reader.loaded);
        let index = 0;
        // 查询结构最多四路并行，避免批量配置耗尽模拟数据库连接。
        const worker = async () => { while (index < pending.length) { const pair = pending[index++]; await this.uiReadQueryColumns(pair); } };
        await Promise.all(Array.from({ length: Math.min(4, pending.length) }, worker));
      }
      return prefetch.call(this);
    };
  };
  Object.assign(global.DataxPages.batches.methods, {
    uiCopy(row) { return copy(this, row); },
    downloadGroup(row) { return exportJob(this, 'EXPORT_BATCH', { batchId: row.id }, '导出批次：' + row.batchCode); },
    download(row) { return exportJob(this, 'EXPORT_TEMPLATE', { id: row.id }, '导出配置：' + row.fileName); },
    downloadSelected() {
      if (!this.selected.length) return this.$message.warning('请先选择配置');
      return exportJob(this, 'EXPORT_SELECTION', { ids: this.selected.map(row => row.id) }, '导出所选配置');
    }
  });
})(window);
