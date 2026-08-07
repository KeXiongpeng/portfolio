// config/env.js
// 小程序环境配置

const ENV = {
  // 开发环境（IP 访问，备案前使用）
  development: {
    BASE_URL: 'http://120.77.222.102:3001',
    DESC: '开发环境 - IP访问'
  },

  // 生产环境（域名访问，备案后使用）
  production: {
    BASE_URL: 'https://api.kxp.o9k.cn',
    DESC: '生产环境 - 域名访问'
  }
};

// 当前环境（已切换为生产环境）
const currentEnv = 'production';

/**
 * 获取当前环境的配置
 * @returns {Object} 环境配置对象
 */
function getConfig() {
  const config = ENV[currentEnv];
  console.log(`[ENV] 当前环境: ${config.DESC}`);
  console.log(`[ENV] API地址: ${config.BASE_URL}`);
  return config;
}

module.exports = {
  ENV,
  currentEnv,
  getConfig
};