'use strict';


module.exports = function (sequelize, DataTypes) {
    return sequelize.define('BlockHeight', {
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
        height: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            field: 'height',
            comment: 'block height'
        }
    }, {
            tableName: 'block_height',
            timestamps: true,
            underscored: true
        });
};
