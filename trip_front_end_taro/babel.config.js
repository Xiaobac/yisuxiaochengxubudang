// babel.config.js
module.exports = {
  presets: [
    ['taro', {
      framework: 'react',
      ts: false,
      compiler: 'webpack5',
      // 可选：添加 targets 确保更彻底的转换
      targets: {
        ios: '9',
        android: '5',
      }
    }]
  ],
  // 👇 关键：添加刚刚安装的插件
  plugins: [
    '@babel/plugin-transform-optional-chaining',
    '@babel/plugin-transform-nullish-coalescing-operator',
    '@babel/plugin-transform-optional-catch-binding'
  ]
}