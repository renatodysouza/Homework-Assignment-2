const _data = require('./lib/data');
const helpers = require('./lib/helpers');
const vToken = require('./models/token');


const datas = {
  'from': 'hi@sandboxec901ff6d0c44200b2d91dac7c8459ae.mailgun.org',
  'to': 'renatodysouza@gmail.com',
  'subject': 'test',
  'body': 'hello wold'
};


helpers.sendEmail(datas, function(err, respo) {
  console.log(err);
      });
