# Cline VS Code 插件打包指南

## 环境要求

- Node.js（当前使用 v24.12.0）
- npm
- Git（提供 `bash`，proto lint 脚本需要）
- Windows 环境

## 可能遇到的问题及解决方案

| # | 问题 | 原因 | 解决 |
|---|------|------|------|
| 1 | `Cannot find package 'chalk'` | 未安装依赖 | 先 `npm install` |
| 2 | `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | SSL 证书验证失败（网络代理/防火墙） | 改用 `--ignore-scripts` 跳过 |
| 3 | `protoc not found` | `--ignore-scripts` 导致 grpc-tools 未下载 protoc 二进制 | 单独 `npm rebuild grpc-tools` |
| 4 | `'bash' 不是内部或外部命令` | proto lint 脚本需要 bash，Windows CMD 没有自带 | 通过 Git 安装的 bash 在 PATH 中可解决 |

## 完整打包命令（从头到尾）

```bash
# 1. 安装主项目依赖（跳过脚本避免 SSL 问题）
npm install --ignore-scripts

# 2. 单独 rebuild grpc-tools 获取 protoc.exe
npm rebuild grpc-tools

# 3. 安装 webview-ui 依赖
cd webview-ui
npm install --ignore-scripts
cd ..

# 4. 安装 CLI 依赖
cd cli
npm install --ignore-scripts
cd ..

# 5. 一键打包为 .vsix（包含编译、类型检查、lint、打包全部流程）
npx vsce package
```

最终产物：**`claude-dev-3.76.0.vsix`**

## 安装到 VS Code

```bash
code --install-extension claude-dev-3.76.0.vsix
```

或在 VS Code 中 `Ctrl+Shift+P` → `Extensions: Install from VSIX...` 选择该文件。
