/* Read-only loader map for existing business controls. This is a browser loader, not a build tool. */
(function () {
  var definitions = {
    overview: { chunks: ["chunk-65c33404"], module: "3f2c" },
    tasks: { chunks: ["chunk-commons", "chunk-52071f51", "chunk-5c8098c9", "chunk-7ff5eb73", "chunk-6ace4dde"], module: "8f79" },
    schedulerTemplates: { chunks: ["chunk-commons", "chunk-7ff5eb73", "chunk-3a8a15ea"], module: "e7ae" },
    datasources: { chunks: ["chunk-commons", "chunk-60797987"], module: "1cf5" },
    executors: { chunks: ["chunk-commons", "chunk-cc2bc43e"], module: "9056" },
    users: { chunks: ["chunk-commons", "chunk-4ba76b80"], module: "f6d3" },
    logs: { chunks: ["chunk-commons", "chunk-4c5a09d8"], module: "8ba2" },
    resources: { chunks: ["chunk-6d2adc59"], module: "4596" },
    buildSingle: { chunks: ["chunk-commons", "chunk-52071f51", "chunk-03d38440", "chunk-35cb90ad"], module: "34e3" },
    buildBatch: { chunks: ["chunk-commons", "chunk-03d38440", "chunk-2d0db496"], module: "6ee6" },
    projects: { chunks: [], module: "datax-project" },
    batches: { chunks: [], module: "datax-config-template", member: "List" },
    templateEditor: { chunks: [], module: "datax-config-template", member: "Editor" },
    login: { chunks: ["chunk-4d80a2a0"], module: "9ed6" },
    profile: { chunks: ["chunk-d7a3743e"], module: "ecac" },
    "not-found": { chunks: ["chunk-5bfc3adc"], module: "1db4" },
    forbidden: { chunks: ["chunk-46fcab30"], module: "24e2" }
  };
  window.DataxCompatibility = {
    load: function (view, require) {
      var definition = definitions[view];
      if (!definition) return Promise.resolve({ name: view });
      return Promise.all(definition.chunks.map(function (chunk) { return require.e(chunk); })).then(function () {
        var result = require(definition.module);
        return definition.member ? result[definition.member] : result.default || result;
      });
    }
  };
})();
