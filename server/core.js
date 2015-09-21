var cheerio = Meteor.npmRequire('cheerio');
var request = Meteor.npmRequire('request');

var getScheduleURL = function() {
  var autumnURL = "http://timeplan.uia.no/swsuiah/public/no/default.aspx";
  var springURL = "http://timeplan.uia.no/swsuiav/public/no/default.aspx";

  var now         = new Date();
  var autumnStart = new Date(now.getFullYear(), 6, 20);
  var springStart = new Date(now.getFullYear(), 12, 16);
  var range       = moment().range(autumnStart, springStart);
  if(range.contains(now)) {
    return autumnURL;
  } else {
    return springURL;
  }
};

var scrapeProgrammeSchedules = function() {
  var jar = request.jar();
  var reqData = {url: getScheduleURL(), jar: jar, followAllRedirects: true};
  var formData = {};
  var programmeOptions = [];  // All available programme options ID's and names
  var programmes = [];        // Array of all programme objects (validation by schemas)
  request(reqData, programmesRequestResult);
  reqData.form = {};

  function programmesRequestResult(err, response, body) {
    if(err)
      console.log("programmesRequestResult > couldn't get programmes");
    else {
      console.log("programmesRequestResult > retrieved HTML for programmes");
      $ = cheerio.load(body);
      reqData.form.__EVENTTARGET         = $("#__EVENTTARGET").val() === undefined ? "" : $("#__EVENTTARGET").val();
      reqData.form.__EVENTARGUMENT       = $("#__EVENTARGUMENT").val() === undefined ? "" : $("#__EVENTARGUMENT").val();
      reqData.form.__LASTFOCUS           = $("#__LASTFOCUS").val() === undefined ? "" : $("#__LASTFOCUS").val();
      reqData.form.__VIEWSTATE           = $("#__VIEWSTATE").val();
      reqData.form.__VIEWSTATEGENERATOR  = $("#__VIEWSTATEGENERATOR").val();
      reqData.form.__EVENTVALIDATION     = $("#__EVENTVALIDATION").val();
      reqData.form.tLinkType             = $("#tLinkType").val();
      reqData.form.tWildcard             = $("#tWildcard").val() === undefined ? "" : $("#tWildcard").val();
      reqData.form.lbWeeks               = $("select[name=lbWeeks] option[selected=selected]").val();
      reqData.form.lbDays                = $("select[name=lbDays] option[selected=selected]").val();
      reqData.form.RadioType             = $("input[type=radio][name=RadioType][checked=checked]").val();
      reqData.form.bGetTimetable         = $("input[id=bGetTimetable]").val();
      parseProgrammeOptions($("select[id=dlObject] option"));
    }
  }

  function parseProgrammeOptions(optionList) {
    console.log("parseProgrammeOptions > parsing programme options");
    var i = 0;
    optionList.each(function() {
      var opt = $(this);
      programmeOptions[i] = {id : opt.val(), name: opt.text()};
      i++;
    });
    getProgrammesSchedules();
  }

  function getProgrammesSchedules() {
    console.log("getProgrammeSchedule > getting schedules for programmes");
    for(var i = 0, len = programmeOptions.length; i < len; i++) {
      reqData.form.dlObject = programmeOptions[i].id;
      request.post(reqData, scheduleRequestResult);
      i = 500;
    }
  }

  function scheduleRequestResult(err, response, body) {
    if(err) console.log("scheduleRequestResult > error happened");
    else {
      console.log("scheduleRequestResult > parsing schedule for programme");
      var programme = {id: "", name: "", schedule: []};
      $ = cheerio.load(body);
      programme.name = sanitize($(".title").text());
    }
  }
};



SyncedCron.add({
  name: 'Gather programmes & schedules',
  schedule: function(parser) {
    // parser is a later.parse object
    return parser.text('every 12 hours');
  },
  job: function() {
    scrapeProgrammeSchedules();
  }
});


Meteor.startup(function () {
  //SyncedCron.start();
  //scrapeProgrammeSchedules();
});
