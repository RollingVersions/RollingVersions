import http from 'http';

http
  .createServer((_req, res) => {
    res.end(process.env.ENV_VAR);
  })
  .listen(process.env.PORT || 3000);
