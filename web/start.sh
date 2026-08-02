#!/bin/sh
# 启动脚本：控制Next.js监听地址，而不影响前端API URL

# Next.js standalone模式会使用HOSTNAME环境变量作为监听地址
# 我们显式设置为0.0.0.0，让它监听所有网络接口
# 但这不影响构建时硬编码的NEXT_PUBLIC_API_URL

export HOSTNAME=0.0.0.0

# 启动Next.js服务器
echo "Starting Next.js server on 0.0.0.0:3000..."
exec node server.js