FROM node:6.9.1

RUN npm install -g yarn

RUN yarn global add \
    typescript \
    gulp \
    typings \
    aurelia-cli

ARG APP_RELEASE=v0.0.0
ARG GITHUB_KEY=xyz

RUN git clone https://$GITHUB_KEY@github.com/Resounding/Jobs-Web /usr/src/Jobs-Web

WORKDIR /usr/src/Jobs-Web
RUN git checkout $APP_RELEASE

RUN yarn install --ignore-scripts
RUN typings install

RUN mkdir -p /usr/src/Jobs-Web/export
RUN au build --env prod
