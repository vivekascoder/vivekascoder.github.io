---
title: "Create and Use an Remote Databse with Django."
author: "vivekascoder"
date: "2020-7-6"
tags:
  - Bash
  - Linux
  - Database
---

# Create and Use an Remote Databse with Django.

## Connecting to remote server.

- Connect using `ssh username@server_ip`
  ![SSH](assets/remote-db/1.png)
- After Connecting you'll see something like this.
  ![SSH](assets/remote-db/2.png)

## Install PostgreSQL Databse

```bash
sudo apt install postgresql postgresql-contrib
```

![SSH](assets/remote-db/3.png)

## Check the status of postgresql service.

- You can check the status of postgresql service using.

```bash
sudo systemctl status postgresql
```

![SSH](assets/remote-db/4.png)

> ⚠️ If you don't know how to create a virtual machine, you
> can watch my videos on development using cloud computers on
> youtube with [Development Using Clout Computers](https://www.youtube.com/watch?v=mVZfD1PPdM0&list=PLNbhERfMxgvFVUfwNZfV_ss8jB7-7Kc9c)

## Setting Up remote PostgreSQL Database.

- Open the `pg_hba.conf` file using the following command.

```bash
vim /etc/postgresql/12/main/pg_hba.conf
```

- Append the following lines.

```
host    all             all              0.0.0.0/0                       md5
host    all             all              ::/0                            md5
```

![SSH](assets/remote-db/5.png)

```bash
vim /etc/postgresql/12/main/postgresql.conf
```

- Change the `listen_address` to \*

```
listen_addresses = '*'
```

![SSH](assets/remote-db/6.png)

### Creating the Databse and User

- Open PostgreSQl with the following command.

```bash
sudo -u postgres psql
```

- Create the Databse and User:

```bash
CREATE DATABASE myproject;
```

```bash
CREATE USER myprojectuser WITH PASSWORD 'password';
```

- **Django Specific Settings:**

```bash
ALTER ROLE myprojectuser SET client_encoding TO 'utf8';
```

```bash
ALTER ROLE myprojectuser SET default_transaction_isolation TO 'read committed';
```

```bash
ALTER ROLE myprojectuser SET timezone TO 'UTC';
```

- Grant the created user to modify the created database.

```bash
GRANT ALL PRIVILEGES ON DATABASE myproject TO myprojectuser;
```

- Exit out of postgresql.

```bash
\q
```

## Connecting with django application

- You can change your databse settings in `settings.py`

```python
# For PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        # Name of the database.
        'NAME': 'myproject',
        # Hostname/DomainName/IP of the server.
        'HOST': 'server_ip_here',
        # User That you've created
        'USER': 'myprojectuser',
        'PORT': '5432',
        # Password that you've created for the user.
        'PASSWORD': 'password'
    }
}
```

- Then install the `psycopg2-binary` package with `pip`

```bash
pip install psycopg2-binary
```

- Now you can use the remote databse.
