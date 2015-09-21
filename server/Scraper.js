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
      self.parseProgrammes(err, body, self);
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
        console.log(programme);
        this.reqData.form.dlObject = programme.id;
        console.log("scrape > scraping for " + id + ":" + programme.name);
        request.post(this.reqData, function(err, response, body) {
          self.parseProgrammeSchedule(err, body, self);
        });
      } else {
        console.log("scrape > couldn't find programme by that ID");
      }
    } else {
      console.log("scrape > getting schedules for all programmes");
      var exParseProgrammes = function(err, response, body) {
        self.parseProgrammeSchedule(err, body, self);
      };
      for(var n = 0; n < this.programmeOptions.length; n++) {
        this.reqData.form.dlObject = this.programmeOptions[n].id;
        request.post(this.reqData, exParseProgrammes);
      }
    }
  };


  _scraper.prototype.parseProgrammes = function (err, body, self) {
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

  _scraper.prototype.parseProgrammeSchedule = function(err, body, self) {
    if(err) console.log("scheduleRequestResult > error happened");
    else {
      var programme = {id: "", name: "", schedule: []};
      $ = cheerio.load(body);
      programme.name = sanitize($(".title").text());
      console.log("scheduleRequestResult > parsing schedule for " + programme.name);
    }
  };


  _scraper.prototype.getScheduleURL = function() {
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


  return _scraper;
})();
