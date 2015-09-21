Meteor.startup(function () {

  var scraper = new Scraper();

  SyncedCron.add({
    name: 'Gather programmes & schedules',
    schedule: function(parser) {
      // parser is a later.parse object
      return parser.text('every 5 seconds');
    },
    job: function() {

      scraper.scrape("#SPLUS18EC85");
    }
  });

  SyncedCron.start();

});
