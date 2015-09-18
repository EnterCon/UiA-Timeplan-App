var cheerio = Meteor.npmRequire('cheerio');

var getScheduleURL = function() {
  var autumnURL = "http://timeplan.uia.no/swsuiah/public/no/default.aspx";
  var springURL = "http://timeplan.uia.no/swsuiav/public/no/default.aspx";

  var now         = new Date();
  var autumnStart = new Date(now.getYear(), 6, 20);
  var springStart = new Date(now.getYear(), 12, 16);
  var range       = moment().range(autumnStart, springStart);
  if(range.contains(now)) {
    return autumnURL;
  } else {
    return springURL;
  }
};

var scrapeProgrammeSchedules = function() {
  HTTP.get(getScheduleURL(), {jar: true, followRedirects: true}, programmesRequestResult);

  function programmesRequestResult(err, result) {
    if(err)
      console.log("handleProgrammesRequestResult > couldn't get programmes");
    else {
      console.log("handleProgrammesRequestResult > retrieved HTML for programmes");
      $ = cheerio.load(result.content);
      var __EVENTTARGET         = $("#__EVENTTARGET").val();
      var __EVENTARGUMENT       = $("#__EVENTARGUMENT").val();
      var __LASTFOCUS           = $("#__LASTFOCUS").val();
      var __VIEWSTATE           = $("#__VIEWSTATE").val();
      var __VIEWSTATEGENERATOR  = $("#__VIEWSTATEGENERATOR").val();
      var __EVENTVALIDATION     = $("#__EVENTVALIDATION").val();
      var tLinkType             = $("#tLinkType").val();
      var tWildcard             = $("#tWildcard").val();
      var lbWeeks               = $("select[name=lbWeeks] option[selected=selected]").val();
      var lbDays                = $("select[name=lbDays] option[selected=selected]").val();
      var RadioType             = $("input[type=radio][name=RadioType][checked=checked]").val();
      var bGetTimetable         = $("input[id=bGetTimetable]").val();
      parseProgrammeOptions($("select[id=dlObject] option"));
    }
  }

  function parseProgrammeOptions(optionList) {
    console.log("parseProgrammeOptions > parsing programme options");
    var programmes = {};
    optionList.each(function() {
      var option = $(this);
      programmes[option.text()] = option.val();
    });
    console.log("parseProgrammeOptions > found " + Object.keys(programmes).length + " programmes");

  }

  function getProgrammeSchedule() {

  }
};



SyncedCron.add({
  name: 'Gather programmes & schedules',
  schedule: function(parser) {
    // parser is a later.parse object
    return parser.text('every 5 seconds');
  },
  job: function() {
    scrapeProgrammeSchedules();
  }
});


Meteor.startup(function () {
  SyncedCron.start();
});
