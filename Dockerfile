# syntax=docker/dockerfile:1
FROM node:16-alpine
# FROM --platform=linux/amd64 yourbaseimage
RUN apk add --no-cache python3 g++ make

COPY . .

RUN yarn install --production
CMD ["node", "app.js"]
EXPOSE 5010

# FROM node:12-alpine
# RUN apk add --no-cache python3 g++ make

# COPY . .
# RUN yarn install --production
# CMD ["node", "app.js"]
# EXPOSE 5010

