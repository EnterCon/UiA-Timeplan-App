var cheerio = Meteor.npmRequire('cheerio');
var request = Meteor.npmRequire('request');

Scraper = (function () {
  // constructor
  var _scraper = function () {
    this.reqData = {url: this.getScheduleURL(), jar: request.jar(), followAllRedirects: true, form : {}};
    this.programmeOptions = [];  // All available programme options ID's and names
    this.programmes = [];        // Array of all programme objects (validation by schemas)

    var self = this;
    request(this.reqData, function(err, response, body) {
      self.parseProgrammeOptions(err, body, self);
    });

  };

  _scraper.prototype.scrape = function(id) {
    console.log("scrape > starting");
    var self = this;
    if(id !== "" && id !== null) {
      var programme;
      for(var i = 0; i < this.programmeOptions.length; i++) {
        if(this.programmeOptions[i].id === id) {
          programme = this.programmeOptions[i];
          break;
        }
      }
      if(programme !== null && programme !== undefined) {
        this.reqData.form.dlObject = programme.id;
        request.post(this.reqData, function(err, response, body) {
          self.parseProgrammeSchedule(err, body, id);
        });
      } else {
        console.log("scrape > couldn't find programme by that ID");
      }
    } else {
      console.log("scrape > getting schedules for all programmes");
      for(var n = 0; n < this.programmeOptions.length; n++) {
        this.reqData.form.dlObject = this.programmeOptions[n].id;
        request.post(this.reqData, function(err, response, body) {
          self.parseProgrammeSchedule(err, body, this.programmeOptions[n].id);
        }); // jshint ignore:line
      }
    }
  };


  _scraper.prototype.parseProgrammeOptions = function (err, body, self) {
    if(err)
      console.log("parseProgrammes > couldn't get programmes");
    else {
      console.log("parseProgrammes > retrieved HTML for programmes");
      $ = cheerio.load(body);
      self.reqData.form.__EVENTTARGET         = $("#__EVENTTARGET").val() === undefined ? "" : $("#__EVENTTARGET").val();
      self.reqData.form.__EVENTARGUMENT       = $("#__EVENTARGUMENT").val() === undefined ? "" : $("#__EVENTARGUMENT").val();
      self.reqData.form.__LASTFOCUS           = $("#__LASTFOCUS").val() === undefined ? "" : $("#__LASTFOCUS").val();
      self.reqData.form.__VIEWSTATE           = $("#__VIEWSTATE").val();
      self.reqData.form.__VIEWSTATEGENERATOR  = $("#__VIEWSTATEGENERATOR").val();
      self.reqData.form.__EVENTVALIDATION     = $("#__EVENTVALIDATION").val();
      self.reqData.form.tLinkType             = $("#tLinkType").val();
      self.reqData.form.tWildcard             = $("#tWildcard").val() === undefined ? "" : $("#tWildcard").val();
      self.reqData.form.lbWeeks               = $("select[name=lbWeeks] option[selected=selected]").val();
      self.reqData.form.lbDays                = $("select[name=lbDays] option[selected=selected]").val();
      self.reqData.form.RadioType             = $("input[type=radio][name=RadioType][checked=checked]").val();
      self.reqData.form.bGetTimetable         = $("input[id=bGetTimetable]").val();
      console.log("parseProgrammes > parsing programme options");
      var i = 0;
      $("select[id=dlObject] option").each(function() {
        var opt = $(this);
        self.programmeOptions[i] = {id : opt.val(), name: opt.text()};
        i++;
      });
    }
  };

  _scraper.prototype.parseProgrammeSchedule = function(err, body, id) {
    if(err) console.log("parseProgrammeSchedule > error happened");
    else {
      var programme = {id: id, name: "", schedule: []};
      $ = cheerio.load(body);
      programme.name = sanitize($(".title").text());
      console.log("parseProgrammeSchedule > parsing schedule for " + id + ":" + programme.name);
      $("table").each(function(i, elem) {
        console.log("parseProgrammeSchedule > " + programme.id + ":" + programme.name + " has " +
          programme.schedule.length + " weeks");
        var dayElements = $(this).find("tr.tr2");
        if(dayElements !== null && dayElements.length > 0) {
          var days = [];
          var week = {weekNumber: 0, year: "", days : []};
          var weekStr = $(this).find("td.td1").text();
          week.weekNumber = parseWeekNumber(weekStr);
          week.year = parseYear(weekStr);
          dayElements.each(function(i, elem) {
            var activity = {courses : [], rooms: [], lecturer: "", notice: "", start: "", end: ""};
            activity.courses = parseCourses(sanitize($(this).children().eq(3).text()));
            activity.rooms = parseRooms(sanitize($(this).children().eq(4).text()));
            activity.lecturer = sanitize($(this).children().eq(5).text());
            activity.notice = sanitize($(this).children().eq(6).text());
            var dateStr = sanitize($(this).children().eq(1).text());
            var timeStr = sanitize($(this).children().eq(2).text());
            var dates = parseTimespan(week.year, dateStr, timeStr);
            activity.start = dates.start;
            activity.end = dates.end;
            var exists = [];
            for(var n = 0; n < days.length; n++) {
              var dayDate = days[n].date.getDate() + "." + days[n].date.getMonth();
              if(dayDate == activity.start.getDate() + "." + activity.start.getMonth()){
                exists.push(days[n]);
              }
            }
            if(exists.length === 0) {
              var day = {date: activity.start, dayOfWeek : getDayOfWeek(activity.start), activities : []};
              day.activities.push(activity);
              days.push(day);
            } else if (exists.length > 0) {
              exists[0].activities.push(activity);
            }
          });
          week.days = days;
          programme.schedule.push(week);
        }
      });
    }
  };


  _scraper.prototype.getScheduleURL = function() {
    var now         = new Date();
    var autumnStart = new Date(now.getFullYear(), 6, 20);
    var springStart = new Date(now.getFullYear(), 12, 16);
    var range       = moment().range(autumnStart, springStart);
    if(range.contains(now)) {
      return "http://timeplan.uia.no/swsuiah/public/no/default.aspx";
    } else {
      return "http://timeplan.uia.no/swsuiav/public/no/default.aspx";
    }
  };


  return _scraper;
})();


var parseWeekNumber = function(str) {
  var matches = str.match(/(?:uke.+)\b([0-9]|[1-4][0-9]|5[0-2])\b/i);
  if (matches === null || matches.length === 0) return 0;
  else {
    return matches[0];
  }
};

var parseYear = function(str) {
  var matches = str.match(/(20)\d{2}/i);
  if (matches === null || matches.length === 0) return 0;
  else {
    return matches[0];
  }
};

var parseRooms = function(str) {
  var rooms = str.split(',');
  return rooms;
};

var parseCourses = function(str) {
  var matches = str.match(/([A-Z]{2,3}-?\d{2,3})/ig);
  return matches;
};

var parseTimespan = function(year, date, str) {
  var res = {start : "", end : ""};
  var times = str.split('-');
  if(times.length != 2) return undefined;
  var startStr = times[0];
  var endStr = times[1];

  var hoursStart = startStr.split('.')[0];
  var minutesStart = startStr.split('.')[1];
  hoursStart = hoursStart.length == 1 ? "0" + hoursStart : hoursStart;
  minutesStart = minutesStart.length == 1 ? "0" + minutesStart : minutesStart;
  var start = new Date(date + " " + year + " " + hoursStart + ":" + minutesStart + ":00");
  if(start !== null && start !== undefined && !isNaN(start)) {
    res.start = start;
  }

  var hoursEnd = endStr.split('.')[0];
  var minutesEnd = endStr.split('.')[1];
  hoursEnd = hoursEnd.length == 1 ? "0" + hoursEnd : hoursEnd;
  minutesEnd = minutesEnd.length == 1 ? "0" + minutesEnd : minutesEnd;
  var end = new Date(date.toString() + " " + year + " " + hoursEnd + ":" + minutesEnd + ":00");
  if(end !== null && end !== undefined && !isNaN(end)) {
    res.end = end;
  }
  return res;
};

var getDayOfWeek = function(date) {
  var weekday = new Array(7);
  weekday[0]=  "Sunday";
  weekday[1] = "Monday";
  weekday[2] = "Tuesday";
  weekday[3] = "Wednesday";
  weekday[4] = "Thursday";
  weekday[5] = "Friday";
  weekday[6] = "Saturday";
  var dayNum = date.getDay();
  return weekday[dayNum];
};
