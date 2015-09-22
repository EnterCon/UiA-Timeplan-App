Meteor.startup(function () {

  var scraper = new Scraper();

  var millisecondsToWait = 2000;
  setTimeout(function() {
      scraper.scrape();
  }, millisecondsToWait);

  SyncedCron.add({
    name: 'Gather programmes & schedules',
    schedule: function(parser) {
      // parser is a later.parse object
      return parser.text('every 12 hours');
    },
    job: function() {
      scraper.scrape();
    }
  });

  SyncedCron.start();

});
