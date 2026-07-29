# GitHub 提交操作手册

> 本手册教你把这个 Portfolio 项目从本地提交到 GitHub，为 Vercel 部署做准备。
> 项目已有 git 仓库和提交历史，你只需要：创建 GitHub 仓库 → 关联远程 → 推送。

---

## 当前项目状态（已检查）

| 项 | 状态 |
|---|---|
| git 已初始化 | ✅（分支：master） |
| git 用户已配置 | ✅（kexiongpeng / 1443546343@qq.com） |
| 已有提交历史 | ✅（5+ 次提交） |
| GitHub 远程仓库 | ❌ 还没配置（本手册来完成） |
| .gitignore 已完善 | ✅（node_modules、.env、Word临时文件等已排除） |

---

## 第一步：在 GitHub 上创建空仓库

1. 打开 https://github.com/new （需先登录 GitHub）
2. 填写仓库信息：
   - **Repository name**：`portfolio`（或你喜欢的名字）
   - **Description**：`个人作品集全栈应用`
   - **Visibility**：选 **Private**（私有，推荐）或 **Public**（公开）
     > ⚠️ 如果选 Public，确认 `.env` 不会被上传（已被 .gitignore 排除，放心）
   - **不要勾选** "Add a README file"
   - **不要勾选** "Add .gitignore"
   - **不要勾选** "Choose a license"
   > 以上三项**都不要勾**，因为你本地已经有这些文件了，勾了会产生冲突
3. 点击 **Create repository**

4. 创建后，GitHub 会显示一个页面，找到类似这样的地址（SSH 或 HTTPS）：
   ```
   https://github.com/你的用户名/portfolio.git  // https://github.com/KeXiongpeng/portfolio
   ```
   > **记下这个地址**，下一步要用。

---

## 第二步：关联本地项目到 GitHub

打开 **PowerShell**，进入项目根目录：

```powershell
cd C:\Users\sun\Desktop\学习产出
```

### 2.1 添加远程仓库

把下面的地址换成你自己的（第一步记下的那个）：

```powershell
git remote add origin https://github.com/你的用户名/portfolio.git
```

验证是否添加成功：

```powershell
git remote -v
```

应该看到两行输出（fetch 和 push），说明关联成功。

### 2.2 （如果报错"remote origin already exists"）

说明之前配过远程，先删再加：

```powershell
git remote remove origin
git remote add origin https://github.com/你的用户名/portfolio.git
```

---

## 第三步：提交本地改动

你的项目有未提交的修改（这两天改的代码）。先看看改了哪些：

```powershell
git status
```

### 3.1 暂存所有改动

```powershell
git add -A
```

> `-A` 表示把所有修改、新增、删除的文件都加进去。
> 不用担心 `.env` 和 `node_modules`，它们已被 .gitignore 排除。

### 3.2 确认暂存内容（检查一下没有敏感文件）

```powershell
git status
```

确认列表里：
- ✅ **没有** `.env` 文件
- ✅ **没有** `node_modules` 文件夹
- ✅ **没有** `~$xxx.docx` 临时文件

### 3.3 提交

```powershell
git commit -m "feat: 头像上传、博客Markdown编辑器、Vercel部署适配"
```

---

## 第四步：推送到 GitHub

### 4.1 首次推送

```powershell
git push -u origin master
```

> `-u origin master`：推送到 origin 远程的 master 分支，并建立追踪关系。
> 以后推送只需要 `git push` 即可。

### 4.2 如果提示认证

GitHub 已不支持密码认证，需要用以下方式之一：

**方式 A：Personal Access Token（推荐，最简单）**

1. 打开 https://github.com/settings/tokens?type=beta → **Generate new token**
2. 设置：
   - Token name：`portfolio-deploy`
   - Expiration：选 90 天或更长
   - Repository access：选 **Only select repositories** → 选 `portfolio`
   - Permissions → Repository permissions → **Contents**: Read and write
3. 点击 **Generate token**
4. **复制 token**（只显示一次！）
5. 回到 PowerShell，重新执行 `git push -u origin master`
6. 弹出登录框时：
   - Username：你的 GitHub 用户名
   - Password：**粘贴刚才的 token**（不是 GitHub 密码）

> Windows 会自动记住凭据，以后 push 不用再输入。

**方式 B：GitHub CLI**

```powershell
# 安装 GitHub CLI（如果没装）
winget install GitHub.cli

# 登录（浏览器授权）
gh auth login

# 重新推送
git push -u origin master
```

### 4.3 推送成功后

打开你的 GitHub 仓库页面 `https://github.com/你的用户名/portfolio`，应该能看到所有代码文件。

---

## 第五步：验证

| 检查项 | 方法 |
|--------|------|
| 代码已上传 | GitHub 仓库页面能看到 `web/`、`server/` 等文件夹 |
| 敏感文件未上传 | 仓库里搜不到 `.env` 文件 |
| package.json 在 | 能看到 `web/package.json` 和 `server/package.json` |

---

## 后续更新（日常使用）

以后每次改完代码，只需要三条命令：

```powershell
cd C:\Users\sun\Desktop\学习产出

# 1. 暂存改动
git add -A

# 2. 提交（写一句话说明改了什么）
git commit -m "fix: 修复了xxx问题"

# 3. 推送
git push
```

推送后 Vercel 会**自动检测到更新并重新部署**（在 Vercel 项目配置好之后）。

---

## 常见问题

### Q1：push 报错 "rejected - non-fast-forward"

远程有本地没有的提交（比如你在 GitHub 网页上改过文件）。先拉取再推送：

```powershell
git pull origin master --allow-unrelated-histories
git push -u origin master
```

### Q2：push 报错 "fatal: unable to access"

网络问题，检查是否需要代理：

```powershell
# 如果用了代理，设置 git 代理（端口换成你的代理端口）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### Q3：提交了不该提交的文件

如果误传了 `.env` 或大文件，从 git 中移除（不会删除本地文件）：

```powershell
git rm --cached 文件名
git commit -m "remove sensitive file"
git push
```

> 注意：Git 历史中仍然保留该文件。如果是 `.env` 等敏感文件泄露，建议**修改密码/密钥**，仅 rm 不够。

### Q4：中文文件名显示为乱码

```powershell
git config --global core.quotepath false
```

---

## 操作完成后的下一步

推送成功后，回到 [Vercel部署指南.md](./Vercel部署指南.md) 第三部分：
- 在 Vercel 网页 Import 这个 GitHub 仓库
- 配置 Root Directory 为 `server`（后端）和 `web`（前端）
- 配置环境变量
- 部署
