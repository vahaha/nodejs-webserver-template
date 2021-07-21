# Omni Channel
Provide method to chat on multi channels

## Installation
### install packages
```
npm install
// yarn install
```
### install swagger-cli to build docs
```
npm install -g swagger-cli 
// yarn global add swagger-cli 
```
### generate docs (swagger)
```
npm run generate-docs
// yarn generate-docs
```
## Configuration
For each environment, make a copy file default.env and change the name to:
- development.env for develop on local
- staging.env for testing environment
- production.env for production environment

Update configurations on the new environment file.
## Running
```
// local
npm run dev
// yarn dev

// staging
npm run staging
// yarn staging

// production
npm start
// yarn start

```
