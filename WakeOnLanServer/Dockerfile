FROM node:16

LABEL com.centurylinklabs.watchtower.enable="false"

# Create app directory
WORKDIR /app
RUN dpkg-reconfigure -f noninteractive git
RUN git clone https://github.com/OfirValla/WakeOnLan.git
WORKDIR /app/WakeOnLan
RUN git pull

# Install app dependencies
WORKDIR /app/WakeOnLan/WakeOnLanServer
RUN npm ci --only=production

CMD [ "node", "app.js" ]