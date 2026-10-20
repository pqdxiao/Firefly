---
title: Beancount 复式记账入门
published: 2026-08-17
description: 用纯文本管理个人账目——一个带注释的 Beancount 示例，展示账户开启、期初资产初始化与日常收支记录。
tags: [Beancount, 记账, 效率]
category: 工具
slug: beancount-intro
---

Beancount 是一款使用纯文本进行复式记账的工具，账本就是一个 `.beancount` 文件，可以用任意编辑器编辑、用 Git 管理。下面是一个带注释的最小示例，展示了从开户、初始化资产到记录第一笔支出的完整流程：

```beancount
; 指定账单使用的货币单位
option "operating_currency" "CNY"

; 开启账户：日期指开启时间，之后关于这个账户的资金变动时间不能早于该日期，
; 否则 beancount 会报错。CNY 指货币单位（元）。

; 工商银行
2020-04-16 open Assets:ICBC1234 CNY
; 现金
2020-04-16 open Assets:Cash CNY
; 股票
2020-04-16 open Assets:Stock CNY
; 花呗
2020-04-16 open Liabilities:Huabei CNY
; 可乐消费
2020-04-16 open Expenses:Cola CNY

; 这个账户一般用于初始账户的收支平衡
2020-04-16 open Equity:Opening-Balances CNY

; 初始化已有资产和负债
; 先用 Equity:Opening-Balances 平衡没有数据来源的 Assets:ICBC1234 账户，并且设为 10000 元
2020-04-16 pad Assets:ICBC1234 Equity:Opening-Balances
2020-04-17 balance Assets:ICBC1234     10000.00 CNY

; 同样的方式初始化其他账户
2020-04-16 pad Assets:Cash Equity:Opening-Balances
2020-04-17 balance Assets:Cash          2000.00 CNY
2020-04-16 pad Assets:Stock Equity:Opening-Balances
2020-04-17 balance Assets:Stock         5000.00 CNY

; 债务一般用负数表示
2020-04-16 pad Liabilities:Huabei Equity:Opening-Balances
2020-04-17 balance Liabilities:Huabei  -1200.00 CNY

; 然后从 2020-04-17 开始记录自己的收入和支出
; 下班用现金买罐可乐
2020-04-17 * "买罐可乐"
  Assets:Cash                             -3.00 CNY
  Expenses:Cola                            3.00 CNY
```

几个要点：

- **复式记账**：每一笔交易的借贷两侧金额必须相等，账本天然自洽，不容易记错账。
- **账户命名**：`Assets`（资产）、`Liabilities`（负债）、`Expenses`（支出）、`Income`（收入）、`Equity`（权益）五大类，用冒号分层。
- **`pad` + `balance`**：`pad` 指令用余额账户自动补齐历史差额，`balance` 指令断言某天账户余额，二者配合完成期初初始化。
