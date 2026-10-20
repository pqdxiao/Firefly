---
title: pip 修改国内源加速
published: 2026-08-03
description: 在国内用 pip 安装 Python 依赖包总是超时或下载太慢，把 pip 源改成国内镜像即可加速。介绍手动指定与修改配置文件两种方式。
tags: [pip, Python, 镜像源]
category: Python
slug: pip-mirror
licenseName: "CC BY-SA 4.0"
sourceLink: "https://blog.csdn.net/qq_56426046/article/details/126918381"
---

在国内，用 pip 安装 python 依赖包的时候，总是会遇到 Timeout 或者下载太慢的问题。这是因为 pip 源在国外，那么解决方法就是把 pip 源改成国内的，就可以实现 `pip install` 加速。

## 国内有哪些 pip 源？

国内有几个名气比较大的源：

- 清华大学：`https://pypi.tuna.tsinghua.edu.cn/simple/`
- 豆瓣：`http://pypi.douban.com/simple/`
- 阿里云：`http://mirrors.aliyun.com/pypi/simple/`
- 中国科技大学：`https://pypi.mirrors.ustc.edu.cn/simple/`

个人这几年使用下来，偏向于使用清华的源，比较稳定。

## 怎么加速？

修改 pip 源主要有两种方式：

1. 每次安装的时候，手动指定国内的 pip 源
2. 修改本地的 pip 配置文件，默认使用国内的 pip 源

### 方式一：手动指定 pip 源

以从清华的 pip 源下载 pandas 包为例：

```sh
pip install pandas -i https://pypi.tuna.tsinghua.edu.cn/simple
```

- 好处：不必修改本地的 pip 配置文件
- 坏处：每次都要在 `pip install` 后面添加老长一串代码

有些公司内部会维护自己的 pip 源，上面放了一些内部专用的依赖包，而员工电脑本地的 pip 配置文件一般已经指向公司内部 pip 源。有时候出于稳定性和速度的考虑，可能还是会用到这种安装方式。但绝大多数时候，还是建议修改本地的 pip 配置文件。

### 方式二：修改本地的 pip 配置文件

#### 配置文件在哪里？

对于不同操作系统，pip 配置文件的路径和名称不太相同，甚至同一类操作系统，也有可能因为版本不一样导致路径不一样，所以要根据自身情况寻找 pip 配置文件的有效路径。如果路径不存在，则需要自己先新建。

- Linux/Unix：`/etc/pip.conf`、`~/.config/pip/pip.conf`、`~/.pip/pip.conf`
- Mac：`~/.pip/pip.conf`、`~/Library/Application Support/pip/pip.conf`
- Windows：`%USERPROFILE%\pip\pip.ini`、`%APPDATA%\pip\pip.ini`、`%HOME%\pip\pip.ini`

虚拟环境：Unix 和 macOS 上为 `$VIRTUAL_ENV/pip.conf`，Windows 上为 `%VIRTUAL_ENV%\pip.ini`。

#### 配置文件的优先级

如果 pip 配置文件有很多个，则按照如下顺序读取配置：

1. 读取站点范围（site-wide）的配置，即全局配置
2. 读取每个用户目录的配置
3. 读取特定于虚拟环境的配置

也就是说，如果这些位置都有配置文件，则后面读取的值会覆盖前面读取的值。

#### 配置文件的内容

下面是我自己的配置：

```ini
[global]
timeout = 120
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
trusted-host = pypi.tuna.tsinghua.edu.cn

[search]
index = https://pypi.tuna.tsinghua.edu.cn/simple
```

简单解释一下里面的参数：

- `timeout`：超时时间为 120 秒，避免因为短暂的阻塞而导致下载失败。这个值设得太长也没意义，还不如尽早重试或换一个源
- `index-url`：清华源，`pip install` 时下载的地方
- `trusted-host`：添加清华源为可信主机，要不然可能报错

pip 官方教程：<https://pip.pypa.io/en/stable/user_guide/>

---

> 本文整理自 CSDN 博主「夜yesir」的原创文章《pip install 加速（修改为国内源）》，遵循 CC 4.0 BY-SA 版权协议。[原文链接](https://blog.csdn.net/qq_56426046/article/details/126918381)
