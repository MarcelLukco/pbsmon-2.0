FROM debian:bookworm-slim

WORKDIR /app

# Install build tools and runtime dependencies
RUN apt-get update && \
    apt-get install -y gcc krb5-user wget gnupg2 cron ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy pbscaller source
COPY ./pbscaller.c ./pbscaller.c

# TODO - in the future mount it
COPY krb5.conf /etc/krb5.conf

RUN wget http://repo.grid.cesnet.cz/key.asc

RUN apt-key add key.asc

RUN printf "deb https://repo.metacentrum.cz/ all main pilot\ndeb https://repo.metacentrum.cz/ bookworm main pilot\n" > /etc/apt/sources.list.d/meta_repo.list

RUN apt-get update && apt-get install -y libopenpbs libopenpbs-dev

RUN gcc -g -L/usr/lib pbscaller.c -o /app/pbscollector -lpbs

# Copy collection script
COPY collect-pbs-data.sh /app/collect-pbs-data.sh
RUN chmod +x /app/collect-pbs-data.sh

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create log directory
RUN mkdir -p /var/log/pbs-collector

# The pbscaller binary will be mounted from host at runtime
# PBS libraries will also be mounted from host

# Set up cron to run every minute
# We'll set up the cron job in the entrypoint script to ensure environment variables are available
RUN touch /var/log/pbs-collector/collect.log

# Entrypoint script will start cron in foreground
ENTRYPOINT ["/app/entrypoint.sh"]

