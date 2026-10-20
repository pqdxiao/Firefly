---
title: 使用 Tailscale 异地组网实现公网远程桌面
published: 2026-08-31
description: 大部分电脑都处于局域网内，公网无法直接访问。借助基于 WireGuard 的 Tailscale 组建虚拟局域网，可以在 anywhere 安全地用 RDP 远程桌面连回自己的电脑。
tags: [Tailscale, RDP, 内网穿透]
category: 网络
slug: tailscale-rdp
---

## 背景

RDP（Remote Desktop Protocol，远程桌面协议）是一个多通道协议，让客户端连上提供微软终端服务的电脑（服务端）。大部分 Windows 都自带客户端软件，Linux、FreeBSD、macOS 也有对应的客户端。服务端方面，则监听送到 TCP 3389 端口的数据。

理论上，如果你有个固定的公网 IP，那么局域网内那套远程桌面的办法也能直接用在公网上。但绝大部分人电脑上的 IP 都是局域网地址，在公网上无法使用，所以必须：

- 做地址转换/端口映射，或者
- 在两个相互独立的局域网间建一个虚拟网络，用虚拟网络的地址互联互通（内网穿透）

Tailscale 提供的是后一种方案。

## Tailscale

Tailscale 是一款基于 WireGuard 技术的虚拟组网工具，能把安装了 Tailscale 的机器都放到同一个局域网。在安全性上，它是去中心化、点对点连接加密的组网工具，而且开放了源代码；如果愿意，甚至可以自己架设一个服务端（如 Headscale），无须担心泄密问题。

下载地址：[Tailscale](https://tailscale.com/)

## 一个常见的坑：登录凭据

远程桌面连接时，很多人习惯性输入微软账户和微软密码，结果连接失败：

- ❌ 微软账户 + 微软密码
- ✅ 电脑本机账户（如 `Administrator`）+ 在"设置"中给该账户设置的密码

RDP 验证的是本机账户凭据，而不是微软在线账户。

## 参考文献

1. [Tailscale：让你可以随时随地用 NAS 和家里的电脑](https://sspai.com/post/66822)
2. [比 ZeroTier 更好的内网穿透方案——Tailscale | LonelyGod](https://hin.cool/posts/tailscale.html)
3. [使用 Tailscale 远程访问局域网 - 知乎](https://zhuanlan.zhihu.com/p/467997929)
