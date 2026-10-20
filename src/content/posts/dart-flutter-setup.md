---
title: Dart 入门与 Flutter Windows 环境搭建
published: 2026-09-14
description: 要开始使用 Flutter，你需要对 Dart 有所了解。本文包含 Dart 语言速览，以及国内网络环境下 Flutter SDK 的 Windows 安装配置记录。
tags: [Flutter, Dart, 环境配置]
category: Flutter
slug: dart-flutter-setup
---

要开始使用 Flutter，你需要对 Dart 编程语言有所了解，因为 Flutter 应用程序就是用 Dart 编写的。本文先对 Dart 做一个简要介绍，然后记录 Windows 下的 Flutter 环境搭建过程。

## Dart 简介

Flutter 应用程序是用 Dart 编写的。对于写过 Java、JavaScript 或其他类似 C 风格语言的人来说，这种语言应该很熟悉。安装 Flutter 时也会同时安装 Dart，因此无需单独安装。

下面是一个小型示例程序，它从 dart.dev 获取数据，解码返回的 JSON，并打印到控制台：

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class Package {
  final String name;
  final String latestVersion;
  final String? description;

  Package(this.name, this.latestVersion, {this.description});

  @override
  String toString() {
    return 'Package{name: $name, latestVersion: $latestVersion, description: $description}';
  }
}

void main() async {
  final httpPackageUrl = Uri.https('dart.dev', '/f/packages/http.json');
  final httpPackageResponse = await http.get(httpPackageUrl);
  if (httpPackageResponse.statusCode != 200) {
    print('Failed to retrieve the http package!');
    return;
  }
  final json = jsonDecode(httpPackageResponse.body);
  final package = Package(
    json['name'],
    json['latestVersion'],
    description: json['description'],
  );
  print(package);
}
```

这个程序分为两部分：`Package` 类的声明，以及包含业务逻辑的 `main` 函数。

- **类型安全**：Dart 使用静态类型检查来确保变量的值始终与静态类型相匹配。由于类型推断的存在，显式类型标注通常是可选的——`final variableName = ...` 这样的代码依然是类型安全的。
- **健全的空安全**：`description` 成员的类型是 `String?`，`?` 表示该属性可以为 null；其余两个成员则不能为 null，否则程序无法编译。
- **构造函数**：该构造函数接受两个必需的位置参数和一个可选的命名参数。

所有 Dart 程序（包括 Flutter 应用）都从 `main` 函数开始。Flutter 应用的主入口点在 `lib/main.dart`：

```dart
void main() {
  runApp(const MyApp());
}
```

关于初始化的几个要点：

- 在调用 `runApp()` 之前，可以执行任何"快速"的初始化（少于一两帧的时间），但此时 widget 树还未创建。较长时间的初始化（如从磁盘或网络加载数据）要以不阻塞主 UI 线程的方式进行。
- 每个 stateful widget 都有 `initState()` 方法，在 widget 加入 widget 树时调用，其第一行**必须**是 `super.initState()`。
- 热重载**不会**再次调用 `initState` 或 `main`，热重启会调用这两者。

## Windows 环境搭建

官网文档：<https://docs.flutter.cn/get-started/install/windows/web>

### SDK 下载与配置

国内推荐直接从 Flutter 官方镜像下载：

<https://storage.flutter-io.cn/flutter_infra_release/releases/stable/windows/flutter_windows_3.27.3-stable.zip>

> 请注意，不要将 Flutter 安装到以下情况的目录或路径中：
>
> - 路径包含特殊字符或空格
> - 路径需要较高的权限（例如 `C:\Program Files`）

这里解压到 `C:\flutter\sdk`，然后把 `C:\flutter\sdk\bin` 添加到 `Path` 环境变量，最后运行 `flutter doctor` 检查环境。

### 在中国网络环境下使用 Flutter

参考[官方文档](https://docs.flutter.cn/community/china)，在 PowerShell 中设置两个镜像环境变量：

```powershell
$env:PUB_HOSTED_URL="https://pub.flutter-io.cn"
$env:FLUTTER_STORAGE_BASE_URL="https://storage.flutter-io.cn"
```

### Chrome 依赖

如果 `flutter doctor` 报告找不到 Chrome（Web 开发需要）：

```text
[X] Chrome - develop for the web (Cannot find Chrome executable at .\Google\Chrome\Application\chrome.exe)
    ! Cannot find Chrome. Try setting CHROME_EXECUTABLE to a Chrome executable.
```

指定一个 Chrome 可执行文件即可：

```powershell
$env:CHROME_EXECUTABLE="D:/RunningCheeseChrome/App/chrome.exe"
```

### 在 VS Code 中创建项目

装好 Flutter 插件后即可在 VS Code 中创建并调试项目。
