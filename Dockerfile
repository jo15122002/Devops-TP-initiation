FROM node:alpine
WORKDIR /app
COPY . /app
RUN npm install
CMD ["nodemon", "app/server.js"]