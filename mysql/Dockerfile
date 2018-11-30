FROM mysql:5.7.22

LABEL maintainer="yiting.qiang@magicwindow.cn"

COPY ./mysql_project.cnf /etc/mysql/conf.d
ADD ./create_table.sql /docker-entrypoint-initdb.d

ENV MYSQL_ROOT_PASSWORD rootpwd
ENV MYSQL_DATABASE fabric_txmonitor
ENV MYSQL_USER txm
ENV MYSQL_PASSWORD txmpwd

EXPOSE 3306

RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone
