# NearMe Pretest

## Project Creation

```bash
pnpm dlx create-nx-workspace@latest
# ✔ Where would you like to create your workspace? · near-me
# ✔ Which stack do you want to use? · node
# ✔ What framework should be used? · fastify
# ✔ Integrated monorepo, or standalone project? · integrated
# ✔ Application name · near-me
# ✔ Would you like to generate a Dockerfile? [https://docs.docker.com/] · Yes
# ✔ Enable distributed caching to make your CI faster · No
```

## Run Server

```bash
# Install and start Redis
brew install redis # on Mac
redis-server
# on another terminal
pnpm nx run near-me:serve:development
```

## Main Functionality

`apps/near-me/src/app/routes/closestMeetingLocation.ts`

## Test

`apps/near-me/src/app/app.spec.ts`

```bash
pnpm nx run near-me:test
```

## Documentation (not yet done)

`http://localhost:3000/documentation/static/index.html`
