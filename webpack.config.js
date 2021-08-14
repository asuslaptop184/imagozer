const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
var BrowserSyncPlugin = require('browser-sync-webpack-plugin')
const glob = require('glob');

// cd /mnt/ssd/www/wp-plugins/nice-image-editor/wp-content/plugins/nice-image-editor/ && npm run watch
// different instances for editor or view css files
const editorExtractTextPlugin = new ExtractTextPlugin("[name]/[name].editor.css");
const viewExtractTextPlugin = new ExtractTextPlugin("[name]/[name].view.css");

const nodeExternals = require('webpack-node-externals');

module.exports = [{
    entry: {
        'backend': [
            './src/image.editor.js',
            './src/image.editor.scss'
        ]
    },
    
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name]/[name].build.js'
    },

    module: {
        rules: [
            {
                test: /\.view.scss$/,
                exclude: [
                    /node_modules/
                ],
                use: viewExtractTextPlugin.extract({
                    use: [{
                        loader: 'css-loader'
                    }, {
                        loader: 'sass-loader'
                    }],
                    fallback: 'style-loader'
                })
            },

            {
                test: /\.editor.scss$/,
                exclude: [
                    /node_modules/
                ],
                use: editorExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: [{
                        loader: "css-loader", options: {
                            sourceMap: true
                        }
                    }, {
                        loader: "sass-loader", options: {
                            sourceMap: true
                        }
                    }]
                })
            },

            {
                test: /\assets.scss$/,
                exclude: [
                    /node_modules/
                ],
                use: editorExtractTextPlugin.extract({
                    use: [{
                        loader: 'css-loader'
                    }, {
                        loader: 'sass-loader'
                    }],
                    fallback: 'style-loader'
                })
            },

            {
                test: /\.css$/,
                loaders: ['style-loader', 'css-loader'],
            },
            
            {
                test: /\.jsx?$/,
                exclude: [
                    /node_modules/
                ],
                use: [
                  {
                    loader: 'babel-loader',
                    options: {
                      presets: ["es2015","react","stage-3"],
                      cacheDirectory: true,
                    }
                  }
                ],
            },
            {
                test: /\.woff2?$|\.png$|\.ttf$|\.eot$|\.svg$/,
                use: ['url-loader']
            }
        ]
    },

    plugins: [
        editorExtractTextPlugin,
        viewExtractTextPlugin,
        new BrowserSyncPlugin({
            host: 'dev.aa-team.com',
            port: 5365,
            proxy: 'http://dev.aa-team.com/wp-plugins/nice-image-editor/wp-admin/upload.php',
            files: [
                "build/backend/backend.build.js",
                "build/backend/backend.editor.css",
            ]
        },{
       // disable reload from the webpack plugin - not browserSync itself
       reload: false
     })
    ],

    stats: {
        colors: true
    },

    devtool: 'source-map'
}];