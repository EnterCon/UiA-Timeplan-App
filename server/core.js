Meteor.startup(function () {

  var scraper = new Scraper();

  var millisecondsToWait = 2000;
  setTimeout(function() {
      scraper.scrape("#SPLUS83F11B");
  }, millisecondsToWait);

  SyncedCron.add({
    name: 'Gather programmes & schedules',
    schedule: function(parser) {
      // parser is a later.parse object
      return parser.text('every 5 seconds');
    },
    job: function() {


    }
  });

  //SyncedCron.start();

});
