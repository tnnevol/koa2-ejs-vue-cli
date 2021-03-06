"use strict";
// This uses a lot of es 6, es 7 syntax, please use a higher version of nodejs to compile
// The entire entry of the project is in the src directory, please do not modify
// 这里使用了很多的es6、es7的语法，请使用高版本的nodejs编译
// 项目的整个入口在src目录下，请勿修改

// node_modules
const path = require("path");
const webpack = require("webpack");
const glob = require("glob");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
// const StyleLintPlugin = require("stylelint-webpack-plugin");

// config variable(全局变量)
const config = require("../config");
const utils = require("./utils");
const isDev = process.env.NODE_ENV === "development";
// 处理路径的正则 \\双反向斜杠浏览器会返回这样的路径
const pathREG = /[/|//|\\|\\\\]/g;

const resolve = (dir) => {
  return path.join(__dirname, "..", dir);
};

// 多入口文件的处理
function entryProcess(entryPath) {
  // /home/tnnevol/workspace/gits/koa2-learn/client/entry/front/index.js
  const prefixPath = resolve(`${config.entry}/${entryPath}`);
  const filePathList = glob.sync(`${prefixPath}**/*.js`);
  const entry = {};
  filePathList.forEach((_path) => {
    const remainPath = _path.replace(prefixPath, "");
    const ext = path.parse(_path).ext;
    const reName = remainPath.replace(ext, "").split(pathREG).join(".");
    entry[reName] = isDev
      ? ["webpack-hot-middleware/client?reload=true", _path]
      : _path;
  });
  return entry;
}

// 多模板容器的处理 default views/
function viewContainerProcess(viewsEntry) {
  const prefixPath = resolve(`${config.serverEntry}/${viewsEntry}`); // 打包前views的完整路径
  const pathViews = glob.sync(`${prefixPath}**/*.ejs`); // 查询所有的ejs
  return pathViews.map((view) => {
    const ext = path.parse(view).ext;
    // 替换成相对路径
    const remainPath = view.replace(prefixPath, "");
    const reName = remainPath.replace(ext, "").split(pathREG).join(".");
    const chunks = isDev ? [reName] : ["manifest", "vendors", reName];
    return new HtmlWebpackPlugin({
      template: view,
      filename: `${viewsEntry}${remainPath}`, // resolve(),
      hash: true, // 为了更好的 cache，可以在文件名后加个 hash。
      cache: false,
      meta: {
        viewport:
          "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no",
      },
      favicon: resolve(`${config.entry}/assets/favicon.ico`),
      chunks,
    });
  });
}

// webpack base setting
module.exports = {
  name: "koa2-vue-cli",
  // 入口通过自调用函数会读取/src/js路径下的所有js文件
  entry: {
    ...entryProcess("entry/"),
  },
  // 用于cdn的全局变量
  // externals: {
  //   $: 'jQuery'
  // },
  // 输出js
  output: {
    path: config.build.assetsRoot, // 默认 dist/public
    publicPath: config[isDev ? "dev" : "build"].assetsPublicPath, // 默认 /piblic/ || /
    filename: path.posix.join(
      config[isDev ? "dev" : "build"].assetsSubDirectory, // static
      "js/[name].[hash:5].js"
    ),
    chunkFilename: path.posix.join(
      config[isDev ? "dev" : "build"].assetsSubDirectory,
      "js/[id].[chunkhash].js"
    ),
  },
  // 路径超级变量
  resolve: {
    // require时不添加后缀名从该数组中查找后缀名匹配
    extensions: [".js", ".json", ".vue"],
    alias: {
      vue$: "vue/dist/vue.esm.js",
      "@": resolve(config.entry),
    },
  },
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.(js|vue)$/,
        loader: "eslint-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.vue$/,
        use: [
          {
            loader: "vue-loader",
            options: {
              compilerOptions: {
                whitespace: "condense",
              },
              transformAssetUrls: {
                video: ["src", "poster"],
                source: "src",
                img: "src",
                image: ["xlink:href", "href"],
                use: ["xlink:href", "href"],
              },
            },
          },
        ],
      },
      {
        // js
        test: /\.js$/,
        exclude: (file) => /node_modules/.test(file) && !/\.vue\.js/.test(file),
        use: ["babel-loader"],
      },
      {
        // img
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              outputPath: config[isDev ? "dev" : "build"].assetsSubDirectory,
              name: "img/[name].[ext]?[contenthash]",
              esModule: false,
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        include: [resolve(`${config.entry}/icons`)],
        use: [
          {
            loader: "svg-sprite-loader",
            options: {
              symbolId: "icon-[name]",
            },
          },
        ],
      },
      {
        // font
        test: /\.(eot|woff2|woff|ttf|svg)$/,
        exclude: [resolve(`${config.entry}/icons`)],
        use: [
          {
            loader: "file-loader",
            options: {
              outputPath: config[isDev ? "dev" : "build"].assetsSubDirectory,
              name: "font/[name].[ext]?[contenthash]",
            },
          },
        ],
      },
      {
        test: /\.xml$/,
        use: {
          loader: "xml-loader",
          options: {
            explicitArray: false,
          },
        },
      },
      {
        test: /\.(le|c)ss$/,
        use: [
          isDev
            ? {
                loader: "vue-style-loader",
                options: {
                  sourceMap: true,
                },
              }
            : {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  // "export 'default' (imported as 'mod') was not found
                  esModule: false,
                },
              },
          {
            loader: "css-loader",
            options: {
              // esModule：false 开发环境样式才会生效
              esModule: false,
              sourceMap: true,
              importLoaders: 1,
            },
          },
          "postcss-loader",
          "less-loader",
        ],
      },
      {
        test: /\.(sc|sa)ss$/,
        use: [
          isDev
            ? {
                loader: "vue-style-loader",
                options: {
                  sourceMap: true,
                },
              }
            : {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  // "export 'default' (imported as 'mod') was not found
                  esModule: false,
                },
              },
          {
            loader: "css-loader",
            options: {
              // esModule：false 开发环境样式才会生效
              esModule: false,
              sourceMap: true,
              importLoaders: 1,
            },
          },
          "postcss-loader",
          "sass-loader",
        ],
      },
    ],
  },
  plugins: [
    // 定义全局变量，定义后不再需要import或require
    new webpack.ProvidePlugin({}),

    // html 输出
    ...viewContainerProcess("views/"),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolve("static"),
          to: config[isDev ? "dev" : "build"].assetsSubDirectory,
          globOptions: {
            ignore: [".*"],
          },
        },
      ],
    }),
    new VueLoaderPlugin(),
    // 抽出css
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: utils.assetsPath("css/[name].css"), // devMode ? '[name].css' : '[name].[hash].css',
      chunkFilename: utils.assetsPath("css/[id].css"), // devMode ? '[id].css' : '[id].[hash].css'
    }),
    // new StyleLintPlugin({
    //   files: ["**/*.{vue,htm,html,css,sss,less,scss,sass}"],
    // }),
  ],
};
