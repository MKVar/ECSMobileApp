import _, { isString } from "lodash";
import { DateTime } from "luxon";

export const randomString = (length, pPreset) => {
  if (!_.isNumber(length)) {
    throw new TypeError('"length" is not a string');
  }
  if (_.isNaN(length)) {
    throw new TypeError('"length" is NaN');
  }
  if (!_.isUndefined(pPreset) && !_.isString(pPreset)) {
    throw new TypeError('"preset" is not a string');
  }
  if (!_.isUndefined(pPreset) && pPreset.length === 0) {
    throw new TypeError('"preset" is an empty string');
  }
  var input = _.isUndefined(pPreset) ? "safe" : pPreset;
  var presets = {
    alpha: "1234567890abcdefghijklmnopqrstuvwxyz",
    hex: "1234567890abcdef",
    letters: "abcdefghijklmnopqrstuvwxyz",
    numerals: "1234567890",
    safe: "23456789abcdefghjkmnpqrstuvwxyz",
  };
  var preset = _.chain(presets).get(input, input).shuffle().value();
  var upper = preset.length - 1;
  var getRandomItem = function () {
    var isUpper = _.sample([true, false]);
    var item = preset[_.random(upper)];
    return _[isUpper ? "toUpper" : "toLower"](item);
  };
  return length === 0
    ? ""
    : _.chain(0).range(length).map(getRandomItem).join("").value();
};

export const formatDuration = (ms) => {
  let s = Math.ceil(ms / 1000);
  let min = Math.floor(s / 60);
  let sec = s % 60;
  if (sec < 10) {
    sec = `0${sec}`;
  }
  return `${min}:${sec}`;
};

export const prettySimpleDateTime = (timestamp) => {
  const jsDate = DateTime.fromJSDate(new Date(timestamp));

  let displayTime;
  if (jsDate.hasSame(DateTime.local(), "day")) {
    // today: h:mm a
    displayTime = jsDate.toFormat("h:mm a");
  } else if (
    jsDate.startOf("day") >= DateTime.now().minus({ day: 1 }).startOf("day")
  ) {
    // yesterday: "yesterday"
    displayTime = `Yesterday`; // ${jsDate.toFormat("h:mm a")}`;
  } else if (
    jsDate.startOf("day") >= DateTime.now().minus({ day: 7 }).startOf("day")
  ) {
    // last 7 days: day of week
    displayTime = jsDate.toFormat("EEE");
  } else {
    // else: month/day
    displayTime = jsDate.toFormat("MMM d");
  }
  return displayTime;
};
