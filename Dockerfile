FROM node:18

WORKDIR /home/node/botservices

COPY . .

RUN npm install

RUN npm run build

EXPOSE 8000

CMD npm start
