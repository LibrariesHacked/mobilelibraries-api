const ical = require('ical-generator');

const ical_js = require('ical.js');

const prod = {
    company: 'Libraries Hacked',
    product: 'Mobile Libraries',
    language: 'EN'
};
const timezone = 'Europe/London';
ical().timezone(timezone);

const moment = require('moment');

module.exports.createCalendar = (data) => {

    var recur = new ical_js.recur(data.frequency); 

    const cal = ical({ domain: 'mobilelibraries.org', name: data.name });
    cal.prodId(prod);
    cal.createEvent({
        start: data.start,
        end: data.end,

        summary: data.summary,
        description: data.description,
        location: data.location,
        url: data.url
    });
    return cal.toString();
};