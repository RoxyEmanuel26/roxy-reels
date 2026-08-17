// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  description: "Cloudflare Pages route exclusion \u2014 file statis tidak melewati Worker",
  include: [
    "/api/*",
    "/watch/*",
    "/*/watch/*",
    "/actor",
    "/actor/*",
    "/*/actor",
    "/*/actor/*",
    "/category",
    "/category/*",
    "/*/category",
    "/*/category/*",
    "/studio",
    "/studio/*",
    "/*/studio",
    "/*/studio/*",
    "/search",
    "/search/*",
    "/*/search",
    "/*/search/*",
    "/trending",
    "/*/trending",
    "/recent",
    "/*/recent",
    "/actors",
    "/*/actors",
    "/categories",
    "/*/categories",
    "/popular-actors",
    "/*/popular-actors",
    "/watch-later",
    "/*/watch-later",
    "/history",
    "/*/history",
    "/studios",
    "/*/studios",
    "/sitemap.xml",
    "/",
    "/en",
    "/en/",
    "/id",
    "/id/",
    "/ja",
    "/ja/",
    "/ko",
    "/ko/",
    "/zh-TW",
    "/zh-TW/",
    "/zh-CN",
    "/zh-CN/",
    "/th",
    "/th/",
    "/vi",
    "/vi/",
    "/ms",
    "/ms/",
    "/fil",
    "/fil/",
    "/fr",
    "/fr/",
    "/pt",
    "/pt/",
    "/de",
    "/de/"
  ],
  exclude: [
    "/assets/*",
    "/sitemaps/*",
    "/.well-known/*",
    "/robots.txt",
    "/llms.txt",
    "/ads.txt",
    "/favicon.ico",
    "/_headers",
    "/b773d20d41194391a49701f57581638e.txt"
  ]
};

// C:/Users/Roxy Emanuel/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "E:\\00 projek rumah\\antigravity\\roxy-reels\\.wrangler\\tmp\\pages-xSHTW9\\functionsWorker-0.49405907933167725.mjs";
import { isRoutingRuleMatch } from "C:\\Users\\Roxy Emanuel\\AppData\\Local\\npm-cache\\_npx\\32026684e21afda6\\node_modules\\wrangler\\templates\\pages-dev-util.ts";
export * from "E:\\00 projek rumah\\antigravity\\roxy-reels\\.wrangler\\tmp\\pages-xSHTW9\\functionsWorker-0.49405907933167725.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=1u316sufx1r.js.map
