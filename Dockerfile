FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY prisma/ prisma/

RUN npx prisma generate


COPY .env .env

ENV MYSQL_ROOT_PASSWORD="change-me"

COPY . .

EXPOSE 3306

CMD ["npm", "start"]
