FROM node:10.15-slim

# Create app directory
RUN mkdir -p /app
WORKDIR /app
ADD . .


RUN npm install

ENV PORT=3001

EXPOSE 3001
CMD [ "npm", "start" ]
