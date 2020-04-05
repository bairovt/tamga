module.exports = {
  apps : [{
    name      : 'tamga',
    script    : './tamga-srv.js',
    watch: false,
//    instance_var: 'INSTANCE_ID',
    env: {
	NODE_ENV: 'production',
	NODE_CONFIG_DIR: '/home/tumen/nodejs/tamga/config/',
	NODE_PATH: '/home/tumen/nodejs/tamga'
    },
    env_production : {
      NODE_ENV: 'production'
    }
  }],

/*
  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
*/
};
