# 漫想 · Vercel 部署指南（内测版）

> 目标：先用 Vercel 默认域名 `xxx.vercel.app` 上线内测，发给朋友体验。
> 绑定 `manxiang.online` 公开运营需先完成 AIGC 备案（见文末）。

代码已通过生产构建（`npm run build` ✅）并完成首个 git commit。下面是你需要自己点的步骤。

---

## 第 1 步：把代码推到 GitHub

1. 在 https://github.com/new 新建一个**私有**仓库，名字随意（如 `manxiang`），**不要**勾选 "Add README/.gitignore"
2. 回到终端，在 `web/` 目录执行（把 URL 换成你新建仓库的）：

```bash
cd /Users/zhezi/Desktop/projects/manxiang/web
git branch -M main
git remote add origin https://github.com/你的用户名/manxiang.git
git push -u origin main
```

> ⚠️ 推之前再确认一次：`.env.local`（含密钥）已被 `.gitignore` 忽略，不会上传。

---

## 第 2 步：Vercel 导入项目

1. 打开 https://vercel.com → 用 GitHub 登录
2. **Add New → Project** → 选刚才的 `manxiang` 仓库 → Import
3. **Root Directory**：如果你把整个 `manxiang` 推上去了，要设成 `web`；如果只推了 `web` 目录内容，保持默认 `./`
4. Framework 会自动识别为 **Next.js**，不用改

---

## 第 3 步：配环境变量（关键）

在 Vercel 项目的 **Settings → Environment Variables**，逐个添加（值从你本地 `web/.env.local` 复制）：

| 变量名 | 说明 |
|---|---|
| `DATABASE_URL` | Neon 连接串 |
| `DEEPSEEK_API_KEY` | DeepSeek 密钥 |
| `DEEPSEEK_MODEL` | `deepseek-chat` |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` |
| `SILICONFLOW_API_KEY` | 硅基流动密钥 |
| `SILICONFLOW_MODEL` | `baidu/ERNIE-Image-Turbo` |
| `SILICONFLOW_BASE_URL` | `https://api.siliconflow.cn/v1` |

> 全部选 **Production + Preview + Development** 三个环境都勾上。

---

## 第 4 步：部署

点 **Deploy**，等 1-3 分钟。成功后拿到 `https://manxiang-xxx.vercel.app`，打开就能用，发给朋友内测。

---

## 部署后自检清单

- [ ] 打开首页能看到种子卡片真图（说明静态资源 OK）
- [ ] 输入想法能生成第一话（说明 DeepSeek + DATABASE_URL OK）
- [ ] 分镜图能显示（说明 SiliconFlow + 图片转存 OK）
- [ ] 隔几分钟刷新，分镜图还在（说明图片持久化 OK）
- [ ] 设置页能改资料、显示额度（说明账号系统 OK）

---

## 关于绑定 manxiang.online（公开运营前）

⚠️ **国内域名对公众开放，AIGC 大模型备案是硬门槛**。流程（你来办）：

1. 域名先完成 **ICP 备案**（在域名注册商或云厂商办）
2. 办理 **生成式 AI（大模型）算法备案 / 服务上线备案**
3. 备案通过后，在 Vercel **Settings → Domains** 添加 `manxiang.online`，按提示去域名商配 DNS

> 在备案完成前，请只用 `xxx.vercel.app` 内测，不要把国内域名指向公开服务。

---

## 还没做、正式运营前要补的

| 项 | 说明 |
|---|---|
| 内容安全升级 | 当前只有关键词正则，正式上线建议接阿里云内容安全（文本+图像审核） |
| 真支付 | 当前升级/购买积分是演示，需接微信/支付宝 |
| 图片存储迁移 | 当前图片存 Neon 数据库（适合内测），规模大后迁对象存储（OSS/R2） |
| 人机验证 | 流量大或遇脚本攻击时，加腾讯云验证码（L4 防刷） |
