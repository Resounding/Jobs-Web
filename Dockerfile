FROM node:6.3.1

ENV JSPM_GITHUB_AUTH_TOKEN e399abeb40ec0a26cfeb9e88f538baa639e65c05
RUN npm install -g \
    typescript@beta \
    jspm@0.16.15 \
    gulp \
    typings

RUN jspm config registries.github.remote https://github.jspm.io
RUN jspm config registries.github.auth e399abeb40ec0a26cfeb9e88f538baa639e65c05
RUN jspm config registries.github.maxRepoSize 0
RUN jspm config registries.github.handler jspm-github

ARG APP_RELEASE=v0.0.0

RUN git clone https://e399abeb40ec0a26cfeb9e88f538baa639e65c05@github.com/Resounding/Jobs-Web /usr/src/Jobs-Web

WORKDIR /usr/src/Jobs-Web
RUN git checkout $APP_RELEASE

RUN npm install
RUN jspm install
RUN typings install

RUN gulp export