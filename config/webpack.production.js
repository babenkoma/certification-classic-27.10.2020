// -----------------------------------------------------------------------------
// Deps
// -----------------------------------------------------------------------------

const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const paths = require('./paths');
const baseConfig = require('../webpack.config');

// -----------------------------------------------------------------------------
// Full config
// -----------------------------------------------------------------------------

module.exports = merge(baseConfig, {
	mode: 'production',
	output: {
		path: paths.build.dist,
		publicPath: '',
		filename: 'js/[name].[contenthash].bundle.js'
	},
	plugins: [
		new CleanWebpackPlugin(),
		new CopyWebpackPlugin({
			patterns: [
				{
					from: paths.build.content,
					to: '',
					globOptions: {
						ignore: ['*.DS_Store']
					}
				}
			]
		}),
		new MiniCssExtractPlugin({
			filename: 'styles/[name].[contenthash].css',
			chunkFilename: '[id].css'
		})
	],
	module: {
		rules: [
			{
				test: /\.(scss|css)$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader',
						options: {
							importLoaders: 2,
							sourceMap: false
						}
					},
					'postcss-loader',
					'sass-loader'
				]
			}
		]
	},
	optimization: {
		minimize: true,
		minimizer: [new OptimizeCssAssetsPlugin(), new TerserPlugin()],
		// Once your build outputs multiple chunks, this option will ensure they share the webpack runtime
		// instead of having their own. This also helps with long-term caching, since the chunks will only
		// change when actual code changes, not the webpack runtime.
		runtimeChunk: {
			name: 'runtime'
		}
	},
	performance: {
		hints: false,
		maxEntrypointSize: 512000,
		maxAssetSize: 512000
	}
});
