module.exports = function (knex, Promise) {

    var when = require('when');
    var crypto = require('crypto');
    var TABLES = require( '../constants/tables' );
    var CONSTANTS = require('../constants/constants');

    function create() {
        Promise.all([

            createTable(TABLES.USERS,
                function (row) {
                    row.increments().primary();
                    row.string('email').unique().notNullable();
                    row.string('notification_email').unique();
                    row.string('first_phone_number').unique();
                    row.string('second_phone_number').unique();
                    row.string('password').notNullable();
                    row.string('project');
                    row.string('confirmation_token');
                    row.string('forgot_token');
                    row.integer('role').notNullable().default(0); //0 - user; 1 - superAdmin
                    row.timestamps();
                },
                function (err) {
                    if (!err) {
                        createDefaultAdmin();
                    }
                }),

            createTable(TABLES.KEYS,
                function (row) {
                    row.increments().primary();
                    row.string('key').unique();
                    row.integer('user_id').index();
                    row.string('project');
                    row.timestamps();
                }),

            createTable(TABLES.VIDEOS,
                function (row) {
                    row.increments().primary();
                    row.integer('key_id').index();
                    row.string('project');
                    row.dateTime('datetime', true).notNullable();
                    row.string('uuid').notNullable();
                    row.decimal('longitude', 9, 6).notNullable();
                    row.decimal('latitude', 9, 6).notNullable();
                    row.string('ext', 5).notNullable();
                    row.timestamps();
                })
        ]);
    }

    function createTable(tableName, crateFieldsFunc, callback) {
        knex.schema.hasTable(tableName).then(function (exists) {
            if (!exists) {
                return knex.schema.createTable(tableName, crateFieldsFunc)
                    .then(function () {
                        console.log(tableName + ' Table is Created!');
                        if (callback && typeof callback == 'function') {
                            callback();
                        }
                    })
                    .otherwise(function (err) {
                        console.log(tableName + ' Table Error: ' + err);
                        if (callback && typeof callback == 'function') {
                            callback(err);
                        }
                    })
            }
        });
    }

    function createDefaultAdmin() {
        var shaSum = crypto.createHash('sha256');
        shaSum.update('123456'); //default pass
        var encryptedPass = shaSum.digest('hex');

        knex('users')
            .insert({
                email: 'confirmation.WhatAboutNo@gmail.com',
                notification_email: 'confirmation.WhatAboutNo@gmail.com',
                first_phone_number: '+1000000001',
                second_phone_number: '+100000002',
                password: encryptedPass,
                role: 1,
                project: CONSTANTS.PROJECT_NAME
            })
            .then(function () {
                console.log('superAdmin is Created!');
            })
            .otherwise(function (err) {
                console.log('superAdmin Creation Error: ' + err)
            })
    }

    function drop() {
        return when.all([
            knex.schema.dropTableIfExists('users'),
            knex.schema.dropTableIfExists('keys'),
            knex.schema.dropTableIfExists('videos')
        ]);
    }

    return {
        create: create,
        drop: drop
    }
}