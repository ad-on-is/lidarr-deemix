FROM python:alpine

WORKDIR /app
RUN apk add --no-cache nodejs npm curl rust cargo build-base openssl-dev bsd-compat-headers bash
COPY python/requirements.txt ./python/requirements.txt
RUN python -m pip install -r python/requirements.txt
RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm i
COPY . .
EXPOSE 8080
CMD ["/app/run.sh"]
