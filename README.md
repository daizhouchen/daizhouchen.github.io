# daizhouchen.github.io

戴宙辰 · AI 产品作品集站点（GitHub Pages 自动部署）。

- **在线访问**：<https://daizhouchen.github.io>
- **形态**：多页静态 HTML/CSS/JS，页面资源本地托管，无构建步骤、无追踪脚本。
- **内容**：UniTrade / 产品作品 / 技术实践 / 影像作品 / AI Skills / 经历 / 联系。

## 本地预览

在仓库根目录启动 HTTP 服务，再打开 `http://localhost:8000`。能力森林使用模块脚本，需要通过 HTTP 预览。

```bash
python -m http.server 8000
```

## 更新方式

主页内容在 `index.html`，统一视觉规则在 `assets/portfolio.css`，当前章节导航在 `assets/homepage.js`。案例页位于 `demo/`，截图和示意图位于 `assets/`。原型、本机工作台、历史交付与研究实验在文案中分别说明；UniTrade 不展示商品、供应商或经营数据。

图立方作为独立科研产品展示于技术实践区，项目介绍为 `demo/tulifang.html`，个人角色统一为“主要负责学生”。日内瓦、纽伦堡两项国际发明金奖与技术说明链接到公开来源；时序超图配图为概念示意。原始项目文档、客户明细和平台业务数据不随站点发布。

修改后先检查桌面和手机布局、导航锚点与目标链接，再 push 到 `main` 分支，由 GitHub Pages 自动发布。项目功能以对应仓库为准，主页介绍与其公开版本保持一致。

## 影像作品

主页 `#films` 展示《像人一样回答之后》最新叙事版，4 分 06 秒、1080p，包含中文字幕和中文合成旁白。浏览器原生播放器点击后加载视频，支持移动设备内嵌播放和全屏。媒体与公开旁白、研究资料及素材许可保存在 `assets/films/`，样式在 `assets/films.css`。档案与情境素材、原创图示和合成声音的性质在片中及来源清单中说明。

影像区标题与引语的补充字形保存在 `assets/fonts/portfolio-serif-film.woff2`，来自同一份 Noto Serif SC 字体并遵循现有 OFL 许可；新增字形记录在 `film-subset-text.txt`。

## 字体与动效

章节标题与引语使用本地托管的 Noto Serif SC 子集（500 字重，重命名为 Portfolio Serif），来源为 [Google Fonts 官方仓库](https://github.com/google/fonts/tree/main/ofl/notoserifsc)，许可证保存在 `assets/fonts/OFL-NotoSerifSC.txt`。`subset-text.txt` 记录当前收录字符；新增标题字符时应重新生成子集，未收录字符会使用 CSS 指定的中文衬线后备字体。正文采用设备可用的中文无衬线字体，无第三方字体请求。

轻量入场动效使用浏览器原生 API；禁用 JavaScript 时内容仍全部可见，系统选择减少动态效果时停止动效并保留原生锚点导航。
