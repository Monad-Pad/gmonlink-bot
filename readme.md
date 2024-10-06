# gmon.link
![gmon.link introduction banner](https://github.com/Monad-Pad/gmon.link/blob/main/public/assets/gmon-introduction.png)
A linktree/linkinbio alternative that is powered by Telegram. This is the Telegram bot that powers gmon.link, written in Typescript & powered by grammY, and Supabase.

## Help build gmon.link
gmon.link is a community-run project initially started by the team behind Monad Pad. If you have any suggestions, ideas, or want to help build and show your skills to the Monad ecosystem, please open an issue or a pull request 💜

Submit a PR to the [gmon.link](https://github.com/Monad-Pad/gmon.link) repository.

# Setting it up locally
To setup the back-end (bot) of gmon.link locally to for example; help contribute to the platform or play around with it. You need to follow the following steps:

## 1. Create a new Telegram bot
- Open Telegram, search for @BotFather and open the chat
- Send the `/newbot` command and follow the instructions
- Note the token, you will need to add it to the `.env` file

## 2. Setting up the Database
Follow the instructions [here](https://github.com/Monad-Pad/gmon.link?tab=readme-ov-file#1-setting-up-the-database) to setup the database.

## 3. Setting up the Bot
Now that you've setup the database, you can start setting up the bot.

Let's start by forking the repository, click `Fork` in the top right corner. A pop-up will appear, you can leave the default options there and just click `Create fork`. After a few seconds, you should be redirected to your own copy of the repository.

Open the forked repository in your favourite IDE, we recommend using [VSCode](https://code.visualstudio.com/) or [Cursor](https://cursor.com/).

### 3.1. Install dependencies
To install the dependencies, run the following command:
```bash
npm install
```

### 3.2. Setup environment variables
Open the `.env.example` file and clone the values to a new file called `.env`.

You will see the following environment variables:
```bash
BOT_TOKEN=
SUPABASE_URL=
SUPABASE_KEY=
JWT_SECRET=
BOT_MODE=
```

- `BOT_TOKEN`: The token of the bot you created in step 1.
- `SUPABASE_URL`: The URL of the Supabase project you created in step 2.
- `SUPABASE_KEY`: The service role key of the Supabase project you created in step 2.
- `JWT_SECRET`: A secret key used to sign the JWT tokens, also from Supabase.
- `BOT_MODE`: The mode of the bot, can be `DEVELOPMENT` or `PRODUCTION`.

### 3.3. Change the database schema
The production version of gmon.link is using a different schema than the local version, this is because the production version is hosted by Monad Pad and we are using a different Supabase project for it.

To change the schema to public (default), you need to go to `/lib/clients/supabase.ts` and change the `schema` variable to `public`.

### 3.4. Start the bot
To start the bot, run the following command:
```bash
nodemon bot.ts
```

You can also run the bot with `ts-node` if you don't want to use `nodemon`.
```bash
ts-node bot.ts
```

You can now open Telegram and search for your bot, you can also send it messages to see if it works.

# Made by Monad Pad
![Monad Pad Banner](https://github.com/Monad-Pad/gmon.link/raw/main/public/assets/monadpad-image.png)
This micro tool is made by [Monad Pad](https://www.monadpad.xyz) - the leading launchpad on Monad.

This is not affiliated with Monad in any way.