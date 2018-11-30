-- for non-prod env, this sql is automatically executed by docker
-- for prod, pls execute this sql manually

USE fabric_txmonitor;

-- ############################################################################
-- block event for specific fabric channel
-- ############################################################################
CREATE TABLE block_event (
  `id`               BIGINT UNSIGNED AUTO_INCREMENT NOT NULL   COMMENT 'primary key',

  `channel_id`       VARCHAR(100)                   NOT NULL   COMMENT 'channel id',
  `block_number`     BIGINT                         NOT NULL   COMMENT 'block number',
  `received_at`      DATETIME                       NOT NULL   COMMENT 'when the event is received from fabric',
  `published_at`     DATETIME                       NOT NULL   COMMENT 'when the event is published to queue',
  `detail`           TEXT                                      COMMENT 'detail',

  `created_at`       DATETIME                       NOT NULL   COMMENT 'when the row is created',
  `updated_at`       DATETIME                       NOT NULL   COMMENT 'when the row is updated',

  PRIMARY KEY (id)
) ENGINE=InnoDB, DEFAULT CHARACTER SET utf8mb4;

CREATE UNIQUE INDEX idx_block_event__channel_id__block_number ON block_event(channel_id, block_number);

-- DROP TABLE block_event;



-- ############################################################################
-- block height for specific fabric channel
-- ############################################################################
CREATE TABLE block_height (
  `id`               BIGINT UNSIGNED AUTO_INCREMENT NOT NULL   COMMENT 'primary key',

  `channel_id`       VARCHAR(100)                   NOT NULL   COMMENT 'channel id',
  `height`           BIGINT                         NOT NULL   COMMENT 'block height',

  `created_at`       DATETIME                       NOT NULL   COMMENT 'when the row is created',
  `updated_at`       DATETIME                       NOT NULL   COMMENT 'when the row is updated',

  PRIMARY KEY (id)
) ENGINE=InnoDB, DEFAULT CHARACTER SET utf8mb4;

CREATE UNIQUE INDEX idx_block_height__channel_id ON block_height(channel_id);

-- DROP TABLE block_height;
