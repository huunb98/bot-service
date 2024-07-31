FROM node:18

WORKDIR /home/node/botservices

COPY . .

RUN yarn && yarn build

EXPOSE 8000

# CMD npm start
