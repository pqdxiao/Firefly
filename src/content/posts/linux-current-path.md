---
title: Linux 查看当前路径的几种方法
published: 2026-08-10
description: pwd、$PWD、ls、tree、which——五种查看当前工作目录的方法及各自的适用场景。
tags: [Linux, 命令行]
category: Linux
slug: linux-current-path
---

## 1. 使用 pwd 命令

pwd 是 Print Working Directory 的缩写，用于显示当前的工作目录，即当前所在的路径。这是最直接的方式。

## 2. 使用 echo 命令和 $PWD 变量

在 Linux 系统中，可以使用 `$PWD` 环境变量来获取当前工作目录，再用 echo 命令进行输出：

```sh
echo $PWD
```

## 3. 使用 ls 命令

ls 命令可以列出目录下的所有文件和目录信息，以及当前所在的目录：

```sh
ls -alF
```

## 4. 使用 tree 命令

tree 命令可以以树形结构显示当前目录内容，包括子目录及其文件（红帽系默认不带？）：

```sh
tree
```

执行该命令后，终端会以递归形式展示当前目录下的文件和子目录。

## 5. 使用 which 命令

which 命令用于显示给定命令的绝对路径：

```sh
which <command>
```

如果未指定命令，which 将返回所有可执行文件的路径。在这里，我们可以用 which 显示当前路径：

```sh
which pwd
```

执行后终端会输出 pwd 命令所在的绝对路径，通过进一步处理可以获得当前路径。
