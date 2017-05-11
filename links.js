/**
 * Created by n-futagami on 2017/05/11.
 */
const colors = require('colors');
const util = require('util');
const Nightmare = require('nightmare');
const axios = require('axios');
const settle = require('promise-settle');
const _ = require('lodash');

const url = process.argv[2];
const wait = parseInt(process.argv[3]);
const show = ( process.argv[4] === "true");
const detail = ( process.argv[5] === "true");

nightmare = Nightmare({show: show});
nightmare
    .goto(url)
    .wait(wait)
    .evaluate(() => {
        const anchors = document.getElementsByTagName('a');
        const images = document.getElementsByTagName('img');
        const scripts = document.getElementsByTagName('script');
        const links = document.getElementsByTagName('link');

        return [].concat(
            [].map.call(anchors, el => el.href || el.src),
            [].map.call(images, el => el.href || el.src),
            [].map.call(scripts, el => el.href || el.src),
            [].map.call(links, el => el.href || el.src)
        );
    })
    .end()
    .then(result => {
        if(detail) console.log(util.inspect(result));

        settle(
            result.map(link => (link !== null && link.match(/^http[s]?:\/\/.+/)) ? axios.get(link) : Promise.resolve(link))
        ).then(results => {
            if(detail) console.log(results.length);
            results.forEach(result => {
                let msg = "";
                if (result.isFulfilled()) {
                    if (!detail) return;

                    msg = 'Promise is fulfilled ';
                    if ((_.has(result.value(), 'status'))) {
                        msg += [ result.value().config.url, result.value().status, result.value().statusText].join(' ');
                    } else {
                        msg += colors.gray('Irregular Link: ' + result.value());
                    }
                    console.log(msg);
                } else {
                    msg = 'Promise rejected Error: ';
                    if ((_.has(result.reason().response, 'status'))) {
                        msg += [ result.reason().config.url, result.reason().response.status, result.reason().response.statusText].join(' ');
                    }
                    console.log(colors.red(msg));
                }
            })
        });
    })
    .catch(error => {
        console.error('Search failed:', error);
    });
