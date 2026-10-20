---
title: 用 Cobra 构建 Go 命令行工具
published: 2026-10-12
description: Cobra 是现代化的 Go CLI 交互框架（kubectl、docker 等都在用）。从安装到生成子命令，一步步构建你的第一个命令行应用。
tags: [Go, Cobra, CLI]
category: Go
slug: cobra-cli
---

[Cobra](https://github.com/spf13/cobra) 是一个用于现代 Go 命令行交互的框架（A Commander for modern Go CLI interactions），kubectl、docker、hugo 等知名工具都基于它构建。下面以官方的 "My First CLI" 教程为例，走一遍构建 CLI 应用的完整流程。

## 前置要求

- 了解 Go 编程语言的基础知识
- 系统中已安装 Go

## 步骤

### 1. 安装 Cobra

首先，为项目初始化一个新的 Go module：

```sh
mkdir my-cli
cd my-cli
go mod init my-cli
```

然后安装 Cobra 库：

```sh
go get -u github.com/spf13/cobra@latest
```

### 2. 初始化项目

安装 Cobra CLI 生成器：

```sh
go install github.com/spf13/cobra-cli@latest
```

初始化 Cobra 项目：

```sh
cobra-cli init
```

执行后提示 `Your Cobra application is ready at /path/to/my-cli`，项目骨架就生成好了。

### 3. 添加子命令

给 CLI 添加一个新命令：

```sh
cobra-cli add serve
```

输出 `serve created at /path/to/my-cli`，生成器会自动在 `cmd/` 目录下创建 `serve.go`。

### 4. 运行 CLI

构建并测试 CLI 应用：

```sh
go build -o my-cli
./my-cli
```

会输出自动生成的帮助信息：

```text
A longer description that spans multiple lines and likely contains
examples and usage of using your command. For example:

Cobra is a CLI library for Go that empowers applications.
This application is a tool to generate the needed files
to quickly create a Cobra application.
```

测试新的 serve 命令：

```sh
./my-cli serve
# serve called
```

## 小结

到这里，一个可以工作的 CLI 应用就完成了。Cobra 还提供了 flag 绑定、配置文件、自动补全等能力，值得继续深入。
