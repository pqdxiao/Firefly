---
title: Windows 小技巧
published: 2026-07-20
description: 修复 SVN 状态图标不显示的注册表方法，以及几个提升效率的 Windows / VS 快捷键。
tags: [Windows, SVN, 快捷键]
category: 工具
slug: windows-tips
---

## SVN 状态图标不显示的解决办法

TortoiseSVN 的状态图标依赖 Windows 的图标覆盖（Icon Overlay）机制，而这个机制的注册表项数量有限，被其他软件（如 OneDrive、Dropbox）占满后 SVN 图标就不显示了。

打开注册表编辑器（`regedit`），定位到：

```text
计算机\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\ShellIconOverlayIdentifiers\
```

Windows 按名称排序只取前若干个 Overlay 项，把 `Tortoise` 相关项改名（比如加几个空格或数字前缀），让它排到列表前面，重启资源管理器即可。

参考：[CSDN：SVN状态图标不显示的两种解决办法](https://blog.csdn.net/weixin_44541320/article/details/119418867)

## 快捷键

### 光标移动（通用）

- `Home` / `End`：跳到行首 / 行尾
- `Ctrl` + 左/右箭头：按词跳转
- 选中并快速跳一个词：`Ctrl`（词）+ `Shift`（选中）+ 右箭头/左箭头

### Visual Studio

- 复制当前行：`Ctrl + D`
