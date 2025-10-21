FROM node:20-bullseye

ARG MAGICMIRROR_REPO=https://github.com/MichMich/MagicMirror.git
ARG MAGICMIRROR_BRANCH=master

ENV MAGICMIRROR_DIR=/opt/magic_mirror
WORKDIR /opt

RUN apt-get update \
  && apt-get install -y --no-install-recommends git python3 build-essential \
  && git clone --depth 1 --branch "$MAGICMIRROR_BRANCH" "$MAGICMIRROR_REPO" "$MAGICMIRROR_DIR" \
  && cd "$MAGICMIRROR_DIR" \
  && npm install --unsafe-perm --omit=dev \
  && npm cache clean --force \
  && apt-get purge -y --auto-remove git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR $MAGICMIRROR_DIR

COPY --chown=node:node config ./config

EXPOSE 8080

USER node

CMD ["npm", "run", "server"]
