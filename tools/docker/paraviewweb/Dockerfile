
# To build this image, first change into the directory where this Dockerfile
# lives, then:
#
# sudo docker build -t pvw-base-5.5.0 .
#
# To run the container and inspect it using the shell:
#
# sudo docker run --runtime=nvidia -P -ti pvw-base-5.5.0 bash
#

ARG BASE_IMAGE=kitware/paraviewweb:pv-5.5.0
FROM ${BASE_IMAGE}

RUN apt-get update && apt-get install -y --no-install-recommends \
        apache2-dev \
        apache2 \
        libapr1-dev \
        apache2-utils

RUN groupadd proxy-mapping && \
    useradd --system -g proxy-mapping -s /sbin/nologin pvw-user && \
    usermod -a -G proxy-mapping www-data && \
    mkdir -p /opt/wslink-launcher && \
    mkdir -p /opt/paraviewweb/scripts && \
    touch /opt/wslink-launcher/proxy-mapping.txt && \
    chown pvw-user:proxy-mapping /opt/wslink-launcher/proxy-mapping.txt && \
    chmod 660 /opt/wslink-launcher/proxy-mapping.txt && \
    mkdir -p /opt/wslink-launcher/log

# Copy the apache configuration file into place
COPY config/apache/001-pvw.conf /etc/apache2/sites-available/001-pvw.conf

# Copy the script into place
COPY scripts/start.sh /opt/paraviewweb/scripts/
COPY scripts/addEndpoints.sh /opt/paraviewweb/scripts/

# Configure the apache web server
RUN a2enmod vhost_alias && \
    a2enmod proxy && \
    a2enmod proxy_http && \
    a2enmod proxy_wstunnel && \
    a2enmod rewrite && \
    a2enmod headers && \
    a2dissite 000-default.conf && \
    a2ensite 001-pvw

# Open port 80 to the world outside the container
EXPOSE 80
