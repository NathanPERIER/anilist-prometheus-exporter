# AniList Prometheus Exporter

## Get the tokens

First, you need to [create an OAuth client](https://anilist.co/settings/developer) for the exporter. Use `https://anilist.co/api/v2/oauth/pin` as the redirect URL. Once this is done, you can get the client id and client secret in your developer page.

Then, you want to visit the following URL in a web browser (replace `YOUR_CLIENT_ID` by the value obtained previously) :

```
https://anilist.co/api/v2/oauth/authorize?response_type=code&redirect_uri=https%3A%2F%2Fanilist%2Eco%2Fapi%2Fv2%2Foauth%2Fpin&client_id=YOUR_CLIENT_ID
```

Click "Authorize" and copy the text that is provided to you. This is a token that will enable the exporter to access your account.

On the first time you run the exporter, you will need to set three environment values :
   - `ALPE_ANILIST_CLIENT_ID`, the id obtained from the developer page
   - `ALPE_ANILIST_CLIENT_SECRET`, the secret obtained from the developer page
   - `ALPE_ANILIST_AUTH_CODE`, the code obtained after authorizing the client to access your account

## Run with Docker (recommended)

First, we need a file to save the tokens :

```bash
touch tokens.json
chmod 600 tokens.json
```

Then, we need to build the container :

```bash
docker build . -t alpe
```

And finally we run the image :

```bash
docker run --name anilist_exporter \
    -p 8080:8080 \
    -e 'ALPE_ANILIST_CLIENT_ID=...' \
    -e 'ALPE_ANILIST_CLIENT_SECRET=...' \
    -e 'ALPE_ANILIST_AUTH_CODE=...' \
    -e 'ALPE_TOKENS_FILE=/etc/alpe/tokens.json' \
    -v './tokens.json:/etc/alpe/tokens.json' \
    alpe:latest 
```

## Run with NodeJS (dev)

> Note: so far, this has only be tested with node 18

First, we install the dependencies :

```bash
npm install
```

Then, we create the file for the tokens and we set the variables :

```bash
touch tokens.json
chmod 600 tokens.json
export ALPE_ANILIST_CLIENT_ID='...'
export ALPE_ANILIST_CLIENT_SECRET='...'
export ALPE_ANILIST_AUTH_CODE='...'
```

And then we can run :

```bash
npm run dev
```
