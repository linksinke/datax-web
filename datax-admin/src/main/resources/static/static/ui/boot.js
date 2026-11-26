/* Runs directly in the browser. Spring Boot serves the HTML, JavaScript and CSS files. */
(function () {
    "use strict";
    var manifest = window.DataxManifest, status = document.getElementById("boot-status");

    function script(url) {
        return new Promise(function (resolve, reject) {
            var node = document.createElement("script");
            node.src = url;
            node.onload = resolve;
            node.onerror = function () {
                reject(new Error("界面资源加载失败"));
            };
            document.head.appendChild(node);
        });
    }

    function loadTemplates() {
        return Promise.all(Object.keys(manifest.views).map(function (name) {
            return fetch(manifest.views[name], {
                credentials: "same-origin",
                cache: "no-cache"
            }).then(function (response) {
                if (!response.ok) throw new Error("页面模板加载失败");
                return response.text();
            }).then(function (html) {
                window.DataxUI.templates[name] = html;
            });
        }));
    }

    function fail(error) {
        status.removeAttribute("aria-busy");
        status.className = "boot-failed";
        status.innerHTML = '<strong>工作台暂时未能加载</strong><p>请检查网络连接后重试。</p><button type="button">重新加载</button>';
        status.querySelector("button").onclick = function () {
            location.reload();
        };
        console.error(error);
    }

    Promise.resolve().then(function () {
        return script(manifest.compiler);
    }).then(function () {
        window.Vue.config.productionTip = false;
        window.Vue.config.devtools = false;
        window.DataxCompile = window.Vue.compile;
        delete window.Vue;
        return Promise.all([loadTemplates(), script(manifest.element).then(function () {
            return script(manifest.libraries);
        }).then(function () {
            return script(manifest.runtime);
        })]);
    }).then(function () {
        return manifest.modules.reduce(function (promise, url) {
            return promise.then(function () {
                return script(url);
            });
        }, Promise.resolve());
    }).then(function () {
        return script(manifest.app);
    }).then(function () {
        status.remove();
    }).catch(fail);
})();
