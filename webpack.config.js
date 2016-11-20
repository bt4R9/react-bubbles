var path = require('path');

module.exports = {
    'context': path.join(__dirname, 'src'),
    'entry': {
        'main': './Bubbles.js'
    },
    'output': {
        'filename': '[name].js',
        'path': path.join(__dirname, 'dist')
    },
    'module': {
        'loaders': [
            {
                'test': /\.js/,
                'loader': 'babel-loader',
                'query': {
                    'presets': ['es2015', 'react']
                }
            }
        ]
    }
};
