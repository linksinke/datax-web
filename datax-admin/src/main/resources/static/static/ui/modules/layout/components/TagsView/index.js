/* Original readable DataX Web UI source: layout/components/TagsView/index; MIT license.
 * HTML is loaded separately from ui/views/. Runs directly in the browser. */
DataxModules.define("layout/components/TagsView/index", function(module, exports, require) {

  const ScrollPaneModule = require("layout/components/TagsView/ScrollPane");
  const pathModule = require("path");

  const defaultExport = {
    components: {
      ScrollPane: ScrollPaneModule.default
    },
    data() {
      return {
        visible: false,
        top: 0,
        left: 0,
        selectedTag: {},
        affixTags: []
      }
    },
    computed: {
      visitedViews() {
        return this.$store.state.tagsView.visitedViews
      },
      routes() {
        return this.$store.state.permission.routes
      }
    },
    watch: {
      $route() {
        this.closeMenu()
        this.addTags()
        this.moveToCurrentTag()
      },
      visible(value) {
        this.syncMenuListeners(value)
      }
    },
    mounted() {
      this.initTags()
      this.addTags()
    },
    beforeDestroy() {
      this.syncMenuListeners(false)
    },
    methods: {
      isActive(route) {
        return route.path === this.$route.path
      },
      filterAffixTags(routes, basePath = '/') {
        let tags = []
        routes.forEach(route => {
          if (route.meta && route.meta.affix) {
            const tagPath = pathModule.default.resolve(basePath, route.path)
            tags.push({
              fullPath: tagPath,
              path: tagPath,
              name: route.name,
              meta: {
                ...route.meta
              }
            })
          }
          if (route.children) {
            const tempTags = this.filterAffixTags(route.children, route.path)
            if (tempTags.length >= 1) {
              tags = [...tags, ...tempTags]
            }
          }
        })
        return tags
      },
      initTags() {
        const affixTags = this.affixTags = this.filterAffixTags(this.routes)
        for (const tag of affixTags) {
          // Must have tag name
          if (tag.name) {
            this.$store.dispatch('tagsView/addVisitedView', tag)
          }
        }
      },
      addTags() {
        const {
          name
        } = this.$route
        if (name) {
          this.$store.dispatch('tagsView/addView', this.$route)
        }
        return false
      },
      moveToCurrentTag() {
        const tags = this.$refs.tag
        this.$nextTick(() => {
          for (const tag of tags) {
            if (tag.to.path === this.$route.path) {
              this.$refs.scrollPane.moveToTarget(tag)
              // when query is different then update
              if (tag.to.fullPath !== this.$route.fullPath) {
                this.$store.dispatch('tagsView/updateVisitedView', this.$route)
              }
              break
            }
          }
        })
      },
      refreshSelectedTag(view) {
        this.closeMenu()
        return this.$store.dispatch('tagsView/delCachedView', view).then(() => {
          const {
            fullPath
          } = view
          this.$nextTick(() => {
            this.$router.replace({
              path: '/redirect' + fullPath
            })
          })
        })
      },
      closeSelectedTag(view) {
        this.closeMenu()
        if (!view || (view.meta && view.meta.affix)) return Promise.resolve()
        return this.$store.dispatch('tagsView/delView', view).then(({
          visitedViews
        }) => {
          if (this.isActive(view)) {
            this.toLastView(visitedViews, view)
          }
        })
      },
      closeOthersTags() {
        this.closeMenu()
        this.$router.push(this.selectedTag)
        return this.$store.dispatch('tagsView/delOthersViews', this.selectedTag).then(() => {
          this.moveToCurrentTag()
        })
      },
      closeAllTags(view) {
        this.closeMenu()
        return this.$store.dispatch('tagsView/delAllViews').then(({
          visitedViews
        }) => {
          if (visitedViews.some(tag => tag.path === this.$route.path)) {
            return
          }
          this.toLastView(visitedViews, view)
        })
      },
      toLastView(visitedViews, view) {
        const latestView = visitedViews.slice(-1)[0]
        if (latestView) {
          this.$router.push(latestView)
        } else {
          // now the default is to redirect to the home page if there is no tags-view,
          // you can adjust it according to your needs.
          if (view.name === 'Dashboard') {
            // to reload home page
            this.$router.replace({
              path: '/redirect' + view.fullPath
            })
          } else {
            this.$router.push('/')
          }
        }
      },
      openMenu(tag, e) {
        this.selectedTag = tag
        this.placeMenu(e.clientX, e.clientY, 184, 168)
        this.visible = true
        this.$nextTick(() => {
          if (!this.visible || !this.$refs.contextMenu) return
          const bounds = this.$refs.contextMenu.getBoundingClientRect()
          this.placeMenu(e.clientX, e.clientY, bounds.width || 184, bounds.height || 168)
        })
      },
      placeMenu(x, y, width, height) {
        const viewportWidth = document.documentElement.clientWidth || window.innerWidth
        const viewportHeight = document.documentElement.clientHeight || window.innerHeight
        this.left = Math.max(8, Math.min(x + 4, viewportWidth - width - 8))
        this.top = Math.max(8, Math.min(y + 4, viewportHeight - height - 8))
      },
      syncMenuListeners(visible) {
        const method = visible ? 'addEventListener' : 'removeEventListener'
        document[method]('pointerdown', this.handleOutsideMenu, true)
        document[method]('keydown', this.handleMenuKey)
        window[method]('resize', this.closeMenu)
        window[method]('scroll', this.handleMenuScroll, true)
      },
      handleOutsideMenu(event) {
        if (!this.$refs.contextMenu || !this.$refs.contextMenu.contains(event.target)) this.closeMenu()
      },
      handleMenuKey(event) {
        if (event.key === 'Escape') this.closeMenu()
      },
      handleMenuScroll(event) {
        if (!this.$refs.contextMenu || !this.$refs.contextMenu.contains(event.target)) this.closeMenu()
      },
      closeMenu() {
        this.visible = false
      }
    }
  }

  Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
      return defaultExport;
    }
  });
  Object.assign(defaultExport, DataxUI.part(defaultExport, "tags"));
});
