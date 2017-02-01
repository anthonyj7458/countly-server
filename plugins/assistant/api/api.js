'use strict';
const plugin = {},
    common = require('../../../api/utils/common.js'),
    countlyCommon = require('../../../api/lib/countly.common.js'),
    plugins = require('../../pluginManager.js'),
    log = common.log('assistant:api'),
    fetch = require('../../../api/parts/data/fetch.js'),
    async = require("async"),
    assistant = require("./assistant.js");

(function (plugin) {
    plugins.register("/master", function (ob) {
        // Allow configs to load & scanner to find all jobs classes
        setTimeout(() => {
            require('../../../api/parts/jobs').job('assistant:generate').replace().schedule("every " + assistant.JOB_SCHEDULE_INTERVAL + " minutes starting on the 0 min");
        }, 3000);
    });

    plugins.register("/o/assistant", function (ob) {
        const params = ob.params;
        const paths = ob.paths;

        if (!params.qstring.api_key) {
            common.returnMessage(params, 400, 'Missing parameter "api_key"');
            return false;
        }

        const api_key = params.qstring.api_key;

        log.i('Assistant plugin request: Get All Notifications');
        const validate = ob.validateUserForMgmtReadAPI;
        validate(function (params) {
            log.i('Assistant plugin request: Get All Notifications ' + 1);
            const member = params.member;

            assistant.getNotificationsForUser(common.db, member, api_key, function (err, results) {
                log.i('Assistant plugin request: Get All Notifications ' + 10);
                common.returnOutput(params, results);
            });
            log.i('Assistant plugin request: Get All Notifications ' + 3);

        }, params);
        return true;
    });

    plugins.register("/i/assistant", function (ob) {
        const params = ob.params;
        const paths = ob.paths;

        if (typeof params.qstring.api_key === "undefined") {
            common.returnMessage(params, 400, 'Missing parameter "api_key"');
            return false;
        }

        if (typeof params.qstring.save === "undefined") {
            common.returnMessage(params, 400, 'Missing parameter "save"');
            return false;
        }

        if (typeof params.qstring.notif === "undefined") {
            common.returnMessage(params, 400, 'Missing parameter "notif"');
            return false;
        }

        log.i('Assistant plugin request: /i/assistant');
        const validate = ob.validateUserForMgmtReadAPI;
        validate(function (params) {

            const member = params.member;
            const api_key = params.qstring.api_key;
            let save_action;
            const notif = params.qstring.notif;
            const save_val = params.qstring.save;

            if (save_val === "true") save_action = true;//save
            else if (save_val === "false") save_action = false;//unsave

            log.i('Assistant plugin request: 1, ' + paths[3]);
            switch (paths[3]) {
                case 'global':
                    log.i('Assistant plugin request: Change global notification status');
                    assistant.changeNotificationSavedStatus(false, save_action, notif, api_key, common.db);
                    common.returnOutput(params, "the global action was done " + save_action);
                    break;
                case 'private':
                    log.i('Assistant plugin request: Change personal notification status');
                    assistant.changeNotificationSavedStatus(true, save_action, notif, api_key, common.db);
                    common.returnOutput(params, "the private action was done " + save_action);
                    break;
                default:
                    common.returnMessage(params, 400, 'Invalid path');
                    return false;
                    break;
            }

            log.i('Assistant plugin request: 3');
        }, params);
        log.i('Assistant plugin request: 4');
        return true;
    });

    plugins.register("/i/assistant_generate_all", function (ob) {
        const params = ob.params;

        if (typeof params.qstring.api_key === "undefined") {
            common.returnMessage(params, 400, 'Missing parameter "api_key"');
            return false;
        }
        log.i('Assistant plugin request: /i/assistant_generate_all');

        const callback = function () {
            log.i('Assistant plugin request: /i/assistant_generate_all finished');
        };

        assistant.generateNotifications(common.db, callback, true, true);

        common.returnOutput(params, "assistant_generate_all was ! completed");
        return true;
    });

    plugins.register("/i/assistant_generate_all_job", function (ob) {
        const params = ob.params;

        if (typeof params.qstring.api_key === "undefined") {
            common.returnMessage(params, 400, 'Missing parameter "api_key"');
            return false;
        }
        log.i('Assistant plugin request: /i/assistant_generate_all_job');

        const callback = function () {
            log.i('Assistant plugin request: /i/assistant_generate_all_job finished');
        };

        require('../../../api/parts/jobs').job('assistant:generate').in(3);


        common.returnOutput(params, "assistant_generate_all_job was ! completed");
        return true;
    });

    //for debugging
    var db_name_notifs = "assistant_notifs";
    var db_name_config = "assistant_config";

    plugins.register("/i/asistdelete", function (ob) {
        var params = ob.params;

        if (typeof params.qstring.api_key === "undefined") {
            common.returnMessage(params, 400, 'Missing parameter "api_key"');
            return false;
        }
        log.i('Assistant plugin request: /i/asistdelete');

        common.db.collection(db_name_notifs).drop();
        common.db.collection(db_name_config).drop();

        common.returnOutput(params, "Delete was ! completed");
        return true;
    });

    plugins.register("/i/assmagic", function (ob) {
        var params = ob.params;

        if (typeof params.qstring.api_key === "undefined") {
            common.returnMessage(params, 400, 'Missing parameter "api_key"');
            return false;
        }
        //http://kadikis.count.ly/o/analytics/metric?api_key=7c0ee53440a1d3ab7b2052fc078c6b9f&app_id=57cd5afb85e945640bc4eec9&metric=sources&period=30days
        //const hours_24 = 1000*60*60*24;
        //const nowTime = 1485547643000;

        //params.qstring.period = "hour";// JSON.stringify([nowTime - hours_24,nowTime]);
        params.qstring.period = "7days";
        params.qstring.method = "views";
        params.app_id = "57cd5afb85e945640bc4eec9";
        const zeQueryMetric = "views";

        countlyCommon.setPeriod(params.qstring.period);
        fetch.getTimeObjForEvents("app_viewdata"+params.app_id, params, function(doc){
            //doc.meta.views.length;//cik daudz periodi trackoti

            var clearMetricObject = function (obj) {
                if (obj) {
                    if (!obj["u"]) obj["u"] = 0;
                    if (!obj["t"]) obj["t"] = 0;
                    if (!obj["s"]) obj["s"] = 0;
                    if (!obj["e"]) obj["e"] = 0;
                    if (!obj["b"]) obj["b"] = 0;
                    if (!obj["d"]) obj["d"] = 0;
                    if (!obj["n"]) obj["n"] = 0;
                }
                else {
                    obj = {"u":0, "t":0, "s":0, "e":0, "b":0, "d":0, "n":0};
                }

                return obj;
            };

            var data = countlyCommon.extractMetric(doc, doc['meta'][zeQueryMetric], clearMetricObject, [
                {
                    name:zeQueryMetric,
                    func:function (rangeArr, dataObj) {
                        return rangeArr;
                    }
                },
                { "name":"u" },//total users
                { "name":"t" },//total visits
                { "name":"s" },//landings (page entries)
                { "name":"e" },//exits (page exits)
                { "name":"b" },//bounce
                { "name":"d" },//duration spent seconds
                { "name":"n" } //new users
            ]);

            log.i('Assistant plugin YAAY data');
        });

        /*
        params.qstring.metric = "sources";
        params.app_id = "57cd5afb85e945640bc4eec9";
        params.appTimezone = params.appTimezone;

        fetch.getMetric(params, "sources", null, function(data){
            common.returnMessage(params, 200, "I've got the source! " + JSON.stringify(data));
        });*/

        return true;
    });


    plugins.register("/i/rsstest", function (ob) {
        const params = ob.params;

        if (typeof params.qstring.api_key === "undefined") {
            common.returnMessage(params, 400, 'Missing parameter "api_key"');
            return false;
        }
        log.i('Assistant plugin request: /i/rsstest');

        var parser = require('rss-parser');
        var nowdate = Date.now();
        var interMs = assistant.JOB_SCHEDULE_INTERVAL * 60 * 1000 * 1000;

        //https://medium.com/feed/countly
        //https://github.com/countly/countly-sdk-ios/tags.atom
        //https://github.com/countly/countly-sdk-android/tags.atom

        parser.parseURL('https://github.com/countly/countly-sdk-android/tags.atom', function(err, parsed) {
            log.i(parsed.feed.title);
            parsed.feed.entries.forEach(function(entry) {
                log.i(entry.title + ':' + entry.link + ":" + entry.pubDate);
                var dd = Date.parse(entry.pubDate);
                var dif = nowdate - dd;
                log.i(nowdate + " "  + dd + " " + dif + " : " + interMs);

                if(dif <= interMs) {
                    log.i("not long ago");
                }

            })
        });


        common.returnOutput(params, "rsstest was ! completed");
        return true;
    });

}(plugin));

module.exports = plugin;