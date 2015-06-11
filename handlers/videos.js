var Videos = function (PostGre) {
    "use strict";
    var TABLES = require('../constants/tables');
    var CONSTANTS = require('../constants/constants');
    var VideoModel = PostGre.Models[TABLES.VIDEOS];
    var badRequests = require('../helpers/badRequests')();

    this.saveVideos = function (videos, keyId, callback) {
        var saveData;

        var arr = videos.split('_');

        if (arr.length < 5) {
            if (callback && ( typeof callback === 'function' )) {
                return callback(errors)
            }
        }

        saveData = {
            key_id: keyId,
            datetime: arr[0],
            uuid: arr[1],
            longitude: arr[2],
            latitude: arr[3],
            ext: arr[4],
            project: CONSTANTS.PROJECT_NAME
        };

        VideoModel
            .insert(saveData)
            .then(function (savedVideo) {
                if (callback && ( typeof callback === 'function' )) {
                    callback(null, savedVideo)
                }
            })
            .otherwise(function (err) {
                if (callback && ( typeof callback === 'function')) {
                    return callback(err)
                }
            });
    };

    this.getVideosByEmail = function (req, res, next) {
        var email = req.param('email');
        var start = req.param('start');
        var end = req.param('end');

        var endDate;
        var startString;
        var endString;
        var sql;
        var err;

        if (!email || !start || !end) {
            err = badRequests.notEnParams();
            //logWriter.log( destination + ".getVideosByEmail()", "Not enough incoming parameters" );
            return next(err);
        }

        endDate = new Date(end); // add 1 day to endDate;
        endDate.setDate(endDate.getDate() + 1);

        startString = new Date(start).toISOString();
        endString = endDate.toISOString();

        sql = "SELECT "
        + "  keys.key, "
        + "  CONCAT ( "
        + "     TO_CHAR( videos.datetime, 'YYYY-MM-DD HH24:MI:SS' ), '_', "
        + "     videos.uuid, '_', "
        + "     longitude, '_', "
        + "     latitude, '_', "
        + "     ext "
        + "  ) AS name, "
        + "  videos.created_at "
        + "FROM users "
        + "  INNER JOIN keys ON users.id=keys.user_id "
        + "  INNER JOIN videos ON videos.key_id=keys.id "
        + "WHERE users.email='" + email + "' "
        + " AND users.project='" + CONSTANTS.PROJECT_NAME + "' "
        + "  AND datetime BETWEEN '" + startString + "' AND '" + endString + "' "
        + "ORDER BY videos.datetime";

        PostGre.knex
            .raw(sql)
            .then(function (queryResult) {
                var result = ( queryResult && queryResult.rows ) ? queryResult.rows : [];
                res.status(200).send(result);
            })
            .otherwise(next);
    }
};

module.exports = Videos;