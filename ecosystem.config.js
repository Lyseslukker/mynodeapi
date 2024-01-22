module.exports = {
    apps: [{
        name: 'my-app',
        script: './app.js',
        env_production: {
            NODE_ENV: 'production',
            // API_KEY should be set directly on the server or through a secure mechanism
        }
    }]
}