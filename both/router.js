
Meteor.startup(function () {
    if (Meteor.isClient) {
        var location = Iron.Location.get();
        if (location.queryObject.platformOverride) {
            Session.set('platformOverride', location.queryObject.platformOverride);
        }
    }

    Router.configure({
      // the default layout
      layoutTemplate: 'ApplicationLayout'
      //loadingTemplate: 'loading'
    });

    Router.route('/', function() {
      this.layout('ApplicationLayout');
      this.render('main');
    });
});
