# FormeFront DevOps

## Overview

This repository contains the Angular frontend for ForME.

- Application source: `src/`
- Docker image: `samiwin/forme-frontend:latest`
- Jenkins CI pipeline: `Jenkinsfile-frontend`
- Kubernetes CD is centralized in the `Formedevops` repository

## Local Development

Install dependencies:

```bash
npm install
```

Start the frontend locally:

```bash
npm start
```

The Angular development server runs on:

```text
http://localhost:4200
```

## Tests And Coverage

Run unit tests with coverage:

```bash
npm test -- --watch=false --code-coverage
```

Coverage output:

```text
coverage/forme-frontend/
```

## Production Build

Run the production build:

```bash
npm run build -- --configuration production
```

Build output:

```text
dist/forme-frontend/
```

## Docker

Build the frontend image:

```bash
docker build -t samiwin/forme-frontend:latest .
```

## Jenkins CI

`Jenkinsfile-frontend` performs:

- checkout
- dependency install with `npm ci` when available
- Angular tests with coverage
- production build
- optional SonarQube analysis
- Docker build and push

## CD Note

Kubernetes deployment, monitoring, and centralized CD remain in the `Formedevops` repository.

