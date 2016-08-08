FROM node:6.3.1

RUN npm install -g \
    typescript@beta \
    gulp \
    typings \
    aurelia-cli

ARG APP_RELEASE=v0.0.0
ARG GITHUB_KEY=xyz

RUN git clone https://$GITHUB_KEY@github.com/Resounding/Jobs-Web-Au /usr/src/Jobs-Web

WORKDIR /usr/src/Jobs-Web
RUN git checkout $APP_RELEASE

RUN npm install --ignore-scripts
RUN typings install

RUN au build --env prod
