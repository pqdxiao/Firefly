---
title: Go 开发杂记
published: 2026-09-21
description: 三个 Go 开发小笔记：用 Yaegi 把 Go 当脚本语言嵌入宿主程序、用 go-ole 调用 Windows COM 接口，以及同包不同文件间全局变量的初始化。
tags: [Go, 速记]
category: Go
slug: go-notes
---

记录几个 Go 开发中零碎但有用的点。

## Yaegi：把 Go 作为脚本语言嵌入项目

Go 开发初期，我用配置文件描述转发规则，但随着规则的增多，发现由于建模不当，规则文件越发冗长繁琐；受限于领域知识的匮乏，难以设计一个简单灵活的 DSL，因此决定改用脚本语言描述转发规则。

尝试了 Go 生态中的 Lua、JS、Python 等方案，但考虑到开发体验和团队成员的技术背景，对于长期维护来说有些不好接受。恰巧发现了 [Yaegi](https://github.com/traefik/yaegi) 这个项目（Traefik 出品），它可以将 Go 语言作为脚本语言嵌入到其他 Go 项目中，并且能较为简单地调用宿主程序的代码，IDE 体验良好，不需要团队成员学习新的语言。

参考：[使用 Yaegi 在 Go 语言项目中嵌入 Go 作为脚本 - DCjanus 的博客](https://blog.dcjanus.com/posts/usage-of-yaegi/)

## go-ole：调用 Windows COM 接口

[go-ole](https://github.com/go-ole/go-ole) 提供了 Windows COM 的 Go 绑定（Go bindings for Windows COM using shared libraries instead of cgo）。

Golang 调用 Windows 底层接口时，可以借助这个第三方库。如果对 Golang 熟悉的话，不妨看看 go-ole 的源码——从源码文件可以发现，它是通过标准库 `syscall` 调用 Windows 底层 dll 实现的，没有用到 cgo。

## 同一个包中，别的文件如何使用全局变量

同一个包下的多个文件天然共享包级变量，但要注意变量的初始化时机——`func init()` 会在 `main` 之前自动执行，把初始化逻辑放在这里即可：

```go
package main

var GlobalECRClassID int64
var GlobalECNClassID int64

func init() {
	GlobalECRClassID = 6001
	GlobalECNClassID = 6002
}
```

同一个包里的其他 `.go` 文件可以直接使用 `GlobalECRClassID` 等变量，无需任何导入。
