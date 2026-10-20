---
title: Wails：用 Go + Web 技术构建桌面应用
published: 2026-09-28
description: Wails 借助系统 WebView 与前端技术构建桌面端应用，后端用 Go 编写。安装依赖、创建项目与编译构建的快速上手记录。
tags: [Go, Wails, 桌面开发]
category: Go
slug: wails-getting-started
---

## 简介

[Wails](https://wails.io/) 提供了一种使用 Go 和 Web 技术编写桌面应用的方式：把 Go 后端与前端界面绑定成一个单一的二进制文件，界面由系统原生 WebView 渲染（不像 Electron 那样打包一个 Chromium），体积小得多。

## 支持的平台

| 平台 | 要求 |
| --- | --- |
| Windows | 10/11 AMD64/ARM64 |
| MacOS | 10.13+ AMD64 / 11.0+ ARM64 |
| Linux | AMD64/ARM64 |

## 依赖

Wails 有许多安装前需要的常见依赖项：

- Go 1.20+

    ```sh
    go version
    ```

- NPM (Node 15+)

    ```sh
    npm --version
    node -v
    ```

### 可选依赖

- [UPX](https://upx.github.io/)：用于压缩应用
- [NSIS](https://wails.io/docs/guides/windows-installer/)：用于生成 Windows 安装程序

## 安装 Wails

运行以下命令安装 Wails CLI：

```sh
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

## 验证安装

```sh
wails doctor
```

该命令会检查各依赖是否就绪，缺什么补什么。

## 创建项目

```sh
wails init
```

使用 JavaScript 生成一个 Vanilla 项目：

```sh
wails init -n myproject -t vanilla
```

如果更愿意使用 TypeScript：

```sh
wails init -n myproject -t vanilla-ts
```

### 项目结构

```text
.
├── build/
│   ├── appicon.png
│   ├── darwin/
│   └── windows/
├── frontend/
├── go.mod
├── go.sum
├── main.go
└── wails.json
```

- `main.go`：应用入口，在这里把 Go 方法绑定给前端
- `frontend/`：前端项目，随便用什么框架都行
- `build/`：应用图标、各平台构建资源

## 开发运行

```sh
wails dev
```

以开发模式运行，支持热重载，可以在浏览器里调试前端。

## 编译构建

```sh
wails build
```

编译项目，并将可用于生产的二进制文件保存在 `build/bin` 目录中。
