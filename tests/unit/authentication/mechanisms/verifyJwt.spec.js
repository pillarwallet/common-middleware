const jwt = require('jsonwebtoken');
// const verifyJwt = require('../../../../lib/authentication/mechanisms/verifyJwt');

const privateKey = `
  -----BEGIN RSA PRIVATE KEY-----
  MIIEpAIBAAKCAQEA5A4qVPgkQs7SaoJSR/Ms0fgWCzQLwyH6gyEt4e6Xkatqk0R2
  UkSGdJ4z4U9YwBGf3aq/WejNgJ+FLtzltWMowXz0RPPYGUeAut2iNrLOqlJF6Mgf
  6cEZM43z9GbeA0fZLKdOnYy6TIyDy8Ox8mEOvMv5MqieCFdM1hFsMAYeSSNUw64y
  G5IAIp5roEODk0sRIOHyVc4k6+9NM8mAqBVmfgaGQGG9jHOVh+14/6rr10LIJG6X
  jTjjPhDukRjtLqYyN/npdcfsduDIarAH89EM/B7fsEXKCUff6HDncrCbSJqnJ4JE
  llHmG7o/eI4KdXtHb49HXeE2BVnND0dO77zqWQIDAQABAoIBAQDgxh1vFgwXVOYL
  WFtk0wcwBEclz6xwLYNNz1v7vT/isYMfl3DPcP7c3jjgL2aYGEbrIinrogs6ZP/N
  yqcVeqBm5JOViolJkTIN+/iv1NjhAqoo32ak7E+8goMaNnFH5n7lBhn0KwpL/IrC
  QSWYcZUm/BunlI3+Rp1SuGVbiAw9pBqXSd6/QO6k8FtmGVeyGJpN1sWoDCp0fTvl
  WXqLirySY1j7QdzQ4Tn9WNcsrSdbDjqqTreF0J5haUw0h3nnox8NIy0L/gzeIBdV
  4c5nOznga3I8uSGxTvOnhBB2cZbtMtRfK78+fLqDnW/+w4Bq+UjWku72laBaSls3
  JYsnwjSJAoGBAPkht9d+Am2wb+4SopbYbGdpimtUmDcvB8tKLAOT82Ln2kq12vLj
  wKBoSeIxbEAl4JqNe2FeZ6MtGTtThobYlubflcDmxrIOWIConuytqiwlADbDcDdS
  WLN/0aIxULKorxkkgduywEqE7ZQIThHcK2nE0NlBGfh97x0k47E7TiZrAoGBAOpX
  sp9ZWurLZ84dngQ76zmKIBFvxvTkk82FPsizYLQmwFETKLZnbLnS3Dy7SJIW9l8s
  33/RPMN8hcp5PELws0wjC6KjC+C8Y+RmfPvx1PpdZW6wX7qrhIT+HaRIijj0uduS
  ZfIYNVUK3c7kgkVhXk7/6g8dtA3+ln2XtqLkNztLAoGANGIWmcTxFcdHgbOBZF5V
  TNkwNakv6EqHRQNvhcESJ/XAPH1IcFHbKt9CycDClipgs56UFsEW4YSWDZdebfQU
  pq7Ueh8MIFxL16Gc6P8LDQUqqlkluzwhUnzJw2TDJw2443x9oYhQTlrs6XdlkvPM
  XQz5LPU3VLyGDoa3KYjiwckCgYEAkkTO3xtc3jS7xDFEUgw8VBvczEVif7S0dJF4
  kLk14PxXCcPVo5SGjq4IfXfAYj8m5F0T26n0LWhp8ekeLgIjR6CQQKFYZpvwFb3K
  wU8+yk7FYwN/nPo1qvUZ91K3w7ks0Npd+3AUydIQhHSowzl1LgYaR/kYS6veruGl
  Q6MCvmUCgYAxt6ZY+wWXpa5k7RF29xPAne5ruy7CTc9is3WZY/fon7L/Nv3C23fO
  pRk/ltxv7k3rkNrGCks8E9pkonRC6bFWBGIw65idKys2TM4sDs3SZ7YELR0TPaUZ
  VhrzDTLQYx7WZ4zdt9GhKbHMwVsAivuln5YkZBON3j9GH000BNE/jg==
  -----END RSA PRIVATE KEY-----
`;

describe('when validating a JWT', () => {
  beforeEach(() => {
    const token = jwt.sign(
      {
        data: 'foobar',
      },
      privateKey,
      { expiresIn: '1h' },
    );

    console.log(token);
  });

  it('should successfully validate a JWT token with valid credentials', () => {
    //
    console.log('test');
  });
});
