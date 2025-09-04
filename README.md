<div align="center">

<a href="https://t.me/vpnsibcom_bot" target='_blank'>
    <img src="logo.png" width='150' />
</a>

# VPNsibcom_web

#### **Repository**: This repository contains the source code of the VPNsib.com. Contains: Web App, Telegram-mini-app(TMA), Subscription page, Public website.

#### **Description**: VPNsibcom is an open source VPN service. It is based on [Xray-core](https://github.com/XTLS/Xray-core/) with [Marzban](https://github.com/Gozargah/Marzban).

![Title](https://img.shields.io/badge/Project%20Repositories%3A-blue?style=for-the-badge&color=005386)
[![REPO](https://img.shields.io/github/stars/Kennix88/vpnsibcom_web?style=for-the-badge&color=0891b2&labelColor=1c1917&logo=github&label=vpnsibcom_web)](https://github.com/Kennix88/vpnsibcom_web)
[![REPO](https://img.shields.io/github/stars/Kennix88/vpnsibcom_api?style=for-the-badge&color=0891b2&labelColor=1c1917&logo=github&label=vpnsibcom_api)](https://github.com/Kennix88/vpnsibcom_api)

[![Telegram Solyanka Community](https://img.shields.io/endpoint?label=Solyanka%20community&style=for-the-badge&color=0891b2&labelColor=1c1917&url=https%3A%2F%2Ftg.sumanjay.workers.dev%2Fsolycmty)](https://t.me/solycmty)
![Title](https://img.shields.io/badge/Repository%3A-blue?style=for-the-badge&color=3C5280)
[![release](https://img.shields.io/github/package-json/v/Kennix88/vpnsibcom_web?style=for-the-badge&color=0891b2&labelColor=1c1917)](https://github.com/Kennix88/vpnsibcom_web/releases)
[![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]
![GitHub Repo stars](https://img.shields.io/github/stars/Kennix88/vpnsibcom_web?style=for-the-badge&color=0891b2&labelColor=1c1917)
[![wakatime](https://wakatime.com/badge/user/9268c051-c861-45cc-b927-3babf56c56d9/project/e80cee38-d89a-40d0-934f-eb63d44eb27c.svg?style=for-the-badge&color=0891b2&logoColor=1c1917)](https://github.com/Kennix88/vpnsibcom_web)
![Title](https://img.shields.io/badge/VPNsibcom%3A-blue?style=for-the-badge&color=3C5280)
[![VPN Telegram Bot](https://img.shields.io/badge/VPN_service-blue?style=for-the-badge&color=0891b2&labelColor=1c1917&logo=telegram&label=Bot)](https://t.me/vpnsibcom_bot)
[![VPN Telegram Channel](https://img.shields.io/endpoint?style=for-the-badge&color=0891b2&labelColor=1c1917&url=https%3A%2F%2Ftg.sumanjay.workers.dev%2Fvpnsibcom&label=Community)](https://t.me/vpnsibcom)
[![VPN Telegram chat](https://img.shields.io/endpoint?label=Chat&style=for-the-badge&color=0891b2&labelColor=1c1917&url=https%3A%2F%2Ftg.sumanjay.workers.dev%2Fvpnsibcom_chat)](https://t.me/vpnsibcom_chat)
![Title](https://img.shields.io/badge/Me%3A-blue?style=for-the-badge&color=3C5280)
[![Github followers](https://img.shields.io/github/followers/Kennix88?logo=github&style=for-the-badge&color=0891b2&labelColor=1c1917)](https://www.github.com/Kennix88)
[![Telegram Channel](https://img.shields.io/endpoint?style=for-the-badge&color=0891b2&labelColor=1c1917&url=https%3A%2F%2Ftg.sumanjay.workers.dev%2Fkennixdev&label=Channel)](https://t.me/KennixDev)
[![Telegram Group](https://img.shields.io/endpoint?label=Group&style=for-the-badge&color=0891b2&labelColor=1c1917&url=https%3A%2F%2Ftg.sumanjay.workers.dev%2FKennixDevGroup)](https://t.me/KennixDevGroup)

</div>

## 📈 Project Statistics

### ⭐ Stargazers:

[![Stargazers repo roster for @Kennix88/vpnsibcom_api](https://reporoster.com/stars/dark/Kennix88/vpnsibcom_web)](https://github.com/Kennix88/vpnsibcom_web/stargazers)

### ⭐ Star History

<a href="https://www.star-history.com/#kennix88/vpnsibcom_api&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=kennix88/vpnsibcom_web&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=kennix88/vpnsibcom_web&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=kennix88/vpnsibcom_web&type=Date" />
 </picture>
</a>

### 🍴 Forkers:

[![Forkers repo roster for @Kennix88/vpnsibcom_web](https://reporoster.com/forks/dark/Kennix88/vpnsibcom_web)](https://github.com/Kennix88/vpnsibcom_web/network/members)

## 🐳 Docker для продакшена

Проект настроен для запуска в Docker-контейнере в продакшен-окружении.

### Предварительные требования

- Docker
- Docker Compose

### Настройка переменных окружения

1. Скопируйте файл `.env.example` в `.env.production`:

   ```bash
   cp .env.example .env.production
   ```

2. Отредактируйте `.env.production`, установив необходимые значения переменных.

### Запуск в продакшене

#### Использование скрипта деплоя

```bash
# Сделайте скрипт исполняемым
chmod +x scripts/deploy.sh

# Запустите скрипт деплоя
./scripts/deploy.sh
```

#### Ручной запуск

```bash
# Сборка Docker-образа
docker-compose build

# Запуск контейнера
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### Проверка работоспособности

После запуска приложение будет доступно по адресу: http://localhost:3000

Эндпоинт проверки здоровья: http://localhost:3000/api/health

## 🤝 Contributing

We welcome any contributions to VPNsibcom! If you want to help:

1. Fork the repository
2. Create a branch for your changes
3. Make and test your changes
4. Create a Pull Request

<div align="center">
Thanks to the all contributors who have helped improve VPNsibcom:

---

<a href="https://github.com/kennix88/vpnsibcom_web/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=kennix88/vpnsibcom_web" />
</a>

Made with <a rel="noopener noreferrer" target="_blank" href="https://contrib.rocks">contrib.rocks</a>

---

</div>

## © License

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

This repository is available under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](cc-by-nc-sa). Commercial use is prohibited!

## 💵 Sponsorship

If you want to support me, I will be very happy about it. 🥺👉👈

- TON or Jettons or TON NFT or TG-Names:

```
UQAjDnbTYmkesnuG0DZv-PeMo3lY-B-K6mfArUBEEdAb4xaJ
```

- USDT (TON):

```
UQAx6-hmc4Rivjtg9ynmMxMY8-DUHvQ4oEYAmTexrDSvJL9C
```

- USDT (TRC20):

```
TLE1PXm5WR3MzDH5TXueVqRciMENHv289w
```

- USDT (SOL):

```
EN8uqaN6EVL8SmqvjU8VjyV7RSequNHY2NgH3poekLpd
```

- USDT (ERC20):

```
0xBEE3bC268B49308B7dddCA791233d763a0D85B8F
```

- BTC:

```
1Ai9bL7862KQrcHymkakgaEAsDL5M3uNyX
```

- ETH:

```
0xBEE3bC268B49308B7dddCA791233d763a0D85B8F
```

- XAUT (TON):

```
UQAx6-hmc4Rivjtg9ynmMxMY8-DUHvQ4oEYAmTexrDSvJL9C
```

- XAUT (ERC20):

```
0xBEE3bC268B49308B7dddCA791233d763a0D85B8F
```

- Telegram Wallet: [@kennix88](https://t.me/Kennix88)
- Donation Alerts: [—> GO <—](https://www.donationalerts.com/r/kennixdev)

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/©%20License-CC%20BY--NC--SA%204.0-lightgrey.svg?style=for-the-badge&color=0891b2&labelColor=1c1917

---

<div align="center">

Created by [Kennix88](https://github.com/Kennix88)

</div>
