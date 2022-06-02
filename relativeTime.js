// Inspired and modified from https://github.com/yairEO/relative-time
(function (root, factory) {
  typeof define === "function" && define.amd
    ? define([], factory)
    : typeof module === "object" && module.exports
    ? (module.exports = factory())
    : (root.relativeTime = factory());
})(typeof self !== "undefined" ? self : this, function () {
  function relativeTime(
    date,
    {
      relativeTo = new Date(),
      minimalUnit = "second",
      locale = [],
      options = {},
      showNow = true,
    } = {}
  ) {
    options.numeric = options.numeric || "auto";
    const rtf = new Intl.RelativeTimeFormat(locale, options);

    const elapsed = date - relativeTo;

    if (Math.round(elapsed / relativeTime.UNITS[minimalUnit]) == 0) {
      if (showNow) return rtf.format(0, "second");
      else return false;
    }

    // "Math.abs" accounts for both "past" & "future" scenarios
    for (const u in relativeTime.UNITS)
      if (Math.abs(elapsed) > relativeTime.UNITS[u] || u == minimalUnit)
        return rtf.format(Math.round(elapsed / relativeTime.UNITS[u]), u);
  }
  relativeTime.UNITS = Object.fromEntries(
    Object.entries(
      new (function () {
        // in miliseconds,
        this.second = 1000;
        this.minute = this.second * 60;
        this.hour = this.minute * 60;
        this.day = this.hour * 24;
        this.year = this.day * 365;
        this.month = this.year / 12;
      })()
    ).sort(([, a], [, b]) => b - a) // sort from largest to smallest
  );

  return relativeTime;
});
