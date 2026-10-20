---
title: 使用 Caddy 搭建静态网站
published: 2026-08-24
description: 与 Nginx 相比，语法简洁和自动申请 TLS 证书是 Caddy 的两大优势。本文简述使用 Caddy 搭建静态网站的步骤。
tags: [Caddy, Linux, 静态网站]
category: 建站
slug: caddy-static-site
---

## 前言

与 Nginx 相比，语法简洁和自动申请 TLS 证书是 Caddy 的两大优势。使用 Caddy 建站对入门者来说更为容易。

本文简述使用 Caddy 搭建静态网站的步骤。

## 安装

对于 Ubuntu 和 Debian 系统，只需几条命令即可安装：

```sh
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

对于其他操作系统，请翻阅 [Caddy 官方文档](https://caddyserver.com/docs/install)，这里不再赘述。

## 配置

首先，将需要用到的域名解析到服务器 IP。

然后删除 `/etc/caddy/Caddyfile` 中原有内容。也可使用以下命令一键清空：

```sh
echo '' > /etc/caddy/Caddyfile
```

编辑 `/etc/caddy/Caddyfile`，按照模板进行配置：

```nginx
www.example.com {                  # 域名
        root * /usr/share/caddy    # 网站根目录
        file_server                # 启用静态文件服务器
        tls i@example.com          # 用于生成 TLS 证书的邮箱
        encode gzip                # 启用 Gzip 压缩
}
```

保存配置文件，然后重载 Caddy 配置文件：

```sh
sudo systemctl reload caddy
```

设置开机自启（可选）：

```sh
sudo systemctl enable caddy
```

## 多站点

如果需要在同一台服务器上搭建多个静态网站，只需将其他网站的配置附在 `Caddyfile` 之后即可。例如：

```nginx
www.example.com {
        root * /usr/share/caddy/www
        file_server
        tls i@example.com
        encode gzip
}
blog.example.com {
        root * /usr/share/caddy/blog
        file_server
        tls i@example.com
        encode gzip
}
web.example.com {
        root * /usr/share/caddy/web
        file_server
        tls i@example.com
        encode gzip
}
```

修改完记得重载 Caddy 配置文件。
