# daizhouchen.github.io

戴宙辰 · AI 产品作品集站点（GitHub Pages 自动部署）。

- **在线访问**：<https://daizhouchen.github.io>
- **形态**：多页静态 HTML/CSS/JS，页面资源本地托管，无构建步骤、无追踪脚本。
- **内容**：UniTrade / 产品作品 / 技术实践 / AI Skills / 经历 / 联系。

## 本地预览

在仓库根目录启动 HTTP 服务，再打开 `http://localhost:8000`。能力森林使用模块脚本，需要通过 HTTP 预览。

```bash
python -m http.server 8000
```

## 更新方式

主页内容在 `index.html`，统一视觉规则在 `assets/portfolio.css`，当前章节导航在 `assets/homepage.js`。案例页位于 `demo/`，截图和示意图位于 `assets/`。原型、本机工作台、历史交付与研究实验在文案中分别说明；UniTrade 不展示商品、供应商或经营数据。

修改后先检查桌面和手机布局、导航锚点与目标链接，再 push 到 `main` 分支，由 GitHub Pages 自动发布。项目功能以对应仓库为准，主页介绍与其公开版本保持一致。
