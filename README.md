# SQL Learning Lab

一个用于可视化学习 SQL 与训练数据分析思维的个人练习站。V1 为纯前端应用，题目保存在本地 JSON，学习进度保存在浏览器 `localStorage`。

## 本地运行

如果只想使用网站，直接双击根目录的 `index.html` 即可，不需要启动服务器。

如需修改或开发代码，需要 Node.js 20 或更高版本：

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

构建命令会同时更新根目录的单文件版 `index.html`。开发入口保存在 `app.html`，请不要手动编辑自动生成的 `index.html`。

## 当前功能

- Dashboard：学习天数、完成题目、课程进度、薄弱知识点与最近练习
- Learning Path：11 个渐进章节，包含理论、Pandas 对照、SQL 示例和交互可视化
- 20 道数据分析 SQL 题，支持搜索、章节、难度、完成状态和错题筛选
- 双栏专注工作台：放大的题目数据区与 SQL 编辑器
- 提交 SQL 后通过弹窗显示运行状态与结果表格
- 分步骤解题思路：目标、SQL 片段、JOIN / GROUP BY / 窗口计算中间表、最终 SQL
- 专项可视化：LEFT JOIN 匹配与 NULL、GROUP BY 分组桶、WHERE/HAVING 执行阶段、窗口范围
- SQL Playground：SELECT、WHERE、GROUP BY、JOIN、WINDOW 五类实验
- 浏览器内置 SQL/WASM 数据库，真实执行查询并严格核对字段、行数与结果值
- 自动保存课程进度、SQL 草稿、做题次数、错误 SQL、完成状态和错题记录
- 响应式布局，支持桌面端与移动端

## 内容体系参考

课程与练习体系参考了以下开源项目的章节组织和教学方向，站内文本、示例数据与可视化均针对本项目重新设计：

- [Datawhale wonderful-sql](https://github.com/datawhalechina/wonderful-sql)
- [WebDevSimplified Learn-SQL](https://github.com/WebDevSimplified/Learn-SQL)
- [Practical SQL 2](https://github.com/anthonydb/practical-sql-2)

## 目录结构

```text
src/
├─ components/      通用 UI、数据表与解析抽屉
├─ data/            课程、20 题题库与 Playground JSON
├─ hooks/           React 状态封装
├─ pages/           题库首页与练习工作台
├─ services/        localStorage 与 SQL 教学执行器
└─ types/           可扩展的数据模型
```

后续接入 Pandas、AI 助手或用户系统时，可以保持题库与页面组件不变，继续扩展 `services` 层。
