FROM node:8.9.0

LABEL maintainer="yiting.qiang@magicwindow.cn"

WORKDIR /usr/src/app

RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    mkdir -p /usr/src/app & mkdir /data/npm/backup/ -p

#RUN npm config set registry https://registry.npm.taobao.org
RUN npm install pm2 -g

COPY package.json ./
RUN npm cache clean --force & npm install

COPY .babelrc .eslintignore .eslintrc.js .istanbul.yml ./
COPY ./config/* ./config/
COPY ./pm2/* ./pm2/

EXPOSE 8000

VOLUME /root/.composer
VOLUME /usr/src/app/config
VOLUME /usr/src/app/logs

COPY src ./src
# COPY test ./test
# COPY tool ./tool

ENV NODE_ENV=prod

#CMD pm2 start pm2/${NODE_ENV}.json --no-daemon

CMD pm2 start pm2/${NODE_ENV}.json

