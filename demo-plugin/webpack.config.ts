/* Copyright Contributors to the Open Cluster Management project */
/* eslint-env node */

import * as path from "path";
import { ConsoleRemotePlugin } from "@openshift-console/dynamic-plugin-sdk-webpack";
import * as webpack from "webpack";
import type { Configuration as DevServerConfiguration } from "webpack-dev-server";

const config: webpack.Configuration & DevServerConfiguration = {
  mode: "development",
  context: path.resolve(__dirname, "src"),
  entry: {},
  output: {
    path: path.resolve("./dist"),
    filename: "[name]-bundle.js",
    chunkFilename: "[name]-chunk.js",
  },
  watchOptions: {
    ignored: ["node_modules", "dist"],
  },
  devServer: {
    port: 9001,
    devMiddleware: {
      writeToDisk: true,
    },
    static: ["dist"],
  },
  resolve: {
    extensions: [".ts", ".tsx"],
  },
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: path.resolve(__dirname, "tsconfig.json"),
            },
          },
        ],
      },
      {
        test: /\.s?(css)$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot|otf)(\?.*$|$)/,
        loader: "file-loader",
        options: {
          name: "assets/[name].[ext]",
        },
      },
    ],
  },
  plugins: [new ConsoleRemotePlugin()],
  devtool: "cheap-module-source-map",
  optimization: {
    chunkIds: "named",
    minimize: false,
  },
};

export default config;
