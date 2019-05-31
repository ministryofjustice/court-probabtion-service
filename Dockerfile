FROM node:10.15-slim

RUN addgroup --gid 2000 --system appgroup && \
    adduser --uid 2000 --system appuser --gid 2000

# Create app directory
RUN mkdir -p /app
WORKDIR /app
ADD . .


RUN npm install

RUN chown -R appuser:appgroup /app


ENV PORT=3001

EXPOSE 3001

USER 2000

CMD [ "npm", "start" ]
