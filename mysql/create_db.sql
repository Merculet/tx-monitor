-- NOTE: this SQL is for prod env only. For other env, please use docker

CREATE DATABASE fabric_txmonitor DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_general_ci;

USE fabric_txmonitor;

-- 添加用户server并授权，我们的服务器使用server这个用户账号存取数据库
GRANT SELECT ON fabric_txmonitor.* to txm@'localhost' IDENTIFIED by 'txmpwd';
GRANT INSERT ON fabric_txmonitor.* to txm@'localhost';
GRANT UPDATE ON fabric_txmonitor.* to txm@'localhost';
GRANT DELETE ON fabric_txmonitor.* to txm@'localhost';

-- GRANT ALL PRIVILEGES ON fabric_txmonitor.* TO txm@localhost IDENTIFIED BY 'txmpwd@20180426';
