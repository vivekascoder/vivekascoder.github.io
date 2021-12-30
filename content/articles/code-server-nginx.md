---
title: "Setting up Code Server with Nginx reverse proxy."
description: "This article will demostrate how you can use/set code-server with nginx reverse proxy and sertificates, so that you can access is with https://code.example.com"
author: "vivekascoder"
tags:
  - Bash
  - Linux
  - DevOps
---

# Setting up Code Server with Nginx reverse proxy.

The beginning part was already covered by me from my article and youtube video you can find the link below for them.

Additional Code Server Settings: [Here](https://blog.divcorn.com/blog/additional-code-server-settings)

Code Server Video: [Here](https://www.youtube.com/watch?v=YEuZPNza5Dg)

You can subscribe me to get more knowledge about Full Stack and DevOps.

## What is reverse proxy ?

Reverse proxy stands for proxying the requests from a domain to another domain or port. For example, you're running a development nodejs server on port 8000, and you want to access this **Development** server using a domain let's say **nodejs.devserver.com**, so at that stage you can use nginx to listen for the requests from the domain **nodejs.devserver.com**. And this is exactly what Reverse proxy does.

## How to use reverse proxy with nginx ?

Here is an example for setting up reverse proxy with nginx.

```js
server {
	listen 80;
	server_name xyz.example.com;

	# Reverse Proxy.
	location / {
	    proxy_pass http://localhost:8000/;
	}
}
```

**Explaination**: This config will listen for the requests from the domain xyz.example.com, and forwards these requests to localhost:8000.

### Nginx Config for code-server.

```js
server {
	listen 443 ssl http2;
	server_name code.example.com;

	# For SSL
	ssl_certificate /etc/letsencrypt/live/code.example.com/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/code.example.com/privkey.pem;

	# Reverse Proxy.
	location / {
	    proxy_pass http://localhost:8000/;
      # Some required Headers.
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection upgrade;
      proxy_set_header Accept-Encoding gzip;
	}
}

```

## Steps to setup

1. Create nginx config.

```bash
sudo vim /etc/nginx/sites-available/reverseproxy
```

> NOTE: You can place anything at `reverseproxy`.

2. Paste the above content.
3. Save the file.
4. Create symlink to activate the config.

```bash
sudo ln -s /etc/nginx/sites-available/reverseproxy  /etc/nginx/sites-enabled/reverseproxy
```

5. Then you can create ssl certificate for your domain.

- Install CertBot

```bash
sudo apt install python3-certbot
```

- Stop the nginx server

```bash
sudo systemctl stop nginx.service
```

- Create the certificate.

```bash
sudo certbot certonly --standalone --preferred-challenges http-01 -d code.example.com
```

- Restart the nginx server.

```bash
sudo systemctl restart nginx.service
```

6. You're all set up, now you can visit code server instance with your fav. domain.

## The browser occupies a lot of space

Yeah, it does you can use the brave browser and install this application as PWA.

> NOTE: You will not be able to do it, if you have'nt created SSL certificate. because PWA is only for https websites.

You can install as a PWA by clicking on this button.

![PWA button](assets/rev-proxy/pwa.png)

### How does it look ?

![Code Server](assets/rev-proxy/cs.png)
