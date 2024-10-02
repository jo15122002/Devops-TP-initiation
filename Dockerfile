FROM node:alpine
WORKDIR /app
EXPOSE 80
COPY . /app
RUN npm install
CMD node app/server.js