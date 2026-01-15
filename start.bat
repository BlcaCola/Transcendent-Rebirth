@echo off
chcp 65001 >nul
echo ============================================
echo   超凡新生前端服务 - Windows 启动脚本
echo ============================================
echo:

REM 检查 Node.js 是否安装
where node >nul 2>&1
if errorlevel 1 (
    echo 错误: 未检测到 Node.js，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js 已安装
echo:

REM 检查 npm 是否安装
where npm >nul 2>&1
if errorlevel 1 (
    echo 错误: 未检测到 npm
    pause
    exit /b 1
)

echo npm 已安装
echo:

REM 检查 node_modules 是否存在
if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    echo 这可能需要几分钟时间，请耐心等待...
    echo:
    call npm install
    if errorlevel 1 (
        echo 依赖安装失败
        pause
        exit /b 1
    )
    echo 依赖安装成功
    echo:
) else (
    echo 依赖已安装，跳过安装步骤
    echo:
)

REM 设置后端地址为本地
set BACKEND_BASE_URL=http://127.0.0.1:12345

REM 启动开发服务器
echo 启动前端开发服务器...
echo:
echo ============================================
echo   访问地址:
echo   - 前端页面: http://localhost:8080
echo   - 后端API: http://127.0.0.1:12345
echo ============================================
echo:
echo 提示: 首次访问或更新后可能需要等待编译完成
echo 按 Ctrl+C 停止服务
echo:

cmd /c npm run serve

pause
