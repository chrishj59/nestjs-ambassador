FROM node:16.13.1

WORKDIR /app
COPY package.json .

RUN npm intsall
COPY . .

CMD npm run start:dev

