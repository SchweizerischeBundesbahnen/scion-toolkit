ARG NODE_VERSION=24-trixie
FROM node:${NODE_VERSION}

ARG OPENCODE_VERSION=latest

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ca-certificates curl git jq less openssh-client python3 ripgrep sudo unzip \
    && rm -rf /var/lib/apt/lists/* \
    && echo 'node ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

RUN npm install --global "@opencode/cli@${OPENCODE_VERSION}" \
    && npm cache clean --force

USER node
RUN mkdir -p /home/node/.config/opencode \
    /home/node/.local/share/opencode \
    /home/node/.local/state/opencode

WORKDIR /workspaces/scion-toolkit
