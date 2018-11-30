'use strict';


module.exports = function (sequelize, DataTypes) {
    return sequelize.define('BlockEvent', {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            field: 'id',
            comment: 'primary key'
        },
        channelId: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'channel_id',
            comment: 'channel id'
        },
        blockNumber: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            field: 'block_number',
            comment: 'block number'
        },
        receivedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'received_at',
            comment: 'when the event is received from fabric'
        },
        publishedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'published_at',
            comment: 'when the event is published to queue'
        },
        detail: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'detail',
            comment: 'detail'
        }
    }, {
            tableName: 'block_event',
            timestamps: true,
            underscored: true
        });
};
