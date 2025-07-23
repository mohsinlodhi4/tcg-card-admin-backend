const path = require('path');
const { stripe } = require('./constants');
const User = require('../models/User');
const moment = require('moment');

const getProjectRootPath = () => path.resolve(__dirname, '..', '..');
const successResponse = (msg='', data={} ) => ( { message: msg, data: data, success: true} );
const errorResponse = (msg='', data={}) => ({ message: msg, data: data, success: false});

const randomString = (len= 5) => Math.random().toString(36).slice(len).toUpperCase();
const  convertToSlug = (inputString = "") => inputString.toLowerCase().replace(/\s+/g, '-');

function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    // Add leading zero to minutes if needed
    minutes = minutes < 10 ? '0' + minutes : minutes;

    // Convert to 12-hour format if you prefer
    // hours = hours % 12 || 12;

    return `${hours}:${minutes}`;
}
function formatDate(inputDate) {
    let date = new Date(inputDate);
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    if (day < 10) {
        day = '0' + day;
    }
    if (month < 10) {
        month = '0' + month;
    }
    return day + '-' + month + '-' + year;
}

async function getOrCreateStripeCustomer(email, name = '') {
    try {
        // Search for an existing customer by email
        const customers = await stripe.customers.list({
            email,
            limit: 1,
        });

        // If a customer exists, return the first match
        if (customers.data.length > 0) {
            return customers.data[0];
        }

        // If no customer exists, create a new one
        const customer = await stripe.customers.create({
            name,
            email,
        });

        return customer;
    } catch (error) {
        throw new Error(`Failed to get or create customer: ${error.message}`);
    }
}

async function getRole(userId) {
    const user = await User.findById(userId).populate('role');
    return user.role;
}

function calculateEndDate(currentDate, numberOfEvents, frequencyPeriod, frequency, daysOfWeek = []) {
    // Start with the current date
    let endDate = moment.utc(currentDate);
    if(!frequency) {
        frequency = 1;
    }

    if (frequencyPeriod.toLowerCase() === 'weeks' && daysOfWeek.length > 0) {
        let eventsCount = 0;

        const ACTUAL_EVENT_COUNT = 1
        const TOTAL_EVENTS = numberOfEvents + ACTUAL_EVENT_COUNT
        while (eventsCount != TOTAL_EVENTS) {
            // Check if the current day is in the daysOfWeek array
            if (daysOfWeek.includes(endDate.day())) {
                eventsCount++;
            }
            if (eventsCount != TOTAL_EVENTS) {
                endDate.add(1, 'day'); // Move to the next day
            }
            if(endDate.day() == 6 && frequency > 1 && eventsCount != TOTAL_EVENTS) {
                if (daysOfWeek.includes(endDate.day())) {
                    eventsCount++;
                }
                endDate.add((frequency - 1) * 7, 'days');
            }
        }
    } else {
        // Determine the period to add based on the frequencyPeriod
        switch(frequencyPeriod.toLowerCase()) {
            case 'months':
                endDate = endDate.add(numberOfEvents * frequency, 'months');
                break;
            case 'years':
                endDate = endDate.add(numberOfEvents * frequency, 'years');
                break;
            default:
                throw new Error("Invalid frequencyPeriod. Please use 'weeks', 'months', or 'years'.");
        }
    }

    return endDate.toDate();
}

function formatDate2(date) {
    return moment(date).format("D MMMM, YYYY");
  }

module.exports = {
    successResponse,
    errorResponse,
    randomString,
    getProjectRootPath,
    convertToSlug,
    getOrCreateStripeCustomer,
    getRole,
    getCurrentTime,
    calculateEndDate,
    formatDate,
    formatDate2,
}