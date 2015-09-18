Programmes = new Mongo.Collection("Programmes");
Weeks = new Mongo.Collection("Weeks");
Days = new Mongo.Collection("Days");
Activities = new Mongo.Collection("Activities");

Schemas = {};

Schemas.ProgrammeSchema = new SimpleSchema({
  id: {
    type: String,
    label: "The selectbox ID of the programme",
    max: 100
  },
  name : {
    type: String,
    label: "The name of the programme",
    max: 250
  },
  schedule : {
    type : [Schemas.WeekSchema]
  }
});

Schemas.WeekSchema = new SimpleSchema({
  weekNumber: {
    type: Number,
    label: "The weeknumber of the week object",
    min: 1
  },
  year : {
    type: Number,
    label: "The year of the week object",
    min: 2015
  },
  days : {
    type : [Schemas.DaySchema]
  }
});

Schemas.DaySchema = new SimpleSchema({
  date: {
    type: Date,
    label: "Date of the day object"
  },
  dayOfWeek : {
    type: String,
    label: "The day of week for this day",
    max: 25
  },
  activities : {
    type : [Schemas.ActivitySchema]
  }
});

Schemas.ActivitySchema = new SimpleSchema({
  courses: {
    type: [String],
    label: "The list of courses for this activity"
  },
  start : {
    type: Date,
    label: "The start time for this activity"
  },
  end : {
    type: Date,
    label: "The start time for this activity"
  },
  lecturer : {
    type : String,
    label : "The lecturer for this activity",
    max: 50
  },
  notice : {
    type : String,
    label : "The notice (extra information) for this activity",
    max: 250
  },
  rooms : {
    type : [String],
    label : "The list of rooms for this activity"
  }
});

// Attack the schemas to their respective collections
Programmes.attachSchema(Schemas.ProgrammeSchema);
Weeks.attachSchema(Schemas.WeekSchema);
Days.attachSchema(Schemas.DaySchema);
Activities.attachSchema(Schemas.ActivitySchema);
