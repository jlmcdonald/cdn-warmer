let restify = require('restify'),
  bunyan = require('bunyan'),
  courier = require('./courier');

let LOG = bunyan.createLogger({
    name: 'Pheidippides',
    level: bunyan.INFO,
    src: true
  }),
  config = require('./config.local');

let server = restify.createServer({
  log: LOG.child({
    component: 'server',
    level: bunyan.INFO,
    streams: [{
      level: bunyan.DEBUG,
      type: 'raw',
      stream: new restify.bunyan.RequestCaptureStream({
        level: bunyan.WARN,
        maxRecords: 100,
        maxRequestIds: 1000,
        stream: process.stderr
      })
    }],
    serializers: bunyan.stdSerializers
  })
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.requestLogger());
server.use(restify.queryParser());

server.use(restify.CORS({
  origins: [
    'https://cdn-helper-jlmcdonald.c9users.io',
    'https://bleeping.vidangel.com',
    'https://angelplayer.vidangel.com',
    'https://www.vidangel.com'
  ],
  credentials: true,
  headers: [
    "authorization",
    "withcredentials",
    "x-requested-with",
    "x-forwarded-for",
    "x-real-ip",
    "x-customheader",
    "user-agent",
    "keep-alive",
    "host",
    "accept",
    "connection",
    "upgrade",
    "content-type",
    "dnt",
    "if-modified-since",
    "cache-control"
  ]
}));

server.use(restify.fullResponse());

server.on('uncaughtException', function(req, res, route, err) {
  req.log.error(err, 'got uncaught exception');
});

server.get('/:dwid/rev/:rev/:ts', courier.serveClip);
server.get(/\/.*/, (req, res, next) => {
  res.send(new restify.ImATeapotError('I cannot give you what you are asking for'));
});
let port = process.env.PORT || config.server.port,
  host = process.env.IP || config.server.host;

server.listen(port, host, function() {
  LOG.info(`Server started on ${host}, port ${port}`);
});
