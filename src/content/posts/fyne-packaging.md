---
title: Fyne 应用打包指南
published: 2026-10-05
description: 编译打包 Fyne 框架编写的桌面端与移动端应用：go build 参数、garble 混淆、UPX 压缩，以及 Android SDK/NDK 环境配置。
tags: [Go, Fyne, 打包]
category: Go
slug: fyne-packaging
---

## 桌面端

### Windows

编译打包 Fyne 框架编写的桌面端应用，我更喜欢直接使用 `go build` 而不是 `fyne package` 命令，因为 Fyne 自带的打包命令编译出的应用体积会大一倍。所以我一般会使用以下命令：

```sh
go build -ldflags "-s -w -H windowsgui" -o test.exe .
```

`-ldflags "参数"` 表示将引号里面的参数传给编译器：

- `-s`：去掉符号信息
- `-w`：去掉 DWARF 调试信息，不能使用 gdb 调试
- `-H windowsgui`：以 windows gui 形式打包，不带 DOS 窗口

如果有需要，也可以使用 [garble](https://github.com/burrowers/garble) 工具对程序代码进行混淆，增加被逆向的难度：

```sh
garble -literals build -ldflags "-s -w -H windowsgui" -o test.exe .
```

接着使用 Resource Hacker 工具加上应用图标和版权信息。

最后使用 [UPX](https://upx.github.io/) 工具进一步对应用进行压缩加壳，应用体积基本上还能再缩小一半：

```sh
upx --best test.exe
```

> 注意：UPX 加壳后某些安全软件会报毒（点名深信服）。

### Linux

Linux 平台与 Windows 同理。Go 语言可以直接在 Windows 环境下交叉编译 Linux 的可执行文件，只需要设置 Go 语言环境变量：

```sh
go env -w CGO_ENABLED=0
go env -w GOOS=linux
go env -w GOARCH=amd64
go build -ldflags "-s -w" -o test .
```

不过，我在 Windows 上没有测试成功，最后只能在 Linux 虚拟机完成编译打包。

同样也可以使用 garble 和 UPX 工具，对代码进行混淆和压缩：

```sh
garble -literals build -ldflags "-s -w" -o test .
upx --best test
```

### Mac

Mac 端同样可以在 Windows 上交叉编译，但是我没有进行测试：

```sh
go env -w CGO_ENABLED=0
go env -w GOOS=darwin
go env -w GOARCH=amd64
go build -ldflags "-s -w" -o test .
```

## 移动端

### Android

移动端的打包对于我来说比较麻烦一些，需要配置 Android SDK 和 NDK 的环境：

1. 在 AndroidDevTools 中下载 SDK Tools 的 `installer_r24.4.1-windows.exe`，并将 `……\Android\android-sdk\tools\bin` 文件夹添加进环境变量 `PATH` 中。
2. 在 Android Developers 中下载 NDK 的 `android-ndk-r27c-windows.zip`，添加环境变量，变量名为 `ANDROID_NDK_HOME`，变量值为 `……\Android\android-ndk-r27c-windows\android-ndk-r27c`。
3. 通过 Fyne 框架打包命令，将程序打包成 APK 文件。打包出的 APK 文件体积要比桌面端大得多：

```sh
fyne package -os android -appID com.github.test -icon icon.png
```

### iOS

理论支持，未测试。
