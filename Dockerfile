FROM node:22.11.0-alpine AS build
WORKDIR /usr/src/app
COPY package.json  package-lock.json ./
RUN npm install -g @angular/cli
RUN npm install
COPY . .
RUN npm run build-prod

#STAGE 2
FROM nginx:1.17.1-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 3000
CMD [ "nginx", "-g", "daemon off;" ]